// ------------------------------
// game.html 用スクリプト
// ------------------------------

// ▼ 1. グローバル変数と音声設定
let currentIndex = 0;
let correctCount = 0;
let wordList = [];
let startTime;
let timerInterval;
let translations;
let lang;
let isBgmOn = true;
let totalTypedLength = 0;

// BGMと効果音（正誤判定時）の読み込み
const bgm = document.getElementById('bgm');
const correctSound = new Audio("sounds/correct.mp3");
const incorrectSound = new Audio("sounds/incorrect.mp3");

// ▼ 2. 汎用関数

// BGMフェードイン再生
function fadeInBGM(targetVolume = 0.3, step = 0.01, interval = 100) {
  if (bgm.paused) {
    bgm.volume = 0;
    bgm.play().catch(err => console.warn("BGM再生に失敗:", err));
    const fadeIn = setInterval(() => {
      if (bgm.volume < targetVolume) {
        bgm.volume = Math.min(bgm.volume + step, targetVolume);
      } else {
        clearInterval(fadeIn);
      }
    }, interval);
  }
}

// BGM即時停止
function stopBGM() {
  bgm.pause();
  bgm.currentTime = 0;
}

// 配列をシャッフルする関数
function shuffle(array) {
  return [...array].sort(() => Math.random() - 0.5);
}

// レベルに応じて単語データを読み込む関数
async function loadWords(level) {
  const fileMap = {
    level1: 'words/level1.json',
    level2: 'words/level2.json',
    level3: 'words/level3.json',
    level4: 'words/level4.json',
  };
  const filePath = fileMap[level];
  if (!filePath) {
    console.error("未知のレベル指定:", level);
    return [];
  }
  const response = await fetch(`${filePath}?_=${Date.now()}`);
  return await response.json();
}

// ▼ 3. 言語をUIに反映

function setLanguage(lang) {
  if (!translations) return;
  const texts = translations[lang];

  document.getElementById('btnReturn').textContent = texts.game_return;
  document.getElementById("btnRetry").textContent = texts.btn_retry;
  document.getElementById("progress").textContent = `${texts.questionLabel} 1 / 10`;
  document.getElementById("enterHint").textContent = texts.enterHint;

  window.localizedText = {
    correctAnswer: texts.correctAnswer,
    incorrectAnswer: texts.incorrectAnswer,
    finishMessage: texts.game_finish,           //おつかれさまでした
    resultLabel: texts.game_result,             //結果
    scoreLabel: texts.game_score,               //スコア
    questionLabel: texts.questionLabel,         //問題
    enter_note: texts.enterHint,                //ヒント
    resultTemplate: texts.resultTemplate,       //10問中
    elapsedTime: texts.elapsedTime,             //かかった時間
    avgTime: texts.avgTime,             //平均時間
    msg_perfect: texts.msg_perfect,             //満点
    msg_good: texts.msg_good,                   //6点以上
    msg_retry: texts.msg_retry,                 //5点以下
  };
}

// ▼ 4. 初期化処理（ページ読み込み時）

window.addEventListener('load', async () => {
  lang = localStorage.getItem('lang') || 'ja';
  const level = localStorage.getItem("level");

  const [wordData, langData] = await Promise.all([
    loadWords(level),
    fetch('lang.json').then(res => res.json())
  ]);

  wordList = shuffle(wordData).slice(0, 10);
  translations = langData;
  setLanguage(lang);
  startTime = Date.now();
  document.getElementById("timer").innerText = 0;
  timerInterval = setInterval(() => {
    const seconds = Math.floor((Date.now() - startTime) / 1000);
    const timeLine = window.localizedText.elapsedTime.replace('{seconds}', seconds);
    document.getElementById("timer").innerText = seconds;
  }, 1000);
  showWord();

  // 再チャレンジボタン
  document.getElementById("btnRetry").addEventListener("click", () => {
    currentIndex = 0;
    correctCount = 0;
    totalTypedLength = 0;

    wordList = shuffle(wordList).slice(0, 10);
    startTime = Date.now();
    document.getElementById("timer").innerText = 0;

    // 結果表示リセット
    ["result-finish", "result-score", "result-time", "result-avg", "result-message"].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.textContent = "";
    });

    //BGM再開
    fadeInBGM();

    // ボタンを非表示
    document.getElementById("btnRetry").style.display = "none";

    // タイマー再スタート
    clearInterval(timerInterval);
    timerInterval = setInterval(() => {
      const seconds = Math.floor((Date.now() - startTime) / 1000);
      document.getElementById("timer").innerText = seconds;
    }, 1000);

    showWord();
  });

  const btnBgm = document.getElementById("btnToggleBgm");
  btnBgm.addEventListener("click", () => {
    if (isBgmOn) {
      stopBGM();
    } else {
      fadeInBGM();
    }
    isBgmOn = !isBgmOn;
  });

  document.getElementById("inputBox").addEventListener("keydown", function (event) {
    if (event.key === "Enter") checkAnswer();
  });

  setTimeout(() => {
    if (localStorage.getItem('playBGM') === 'true') {
      fadeInBGM();
      localStorage.removeItem('playBGM');
    }
  }, 1000);
});

