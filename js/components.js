// 画面の部品（HTML 文字列を返すだけ。状態は持たない）。見た目はおくるんの Q キット（ls-*）にそろえる
// app.js から読む（import）
import {
  escapeHtml
} from "./format.js?v=202611021614";

// { 名前: 値 } を HTML の属性の文字（ name="値"）にして返す。値は書きかえて入れる
function renderAttributes(attrs) {
  return Object.keys(attrs || {})
    .map(function (key) {
      return " " + key + '="' + escapeHtml(String(attrs[key])) + '"';
    })
    .join("");
}

// 開閉できるところ（送信プレビュー・種目・履歴のカード）は、この開閉のボタン（線アイコンの down）でそろえる（文字は読み上げ用）
export function renderDisclosureToggle(options) {
  const isOpen = Boolean(options.isOpen);
  return (
    '<button class="disclosure-toggle' +
    (isOpen ? " is-open" : "") +
    '" data-action="' +
    escapeHtml(options.action) +
    '"' +
    renderAttributes(options.attrs) +
    ' aria-expanded="' +
    String(isOpen) +
    '"' +
    ' aria-label="' +
    escapeHtml((options.title ? options.title + "を" : "") + (isOpen ? "たたむ" : "ひらく")) +
    '" type="button">' +
    '<span class="disclosure-chevron ls-icon" data-icon="down" aria-hidden="true"></span>' +
    "</button>"
  );
}

// Q キットの線アイコンの HTML（Q キットの LineShareUI.iconHtml。name は shared/icons/ の名前）。inText は文の頭に置くとき（字との間。is-text）。
// app.js（type="module"）は Q キットの ui.js（defer）のあとに動く。Q キットが読めないときは何も出さない
export function lineIcon(name, inText = false) {
  return globalThis.LineShareUI ? globalThis.LineShareUI.iconHtml(name, inText ? "is-text" : "") : "";
}

// Q キットのボタン。options: { label, action, icon（線アイコンの名前）, className（"is-danger" など足すクラス）, title（読み上げ・長押しの説明）, disabled, attrs }
export function renderButton(options) {
  const title = options.title ? ' aria-label="' + escapeHtml(options.title) + '" title="' + escapeHtml(options.title) + '"' : "";
  return (
    '<button class="ls-button' +
    (options.className ? " " + escapeHtml(options.className) : "") +
    '" data-action="' +
    escapeHtml(options.action || "") +
    '"' +
    title +
    renderAttributes(options.attrs) +
    (options.disabled ? " disabled" : "") +
    ' type="button">' +
    (options.icon ? lineIcon(options.icon) : "") +
    escapeHtml(options.label || "") +
    "</button>"
  );
}

// Q キットのチップ（選ぶもの）。pressed を渡すと「選んでいる」（aria-pressed）になる
export function renderChip(options) {
  return (
    '<button class="ls-chip' +
    (options.className ? " " + escapeHtml(options.className) : "") +
    '" data-action="' +
    escapeHtml(options.action) +
    '"' +
    (options.pressed === undefined ? "" : ' aria-pressed="' + String(Boolean(options.pressed)) + '"') +
    renderAttributes(options.attrs) +
    ' type="button">' +
    escapeHtml(options.label) +
    "</button>"
  );
}

// まだ何もないとき（Q キットの ls-empty。白いカードの中に、線アイコン（icon は名前）と一言）
export function renderEmpty(icon, text) {
  return (
    '<div class="ls-panel"><div class="ls-empty"><span class="ls-empty-icon ls-icon" data-icon="' +
    escapeHtml(icon) +
    '" aria-hidden="true"></span>' +
    escapeHtml(text) +
    "</div></div>"
  );
}

// 入力の始め方（メニュー・履歴から）のボタン：線アイコン（icon は名前）＋見出し＋ひとこと
export function renderStartButton(options) {
  return (
    '<button class="input-start-button" data-action="' +
    escapeHtml(options.action) +
    '" type="button">' +
    '<span class="input-start-icon ls-icon" data-icon="' +
    escapeHtml(options.icon) +
    '" aria-hidden="true"></span>' +
    '<span class="input-start-copy"><span class="input-start-label">' +
    escapeHtml(options.label) +
    '</span><span class="input-start-sub">' +
    escapeHtml(options.sub) +
    "</span></span>" +
    "</button>"
  );
}

// Q キットの入力欄（見出し＋欄）。options.input は組み立て済みの HTML（エスケープは呼ぶ側）
export function renderField(options) {
  return [
    '<label class="ls-field' + (options.className ? " " + escapeHtml(options.className) : "") + '">',
    '  <span class="ls-label">' + escapeHtml(options.label) + "</span>",
    "  " + options.input,
    "</label>"
  ].join("");
}

// 画面下から出るシート（Q キットの ls-sheet。表示設定・トレーニングメニュー）。外側か「閉じる」で closeAction を送る
//   options: { label（読み上げ用の名前）, title（見出し）, closeAction, className, body（中身の HTML） }
export function renderSheet(options) {
  const closeAction = escapeHtml(options.closeAction);
  return [
    '<div class="ls-sheet" data-sheet-close="' + closeAction + '">',
    '  <section class="ls-sheet-card' +
      (options.className ? " " + escapeHtml(options.className) : "") +
      '" role="dialog" aria-modal="true" aria-label="' +
      escapeHtml(options.label) +
      '">',
    '    <div class="sheet-head">',
    '      <h3 class="ls-sheet-title">' + escapeHtml(options.title) + "</h3>",
    '      <button class="ls-button sheet-close" data-action="' + closeAction + '" type="button">閉じる</button>',
    "    </div>",
    options.body,
    "  </section>",
    "</div>"
  ].join("");
}
