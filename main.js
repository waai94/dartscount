/* =========================
   ダーツ盤順
========================= */

const dartNumbers = [
    20, 1, 18, 4, 13,
    6, 10, 15, 2, 17,
    3, 19, 7, 16, 8,
    11, 14, 9, 12, 5
];

/* =========================
   ゲーム設定
========================= */

const maxRound = 8;

/* =========================
   ゲーム状態
========================= */

/*
    Undoしやすいように
    投球履歴を持つ
*/
const throwHistory = [];

/* 目標点 */
let targetScore = 500;

/* =========================
   初期化
========================= */

Initialize();

/* =========================
   初期化処理
========================= */

function Initialize() {

    CreateBoard();

    BindButtons();

     
    UpdateUI();
    
}

/* =========================
   ダーツ盤生成
========================= */

function CreateBoard() {

    const outerRadius = 44;
    const middleRadius = 34;
    const innerRadius = 24;

    dartNumbers.forEach((number, index) => {

        const angle = (360 / 20) * index - 90;

        /*
            Double
        */
        CreateBoardButton(
            number,
            "D",
            number * 2,
            "doubleButton",
            outerRadius,
            angle
        );

        /*
            Single
        */
        CreateBoardButton(
            number,
            "S",
            number,
            "singleButton",
            middleRadius,
            angle
        );

        /*
            Triple
        */
        CreateBoardButton(
            number,
            "T",
            number * 3,
            "tripleButton",
            innerRadius,
            angle
        );
    });
}


function CreateBoardButton(
    number,
    label,
    score,
    className,
    radius,
    angle
) {

    const dartBoard =
        document.getElementById("dartBoard");

    const button =
        document.createElement("button");

    button.className =
        `segmentButton ${className}`;

    /*
        表示文字
    */
    button.innerText =
        `${label}${number}`;

    /*
        得点
    */
    button.dataset.score = score;

    /*
        履歴表示用
    */
    button.dataset.label =
        `${label}${number}`;

    /*
        円形配置
    */
    button.style.position = "absolute";

    button.style.left =
        `${50 + radius * Math.cos(ToRadian(angle))}%`;

    button.style.top =
        `${50 + radius * Math.sin(ToRadian(angle))}%`;

    /*
        ボタン中心補正
    */
    button.style.transform =
        "translate(-50%, -50%)";

    /*
        入力イベント
    */
    button.addEventListener(
        "click",
        OnScoreButtonClick
    );

    dartBoard.appendChild(button);
}
/* =========================
   ボタン生成
========================= */

function CreateSegmentButton(
    parent,
    label,
    score,
    className
) {

    const button = document.createElement("button");

    button.className =
        `segmentButton ${className}`;

    button.innerText = label;

    /*
        data属性に
        得点と表示名を持たせる
    */
    button.dataset.score = score;

    button.dataset.label =
        `${label}${Math.floor(score / GetMultiplier(label))}`;

    button.addEventListener("click", OnScoreButtonClick);

    parent.appendChild(button);
}

/* =========================
   倍率取得
========================= */

function GetMultiplier(label) {

    switch (label) {

        case "D":
            return 2;

        case "T":
            return 3;

        default:
            return 1;
    }
}

/* =========================
   ラジアン変換
========================= */

function ToRadian(degree) {

    return degree * Math.PI / 180;
}

/* =========================
   スコア入力
========================= */

function OnScoreButtonClick(event) {

    const button = event.currentTarget;

    const score =
        Number(button.dataset.score);

    const label =
        button.dataset.label;

    AddThrow(score, label);
}

/* =========================
   投球追加
========================= */

