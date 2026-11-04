// 画面の部品（js/view-preview.js・js/view-input.js・js/helpers.js）のテスト。HTML の文字を返すだけなので、画面なしで確かめる。node --test test/
import test from "node:test";
import assert from "node:assert";

globalThis.localStorage = { getItem: () => null, setItem() {}, removeItem() {} };
globalThis.window = { APP_CONFIG: { LIFF_ID: "2009927582-2isjfmkk", APP_NAME: "kiloQ" } };
const XSS = "<img src=x onerror=alert(1)>"; // qcheck-ok: W8 テストの見本の文字（画面では動かさない）
const W = await import("../js/workout.js");
const { buildWorkoutFlexMessage } = await import("../js/card.js");
const P = await import("../js/view-preview.js");
const I = await import("../js/view-input.js");
const H = await import("../js/helpers.js");

// 種目1つ・セット2つの記録（名前とメモに危ない文字）
function sampleWorkout() {
  const w = W.createEmptyWorkout();
  w.title = XSS;
  w.date = "2026-11-03";
  const ex = w.exercises[0] || (w.exercises.push(W.createEmptyExercise()), w.exercises[0]);
  ex.name = XSS;
  ex.memo = XSS;
  ex.sets = [Object.assign(W.createEmptySet(), { weight: 60, reps: 10 }), Object.assign(W.createEmptySet(), { weight: 70, reps: 8 })];
  return W.hydrateWorkout(w);
}

test("送る前の見本・集計の札・たたんだ種目の要約は、名前やメモの < > を文字にする", () => {
  const w = sampleWorkout();
  const msg = buildWorkoutFlexMessage(w, {});
  const bubbles = msg.contents.type === "carousel" ? msg.contents.contents : [msg.contents];
  const html = [P.renderBubbleCarousel(w, bubbles), P.renderWorkoutExerciseStats(w), I.renderExerciseSummary(w.exercises[0])].join("");
  assert.ok(html.length > 0);
  assert.ok(!html.includes("<img"), "タグのまま入っていない");
  assert.ok(html.includes("&lt;img"), "文字として入っている");
});

test("ランキングのカードも名前を文字にする", () => {
  const html = P.renderRankingCard("ボリューム", [{ name: XSS, value: 1200 }], "kg");
  assert.ok(!html.includes("<img"));
});

test("履歴の日付の文字：「11/3」、月の見出し「2026年11月」、日付がなければ「日付なし」", () => {
  assert.equal(H.formatShortDate("2026-11-03"), "11/3");
  assert.equal(H.formatShortDate("2026/11/03"), "");
  assert.equal(H.historyMonthKey({ date: "2026-11-03" }), "2026-11");
  assert.equal(H.historyMonthKey({}), "none");
  assert.equal(H.historyMonthLabel("2026-01"), "2026年1月");
  assert.equal(H.historyMonthLabel("none"), "日付なし");
});

test("続いた週の文：今週やったか・連続中か・まだないか。「最長 ◯週」は1かたまり", () => {
  assert.match(H.renderStreak({ thisWeek: true, current: 3, best: 5 }), /いま <b>3週<\/b> 連続.*ls-nowrap">最長 <b>5週/);
  assert.match(H.renderStreak({ thisWeek: false, current: 2, best: 2 }), /連続中.*今週やれば 3週/);
  assert.match(H.renderStreak({ thisWeek: false, current: 0, best: 0 }), /^<p class="grass-streak">今週やると、連続がはじまります<\/p>$/);
});

test("LINE の名前があるか：名前なし・anonymous は名前なし", () => {
  assert.equal(H.isNamed({ displayName: "たろう" }), true);
  assert.equal(Boolean(H.isNamed({ displayName: "" })), false);
  assert.equal(Boolean(H.isNamed(null)), false);
  assert.equal(H.isNamed({ displayName: " Anonymous " }), false);
});

test("名前の頭文字（写真がないときの丸）：1字目（英字は大文字）、名前がなければ「W」", () => {
  assert.equal(I.getUserInitial("たろう"), "た");
  assert.equal(I.getUserInitial(" ken"), "K");
  assert.equal(I.getUserInitial(""), "W");
});
