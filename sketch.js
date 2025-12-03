// 中原中也の詩「サーカス」
const poemText = `幾時代かがありまして
　　茶色い戦争ありました

幾時代かがありまして
　　冬は疾風吹きました

幾時代かがありまして
　　今夜此処での一と殷盛り
　　　　今夜此処での一と殷盛り

サーカス小屋は高い梁
　　そこに一つのブランコだ
見えるともないブランコだ

頭倒さに手を垂れて
　　汚れ木綿の屋蓋のもと
ゆあーん　ゆよーん　ゆやゆよん

それの近くの白い灯が
　　安値いリボンと息を吐き

観客様はみな鰯
　　咽喉が鳴ります牡蠣殻と
ゆあーん　ゆよーん　ゆやゆよん


屋外は真ッ闇　闇の闇
　　夜は劫々と更けまする
　　落下傘奴のノスタルヂアと
ゆあーん　ゆよーん　ゆやゆよん`;

// 各文字のオブジェクトを格納する配列
let characters = [];
let soundYuan, soundYuyon, soundYuyayuyon;

// アニメーション用の物理パラメータ
const spring = 0.05;  // バネの強さ（大きいほど速く元の位置に戻る）
const damping = 0.8; // 減衰力（大きいほど振動が収まりやすい）
const repulsionRadius = 80; // マウスカーソルから文字が逃げ始める距離

// 音声ファイルを事前に読み込む
function preload() {
  soundYuan = loadSound('ゆやーん.wav');
  soundYuyon = loadSound('ゆよーん.wav');
  soundYuyayuyon = loadSound('ゆやゆよん.wav');
}

function setup() {
  createCanvas(windowWidth, windowHeight);
  // フォントを指定します。'serif'は多くの環境で明朝体に近いフォントになります。
  textFont('serif');
  textAlign(CENTER, CENTER); // 文字の中心を基準にする
  initializeCharacters();
  noCursor(); // デフォルトのカーソルを非表示にする
}

// 音声再生を開始するために、最初に一度クリックが必要
function mousePressed() {
  userStartAudio();
}

function draw() {
  background(255); // 背景は白

  // すべての文字を更新して描画
  for (let char of characters) {
    char.update();
    char.display();
  }

  // --- グラデーションのかかったカスタムカーソルを描画 ---
  push();
  noStroke();
  // 半透明の円を重ねてグラデーション効果を作る
  let maxRadius = 15; // カーソルの外側の半径
  for (let r = maxRadius; r > 0; r--) {
    // 半径に応じて透明度を計算（中心が濃く、外側が薄くなる）
    let alpha = map(r, 0, maxRadius, 50, 0);
    fill(0, alpha); // 黒色＋透明度
    ellipse(mouseX, mouseY, r * 2, r * 2);
  }
  fill(0); // 中心に小さな黒い点を描画
  ellipse(mouseX, mouseY, 2, 2);
  pop();
  // --- カスタムカーソルの描画終了 ---

  // クレジットを常に表示
  push();
  textAlign(CENTER, BOTTOM);
  textSize(14);
  fill(150);
  noStroke();
  text("中原中也「山羊のうた　サーカス」", width / 2, height - 60);
  pop();
}

// --- 追加ここから ---
// ウィンドウサイズが変更されたときに自動的に呼ばれる関数
function windowResized() {
  // キャンバスのサイズを新しいウィンドウサイズに合わせる
  resizeCanvas(windowWidth, windowHeight);
  // 文字の配列を一度空にして、新しいサイズで文字の位置を再計算する
  characters = [];
  initializeCharacters();
}
// --- 追加ここまで ---

function touchMoved() {
  return false;
}

function touchStarted() {
  userStartAudio();
}