function AddThrow(score, label) {

    const throwIndex =
        (throwHistory.length % 3) + 1;

    const round =
        Math.floor(throwHistory.length / 3) + 1;

    if (round > maxRound) {
        return;
    }

    throwHistory.push({
        round,
        throwIndex,
        score,
        label
    });

    ShowMessage(`${label} +${score}`, 800);

    if (throwIndex === 3) {

        setTimeout(() => {

            ShowRoundTotal(round);

        }, 850);
    }

    UpdateUI();

    /*
        ★追加：8ラウンド終了チェック
    */
    const completedRounds =
        new Set(
            throwHistory.map(
                d => d.round
            )
        ).size;

    if (completedRounds >= maxRound) {

        /*
            少し遅延させると自然
        */
        setTimeout(() => {

            ShowFinish();

        }, 1200);
    }
}

function ShowRoundTotal(round) {

    const roundThrows =
        throwHistory.filter(
            data => data.round === round
        );

    const total =
        roundThrows.reduce(
            (sum, data) => sum + data.score,
            0
        );

    /*
        称号一覧

        複数対応可能にする
    */
    const bonusTexts = [];

    /* =========================
       Hattrick
       50 x 3
    ========================= */

    const isHattrick =
        roundThrows.length === 3 &&
        roundThrows.every(
            data => data.score === 50
        );

    if (isHattrick) {

        bonusTexts.push("Hattrick");
    }

    /* =========================
       Three In A Bed

       update
    ========================= */

    const isTripleOnly =
        roundThrows.every(
            data => data.label.startsWith("T")
        );

    /*
        全部同じTxxか
    */
    const firstLabel =
        roundThrows[0]?.label;

    const isSameTriple =
        roundThrows.every(
            data => data.label === firstLabel
        );

    if (
        roundThrows.length === 3 &&
        isTripleOnly &&
        isSameTriple
    ) {

        bonusTexts.push(
            "Three In A Bed"
        );
    }

    /* =========================
       Highton
    ========================= */

    if (total >= 150) {

        bonusTexts.push("Highton");
    }

    /* =========================
       Lowton
    ========================= */

    else if (total >= 100) {

        bonusTexts.push("Lowton");
    }

    /* =========================
       メッセージ生成
    ========================= */

    let message =
        `Round Total : ${total}`;

    /*
        称号表示
    */
    if (bonusTexts.length > 0) {

        message +=
            ` - ${bonusTexts.join(" / ")}`;
    }

    /*
        演出判定
    */
    const isBigAnimation =
        total >= 100 ||
        bonusTexts.length > 0;

    ShowMessage(
        message,
        1800,
        isBigAnimation
    );
}
/*
    現在表示中タイマー

    古いタイマーを止めるために使う
*/
let messageTimeoutId = null;

/* =========================
   メッセージ表示
========================= */

function ShowMessage(
    text,
    duration = 1000,
    isBigScore = false
) {

    const hitDisplay =
        document.getElementById("hitDisplay");

    /*
        前回タイマー停止
    */
    if (messageTimeoutId !== null) {

        clearTimeout(messageTimeoutId);
    }

    /*
        テキスト更新
    */
    hitDisplay.innerText = text;

    /*
        一度アニメーション解除

        これをしないと
        同じアニメーションが
        連続再生されない
    */
    hitDisplay.classList.remove(
        "bigScoreAnimation"
    );

    /*
        強制再計算

        reflow発生
    */
    void hitDisplay.offsetWidth;

    /*
        高得点演出
    */
    if (isBigScore) {

        hitDisplay.classList.add(
            "bigScoreAnimation"
        );
    }

    /*
        表示
    */
    hitDisplay.style.opacity = 1;

    /*
        非表示
    */
    messageTimeoutId = setTimeout(() => {

        hitDisplay.style.opacity = 0;

    }, duration);
}
/* =========================
   入力表示
========================= */

function ShowHit(label, score) {

    const hitDisplay =
        document.getElementById("hitDisplay");

    hitDisplay.innerText =
        `${label} +${score}`;

    hitDisplay.style.opacity = 1;

    setTimeout(() => {

        hitDisplay.style.opacity = 0;

    }, 800);
}


/* =========================
   UI更新
========================= */

function UpdateUI() {

    UpdateGameInfo();

    UpdateHistory();
    UpdateStats();
}

/* =========================
   現在情報更新
========================= */

