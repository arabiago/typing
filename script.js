// ------------------------------
// 1. 定数・状態変数の定義
// ------------------------------
let currentIndex = 0;
let correctCount = 0;
let wordList = [];
let startTime;
let translations;

// 効果音
const correctSound = new Audio("sounds/correct.mp3");
const incorrectSound = new Audio("sounds/incorrect.mp3");

// BGM設定
const bgm = document.getElementById('bgm');
bgm.volume = 0;
bgm.loop = true;

// ------------------------------
// 2. 汎用関数
// ------------------------------
function shuffle(array) {
  return [...array].sort(() => Math.random() - 0.5);
}

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

  const response = await fetch(`${filePath}?_=${Date.now()}`); // キャッシュ回避
  const data = await response.json();
  return data || [];
}

// BGMフェードイン
function fadeInBGM(targetVolume = 0.3, step = 0.01, interval = 100) {
  bgm.play();
  const fadeInInterval = setInterval(() => {
    if (bgm.volume < targetVolume) {
      bgm.volume = Math.min(bgm.volume + step, targetVolume);
    } else {
      clearInterval(fadeInInterval);
    }
  }, interval);
}

// BGMフェードアウト
function fadeOutBGM(step = 0.01, interval = 100) {
  const fadeOutInterval = setInterval(() => {
    if (bgm.volume > 0) {
      bgm.volume = Math.max(bgm.volume - step, 0);
    } else {
      clearInterval(fadeOutInterval);
      bgm.pause();
      bgm.currentTime = 0;
    }
  }, interval);
}

// 言語切り替え処理
function setLanguage(lang) {
  if (!translations) return;

  const texts = translations[lang];

  // index.html 用
  if (document.getElementById('title')) {
    document.getElementById('title').textContent = texts.title;
    document.getElementById('description').textContent = texts.description;
    document.getElementById('btnLevel1').innerHTML = texts.level1;
    document.getElementById('btnLevel2').innerHTML = texts.level2;
    document.getElementById('btnLevel3').innerHTML = texts.level3;
    document.getElementById('btnLevel4').innerHTML = texts.level4;
  }

  // game.html 用
  if (document.getElementById('btnReturn')) {
    document.getElementById('btnReturn').textContent = texts.game_return;

    window.localizedText = {
      resultLabel: texts.game_result,
      scoreLabel: texts.game_score,
      finishMessage: texts.game_finish,
      questionLabel: texts.questionLabel,
      correctAnswer: texts.correctAnswer,
      incorrectAnswer: texts.incorrectAnswer,
      msg_perfect: texts.msg_perfect,
      msg_good: texts.msg_good,
      msg_retry: texts.msg_retry,
      resultTemplate: texts.resultTemplate, // ← これも忘れずに
      enterHint: texts.enterHint
    };

  // 問題⇒Question:x/10

  document.getElementById("progress").innerText =
      `${window.localizedText.questionLabel} ${currentIndex + 1} / 10`;


    // 入力完了したらEnterキーを押してね

    if (document.getElementById("enterHint")) {
      document.getElementById("enterHint").textContent = texts.enterHint;
    }


  }
}

// ------------------------------
// 3. イベント：ページ読み込み時
// ------------------------------
window.addEventListener('load', async () => {
  fadeInBGM();

  const level = localStorage.getItem("level");
  wordList = shuffle(await loadWords(level)).slice(0, 10);
  startTime = Date.now();
  showWord();

  const inputBox = document.getElementById("inputBox");
  inputBox.addEventListener("keydown", function (event) {
    if (event.key === "Enter") {
      checkAnswer();
    }
  });

  // 多言語設定読み込み
  fetch('lang.json')
    .then(res => res.json())
    .then(data => {
      translations = data;
      const lang = localStorage.getItem('lang') || 'ja';
      setLanguage(lang);
    });
});

// ------------------------------
// 4. ゲーム処理本体
// ------------------------------
function showWord() {
  if (currentIndex >= 10) {
    const elapsedSeconds = Math.floor((Date.now() - startTime) / 1000);

    // ✅ 言語別メッセージ取得
    let message = "";
    if (correctCount === 10) {
      message = window.localizedText.msg_perfect;
    } else if (correctCount >= 6) {
      message = window.localizedText.msg_good;
    } else {
      message = window.localizedText.msg_retry;
    }

    // ✅ テンプレートメッセージ（前の回答と組み合わせ）
    const resultText = window.localizedText.resultTemplate.replace("{correct}", correctCount);
    document.getElementById("result").innerHTML = [
      window.localizedText.finishMessage,
      resultText,
      message
    ].map(line => `<p>${line}</p>`).join('');


    document.getElementById("score").innerText =
      `${window.localizedText.scoreLabel}：${correctCount} / 10`;

    document.getElementById("timer").innerText =
      localStorage.getItem("lang") === 'en'
        ? `Time: ${elapsedSeconds} sec`
        : `経過時間：${elapsedSeconds}秒`;

    document.getElementById("wordDisplay").innerText = "";
    document.getElementById("meaningDisplay").innerText = "";
    document.getElementById("progress").innerText = "";
    fadeOutBGM();
    return;
  }
  const word = wordList[currentIndex];
  document.getElementById("wordDisplay").innerText = word.arabic;

  const lang = localStorage.getItem("lang") || "ja";
  const meaningText = lang === "en" ? word.english : word.meaning;
  document.getElementById("meaningDisplay").innerText =
  (lang === "en" ? "Meaning: " : "意味：") + meaningText;  document.getElementById("inputBox").value = "";
    
  document.getElementById("result").innerText = "";
document.getElementById("progress").innerText =
  `${window.localizedText.questionLabel} ${currentIndex + 1} / 10`;
    document.getElementById("inputBox").focus();
}

function checkAnswer() {
  const input = document.getElementById("inputBox").value.trim();
  const correct = wordList[currentIndex].arabic;
  const resultElem = document.getElementById("result");

if (input === correct) {
  correctCount++;
  correctSound.currentTime = 0;
  correctSound.play();
  resultElem.innerText = window.localizedText.correctAnswer;
} else {
  incorrectSound.currentTime = 0;
  incorrectSound.play();
  resultElem.innerText = `${window.localizedText.incorrectAnswer}：${correct}`;
}

  currentIndex++;
  setTimeout(showWord, 1000);
}