// 最初の文字配置を計算する関数
function initializeCharacters() {
  const lines = poemText.split('\n');
  const initialFontSize = 20; // 最初の文字サイズ
  const lineSpacing = 45;     // 行間（縦書きの列の間隔）

  // 最長の行を見つけて、詩全体を画面の中央に来るように調整（垂直方向の中心）
  let longestLineLength = 0;
  lines.forEach(line => {
    if (line.length > longestLineLength) {
      longestLineLength = line.length;
    }
  });
  const totalBlockHeight = longestLineLength * initialFontSize;
  const startY = (height - totalBlockHeight) / 2;

  // --- 水平方向の中心を計算するロジックを修正 ---
  // 1. 詩全体のブロックとしての幅を計算します
  const totalPoemWidth = (lines.length - 1) * lineSpacing;
  
  // 2. ブロック全体が画面の中央に来るように、最初の列（一番右）のx座標を計算します
  let x = (width / 2) + (totalPoemWidth / 2);
  // --- 修正ここまで ---

  for (const line of lines) {
    // この行が擬音語の行かどうかを判定
    const isSpecialLine = line.trim().startsWith('ゆあーん');
    let specialCharCounter = 0; // 擬音語の行の文字を数えるカウンター

    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      // スペースはアニメーションさせないのでスキップ
      if (char.trim() === '') continue;

      const yPos = startY + i * initialFontSize;
      const charPos = createVector(x, yPos);

      // 音声再生判定用に、擬音語の行の文字にだけインデックスを振る
      let charIndexForSound = -1;
      if (isSpecialLine) {
        charIndexForSound = specialCharCounter;
        specialCharCounter++;
      }
      
      characters.push(new Character(char, charPos, initialFontSize, isSpecialLine, charIndexForSound));
    }
    x -= lineSpacing; // 次の列へ（左へ移動）
  }
}

// 文字一つ一つを管理するクラス
class Character {
  constructor(char, pos, size, isSpecial = false, charIndex = -1) {
    this.char = char;
    this.initialPos = pos.copy(); // 初期位置を記憶
    this.initialSize = size;      // 初期サイズを記憶
    this.isSpecial = isSpecial;   // この文字が特別かどうか
    this.charIndex = charIndex;   // 行の中での文字の位置

    // 現在の状態
    this.pos = pos.copy();
    this.vel = createVector(0, 0); // 速度
    this.acc = createVector(0, 0); // 加速度
    this.currentSize = size;
    this.currentAngle = 0;

    // 目標の状態
    this.targetSize = size;
    this.targetAngle = 0;

    // --- アニメーションの個性を決めるパラメータ ---
    // 特別な文字はより強く、それ以外は控えめに反応する
    this.forceMultiplier = isSpecial ? random(2.0, 3.0) : random(0.2, 0.6);
    // 特別な文字はより大きく、それ以外は少しだけ大きくなる
    this.sizeMultiplierMin = isSpecial ? 6 : 1.2;
    this.sizeMultiplierMax = isSpecial ? 13 : 2.0;
  }

  // 文字の状態を更新するメソッド（アニメーションの心臓部）
  update() {
    // --- マウスからの反発力と、元の位置に戻る力を計算 ---

    let mouse = createVector(mouseX, mouseY);
    let dist = p5.Vector.dist(this.pos, mouse);

    let springForce = p5.Vector.sub(this.initialPos, this.pos);
    springForce.mult(spring);
    this.acc.add(springForce);

    if (dist < repulsionRadius) {
      let repulsionForce = p5.Vector.sub(this.pos, mouse);
      let forceMagnitude = map(dist, 0, repulsionRadius, 15, 0);
      forceMagnitude *= this.forceMultiplier;
      repulsionForce.setMag(forceMagnitude);
      this.acc.add(repulsionForce);
      
      // --- 音声再生処理 (バグ修正版) ---
      if (this.isSpecial) {
        // "ゆあーん" (index 0-3)
        if (this.charIndex >= 0 && this.charIndex <= 3 && !soundYuan.isPlaying()) {
          soundYuan.play();
        } 
        // "ゆよーん" (index 4-7)
        else if (this.charIndex >= 4 && this.charIndex <= 7 && !soundYuyon.isPlaying()) {
          soundYuyon.play();
        } 
        // "ゆやゆよん" (index 8-12)
        else if (this.charIndex >= 8 && this.charIndex <= 12 && !soundYuyayuyon.isPlaying()) {
          soundYuyayuyon.play();
        }
      }

      if (this.targetSize === this.initialSize) {
        this.targetSize = random(this.initialSize * this.sizeMultiplierMin, this.initialSize * this.sizeMultiplierMax);
      }
    } else {
      this.targetSize = this.initialSize;
    }

    // --- 物理演算で位置を更新 ---
    this.vel.add(this.acc);
    this.vel.mult(damping);
    this.pos.add(this.vel);
    this.acc.mult(0); // 次のフレームのために加速度をリセット

    // --- 見た目を滑らかに変化させる ---
    this.currentSize = lerp(this.currentSize, this.targetSize, 0.1);
    this.currentAngle = lerp(this.currentAngle, this.targetAngle, 0.1);
  }

  // 文字を描画するメソッド
  display() {
    push();
    translate(this.pos.x, this.pos.y);
    rotate(this.currentAngle);

    if (this.char === 'ー') {
      rotate(PI / 2);
    }

    fill(100);
    noStroke();
    textSize(this.currentSize);
    text(this.char, 0, 0);
    pop();
  }
}