// ▼ 5. 単語を表示して入力を促す

function showWord() {
  if (currentIndex >= 10) {
    clearInterval(timerInterval);
    const seconds = Math.floor((Date.now() - startTime) / 1000);
    const avgTime = totalTypedLength > 0
      ? (seconds / totalTypedLength).toFixed(2)
      : "N/A";
    const avgLineTemplate = window.localizedText.avgTime || "平均時間：{avg}秒";
    const avgLine = avgLineTemplate.replace('{avg}', avgTime);

    let message = "";
    if (correctCount === 10) {
      message = window.localizedText.msg_perfect;
    } else if (correctCount >= 6) {
      message = window.localizedText.msg_good;
    } else {
      message = window.localizedText.msg_retry;
    }

    const template = window.localizedText.resultTemplate || `10問中{correct}問正解です！`;
    const scoreLine = template.replace('{correct}', correctCount); 
    const timeLine = window.localizedText.elapsedTime.replace('{seconds}', seconds);

    // ✅ 要素ごとに null チェック
    const scoreEl = document.getElementById("result-score");
    const timeEl = document.getElementById("result-time");
    const avgEl = document.getElementById("result-avg");
    const msgEl = document.getElementById("result-message");

    if (scoreEl) scoreEl.textContent = scoreLine;
    if (timeEl) timeEl.textContent = timeLine;
    if (avgEl) avgEl.textContent = avgLine;
    if (msgEl) msgEl.textContent = message;

    //再開ボタンを表示
    document.getElementById("btnRetry").style.display = "inline-block";

    // その他表示リセット処理
    document.getElementById("result-score").innerText =
     `${window.localizedText.scoreLabel}：${correctCount} / 10`;
    document.getElementById("wordDisplay").innerText = "";
    document.getElementById("meaningDisplay").innerText = "";
    stopBGM();
    return;
  }

  const word = wordList[currentIndex];

  document.getElementById("wordDisplay").innerText = word.arabic;
  document.getElementById("meaningDisplay").innerText =
    (lang === "en" ? "Meaning: " : "意味：") + (lang === "en" ? word.english : word.meaning);
  document.getElementById("inputBox").value = "";
  document.getElementById("inputBox").focus();
  document.getElementById("progress").innerText =
   `${window.localizedText.questionLabel} ${currentIndex + 1} / 10`;
  
  ["result-finish", "result-score", "result-time", "result-avg", "result-message"].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.textContent = "";
   });   
}

// ▼ 6. 入力された回答をチェックして判定

function checkAnswer() {
  if (currentIndex >= 10) return;  // ✅ 10問終了後は処理しない

  const input = document.getElementById("inputBox").value.trim();
  totalTypedLength += input.length;

  const correct = wordList[currentIndex].arabic;

  // ✅ messageエリアだけに表示
  const messageElem = document.getElementById("result-message");

  if (input === correct) {
    correctCount++;
    correctSound.currentTime = 0;
    correctSound.play();
    messageElem.textContent = window.localizedText.correctAnswer;
    messageElem.classList.remove("incorrect");
    messageElem.classList.add("correct");
  } else {
    incorrectSound.currentTime = 0;
    incorrectSound.play();
    messageElem.textContent = `${window.localizedText.incorrectAnswer}：${correct}`;
    messageElem.classList.remove("correct");
    messageElem.classList.add("incorrect");
  }

  currentIndex++;
  setTimeout(showWord, 1000);
}
