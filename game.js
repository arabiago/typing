// ------------------------------
// game.html 用スクリプト
// ------------------------------

// ▼ 1. グローバル変数と音声設定
let currentIndex = 0;
let correctCount = 0;
let wordList = [];
let startTime;
let translations;

// BGMと効果音（正誤判定時）の読み込み
const bgm = document.getElementById('bgm');
const correctSound = new Audio("sounds/correct.mp3");
const incorrectSound = new Audio("sounds/incorrect.mp3");

// ▼ 2. 汎用関数

// BGMフェードイン再生
function fadeInBGM(targetVolume = 0.3, step = 0.01, interval = 100) {
  bgm.play();
  const fadeIn = setInterval(() => {
    if (bgm.volume < targetVolume) {
      bgm.volume = Math.min(bgm.volume + step, targetVolume);
    } else {
      clearInterval(fadeIn);
    }
  }, interval);
}

// BGMフェードアウト停止
function fadeOutBGM(step = 0.01, interval = 100) {
  const fadeOut = setInterval(() => {
    if (bgm.volume > 0) {
      bgm.volume = Math.max(bgm.volume - step, 0);
    } else {
      clearInterval(fadeOut);
      bgm.pause();
      bgm.currentTime = 0;
    }
  }, interval);
}


// 配列をシャッフルする関数（簡易版）
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

  window.localizedText = {
    resultLabel: texts.game_result,
    scoreLabel: texts.game_score,
    finishMessage: texts.game_finish,
    correctAnswer: texts.correctAnswer,
    incorrectAnswer: texts.incorrectAnswer,
    msg_perfect: texts.msg_perfect,
    msg_good: texts.msg_good,
    msg_retry: texts.msg_retry,
    questionLabel: texts.questionLabel,
    enter_note: texts.enterHint,
    resultTemplate: texts.resultTemplate,
    elapsedTime: texts.elapsedTime 
  };

  document.getElementById("enterHint").textContent = texts.enterHint;
  document.getElementById("progress").textContent = `${texts.questionLabel} 1 / 10`;
}

// ▼ 4. 初期化処理（ページ読み込み時）

window.addEventListener('load', async () => {
  setTimeout(() => {
    fadeInBGM();
  }, 1000);
  
  const lang = localStorage.getItem('lang') || 'ja';
  const level = localStorage.getItem("level");

  const [wordData, langData] = await Promise.all([
    loadWords(level),
    fetch('lang.json').then(res => res.json())
  ]);

    //ランダムに10問表示
    wordList = shuffle(wordData).slice(0, 10);
    translations = langData;
    setLanguage(lang);
    startTime = Date.now();
    showWord();

    // Enterキーで回答チェック
    document.getElementById("inputBox").addEventListener("keydown", function (event) {
        if (event.key === "Enter") checkAnswer();
    });
});

// ▼ 5. 単語を表示して入力を促す

// 単語を画面に表示（1問ごと）
function showWord() {
  if (currentIndex >= 10) {
    const seconds = Math.floor((Date.now() - startTime) / 1000);
    const lang = localStorage.getItem("lang") || "ja";

    // 得点に応じてメッセージ変更
    let message = "";
    if (correctCount === 10) {
      message = window.localizedText.msg_perfect;
    } else if (correctCount >= 6) {
      message = window.localizedText.msg_good;
    } else {
      message = window.localizedText.msg_retry;
    }

    // 結果メッセージの多言語対応
    const template = window.localizedText.resultTemplate || `10問中{correct}問正解です！`;
    const scoreLine = template.replace('{correct}', correctCount); 
    const timeLine = window.localizedText.elapsedTime.replace('{seconds}', seconds);
    const resultElem = document.getElementById("result");
    resultElem.classList.remove("correct", "incorrect");

    document.getElementById("result").innerHTML = `
    ${window.localizedText.finishMessage}<br>${scoreLine}<br><br>${message}`;
    document.getElementById("score").innerText = `${window.localizedText.scoreLabel}：${correctCount} / 10`;
    document.getElementById("timer").innerText = timeLine;
    document.getElementById("wordDisplay").innerText = "";
    document.getElementById("meaningDisplay").innerText = "";
    document.getElementById("progress").innerText = "";
    fadeOutBGM();
    return;
    } 

   // 画面リセットとBGM停止
    const word = wordList[currentIndex];
    const lang = localStorage.getItem("lang") || "ja";

    // 通常表示処理
    document.getElementById("wordDisplay").innerText = word.arabic;
    document.getElementById("meaningDisplay").innerText =
        (lang === "en" ? "Meaning: " : "意味：") + (lang === "en" ? word.english : word.meaning);
    document.getElementById("inputBox").value = "";
    document.getElementById("result").innerText = "";
    document.getElementById("progress").innerText = `${window.localizedText.questionLabel} ${currentIndex + 1} / 10`;
    document.getElementById("inputBox").focus();
    }

// ▼ 6. 入力された回答をチェックして判定

function checkAnswer() {
  const input = document.getElementById("inputBox").value.trim();
  const correct = wordList[currentIndex].arabic;
  const resultElem = document.getElementById("result");

  if (input === correct) {
    correctCount++;
    correctSound.currentTime = 0;
    correctSound.play();
    resultElem.innerText = window.localizedText.correctAnswer;
    resultElem.classList.remove("incorrect");
    resultElem.classList.add("correct");
  } else {
    incorrectSound.currentTime = 0;
    incorrectSound.play();
    resultElem.innerText = `${window.localizedText.incorrectAnswer}：${correct}`;
    resultElem.classList.remove("correct");
    resultElem.classList.add("incorrect");
  }

  currentIndex++;
  setTimeout(showWord, 1000);
}
