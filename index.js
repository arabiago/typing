// ------------------------------
// index.html 用スクリプト
// ------------------------------


// 言語ボタンのクリック処理
const langButtons = document.querySelectorAll('.lang-button');
langButtons.forEach(button => {
  button.addEventListener('click', () => {
    const selectedLang = button.getAttribute('data-lang');
    localStorage.setItem('lang', selectedLang);
    location.reload();
  });
});

// ゲームレベル選択処理
  function startGame(level) {
    localStorage.setItem('level', level);

    // ユーザー操作後にBGM再生用フラグをセット
    localStorage.setItem('playBGM', 'true');

    // 1秒後にgame.htmlへ遷移
    setTimeout(() => {
      window.location.href = 'game.html';
    }, 1000);
  }

// 言語ファイルを読み込んでトップ画面に反映
const lang = localStorage.getItem('lang') || 'ja';
fetch('lang.json')
  .then(res => res.json())
  .then(data => {
    const texts = data[lang];
    document.getElementById('mainTitle').textContent = texts.title;
    document.getElementById('btnLevel1').textContent = texts.level1;
    document.getElementById('btnLevel2').textContent = texts.level2;
    document.getElementById('btnLevel3').textContent = texts.level3;
    document.getElementById('btnLevel4').textContent = texts.level4;
    document.getElementById('noteSound').textContent = texts.note_Sound;
    document.getElementById('balloon').innerHTML = texts.balloon;
  });