function UpdateGameInfo() {

    const totalScore =
        throwHistory.reduce(
            (sum, data) => sum + data.score,
            0
        );

    const currentRound =
        Math.floor(throwHistory.length / 3) + 1;

    const currentThrow =
        (throwHistory.length % 3) + 1;

    document.getElementById("roundText")
        .innerText = currentRound;

    document.getElementById("throwText")
        .innerText = `${currentThrow} / 3`;

    document.getElementById("totalScoreText")
        .innerText = totalScore;

    document.getElementById("targetScoreText")
        .innerText = targetScore;

    document.getElementById("remainScoreText")
        .innerText =
        Math.max(targetScore - totalScore, 0);
}

/* =========================
   履歴更新
========================= */

function UpdateHistory() {

    const historyList =
        document.getElementById("historyList");

    historyList.innerHTML = "";

    /*
        ラウンドごとにまとめる
    */
    for (let round = 1; round <= maxRound; round++) {

        const roundThrows =
            throwHistory.filter(
                data => data.round === round
            );

        if (roundThrows.length === 0) {
            continue;
        }

        const total =
            roundThrows.reduce(
                (sum, data) => sum + data.score,
                0
            );

        const item =
            document.createElement("div");

        item.className = "historyItem";

        item.innerHTML = `
            <div>Round ${round}</div>
            <div>
                ${roundThrows.map(
            data => data.score
        ).join(" | ")}
                = ${total}
            </div>
        `;

        historyList.appendChild(item);
    }
}

/* =========================
   ボタンイベント
========================= */

function BindButtons() {

    document.getElementById("undoButton")
        .addEventListener("click", Undo);

    document.getElementById("resetButton")
        .addEventListener("click", ResetGame);

    document.getElementById("changeTargetButton")
        .addEventListener("click", ChangeTargetScore);

    /*
        Bullボタン登録
    */
    document
        .querySelectorAll(".bullButton")
        .forEach(button => {

            button.addEventListener(
                "click",
                OnBullClick
            );
        });
}

/* =========================
   Bull入力
========================= */

function OnBullClick(event) {

    const score =
        Number(event.currentTarget.dataset.score);

    const label =
        score === 50 ? "Bull" : "Outer Bull";

    AddThrow(score, label);
}

/* =========================
   Undo
========================= */

function Undo() {

    if (throwHistory.length === 0) {
        return;
    }

    throwHistory.pop();

    UpdateUI();
}

/* =========================
   リセット
========================= */

function ResetGame() {

    throwHistory.length = 0;

    const overlay =
        document.getElementById("finishOverlay");

    overlay.classList.remove("show");

    UpdateUI();
}

/* =========================
   目標変更
========================= */

function ChangeTargetScore() {

    const input =
        prompt("Target Score");

    if (input === null) {
        return;
    }

    const parsed =
        Number(input);

    if (Number.isNaN(parsed)) {
        return;
    }

    targetScore = parsed;

    UpdateUI();
}

function UpdateStats() {

    const totalScore =
        throwHistory.reduce(
            (sum, data) => sum + data.score,
            0
        );

    const totalThrows =
        throwHistory.length;
        console.log("aaa")

    const completedRounds =
        Math.ceil(totalThrows / 3);

    /*
        Round Average
    */
    const roundAverage =
        completedRounds > 0
            ? totalScore / completedRounds
            : 3;

    /*
        Dart Average
    */
    const dartAverage =
        totalThrows > 0
            ? totalScore / totalThrows
            : 0;

    document.getElementById(
        "roundAverageText"
    ).innerText =
        `Round Avg : ${roundAverage.toFixed(1)}`;

    document.getElementById(
        "dartAverageText"
    ).innerText =
        `Dart Avg : ${dartAverage.toFixed(2)}`;

        console.log(totalScore);
console.log(totalThrows);
console.log(completedRounds);
}

function ShowFinish() {

    const overlay =
        document.getElementById("finishOverlay");

    overlay.classList.add("show");
}