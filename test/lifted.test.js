// これまでに持ち上げた重さの合計（js/lifted.js）のテスト。node --test test/
import test from "node:test";
import assert from "node:assert";

const { compareWeight, COUNTED_MAX, LANDMARKS, liftedIn, marksFor, newlyPassed, progressOf, ratioLabel, syncLifted, weightLabel } = await import("../js/lifted.js");

test("はじめては、今ある記録を1回だけ数える。もう一度合わせても増えない（2回入らない）", () => {
  const first = syncLifted(null, [{ id: "a", kg: 1000 }, { id: "b", kg: 500.5 }]);
  assert.equal(first.ledger.total, 1500.5);
  assert.equal(first.added, 1500.5);
  const again = syncLifted(first.ledger, [{ id: "a", kg: 1000 }, { id: "b", kg: 500.5 }]);
  assert.equal(again.ledger.total, 1500.5);
  assert.equal(again.added, 0);
});

test("記録を足したら合計に足す", () => {
  const { ledger } = syncLifted(null, [{ id: "a", kg: 1000 }]);
  const next = syncLifted(ledger, [{ id: "c", kg: 300 }, { id: "a", kg: 1000 }]);
  assert.equal(next.ledger.total, 1300);
  assert.equal(next.added, 300);
});

test("記録を消しても・10件をこえて古い記録が消えても、合計は減らない。「元に戻す」で戻っても2回数えない", () => {
  const { ledger } = syncLifted(null, [{ id: "a", kg: 1000 }, { id: "b", kg: 500 }]);
  const deleted = syncLifted(ledger, [{ id: "b", kg: 500 }]);
  assert.equal(deleted.ledger.total, 1500);
  const none = syncLifted(deleted.ledger, []);
  assert.equal(none.ledger.total, 1500);
  const undone = syncLifted(none.ledger, [{ id: "a", kg: 1000 }, { id: "b", kg: 500 }]);
  assert.equal(undone.ledger.total, 1500);
});

test("同じ記録を直したら、差の分だけ合計を直す（減らす直しもある）", () => {
  const { ledger } = syncLifted(null, [{ id: "a", kg: 1000 }, { id: "b", kg: 500 }]);
  const up = syncLifted(ledger, [{ id: "a", kg: 1200 }, { id: "b", kg: 500 }]);
  assert.equal(up.ledger.total, 1700);
  assert.equal(up.added, 200);
  const down = syncLifted(up.ledger, [{ id: "a", kg: 900 }, { id: "b", kg: 500 }]);
  assert.equal(down.ledger.total, 1400);
  assert.equal(down.added, -300);
  // 直したあとに消しても、直した分のまま減らない
  assert.equal(syncLifted(down.ledger, [{ id: "b", kg: 500 }]).ledger.total, 1400);
});

test("小数の足し引きでずれない・id のない記録とマイナスは数えない", () => {
  let ledger = null;
  for (let i = 0; i < 10; i += 1) ledger = syncLifted(ledger, [{ id: "w" + i, kg: 0.1 }]).ledger;
  assert.equal(ledger.total, 1);
  assert.equal(syncLifted(ledger, [{ kg: 100 }, { id: "", kg: 100 }, { id: "x", kg: -50 }]).ledger.total, 1);
});

test("覚える id は COUNTED_MAX 件まで（新しいものを残す）", () => {
  let ledger = null;
  for (let i = 0; i < COUNTED_MAX + 5; i += 1) ledger = syncLifted(ledger, [{ id: "w" + i, kg: 1 }]).ledger;
  assert.equal(ledger.counted.length, COUNTED_MAX);
  assert.equal(ledger.counted[0][0], "w" + (COUNTED_MAX + 4));
  assert.equal(ledger.total, COUNTED_MAX + 5);
});

test("端末から読んだ形がおかしいときは使わない（同じ id は1つに）", () => {
  assert.equal(liftedIn(null), null);
  assert.equal(liftedIn({ total: "x", counted: [] }), null);
  assert.equal(liftedIn({ total: -1, counted: [] }), null);
  assert.deepEqual(liftedIn({ total: 10, counted: [["a", 5], ["a", 7], [1, 2], "x"] }), { total: 10, counted: [["a", 5]] });
});

test("目じるしは軽い順で、1回分（3〜6 t）でも最初から3つ越えられる", () => {
  for (let i = 1; i < LANDMARKS.length; i += 1) assert.ok(LANDMARKS[i].kg > LANDMARKS[i - 1].kg, LANDMARKS[i].name);
  assert.equal(progressOf(3000).passedCount, 4); // パンダ・ヒグマ・乳牛・乗用車
  assert.equal(progressOf(1000).passedCount, 3);
});

test("次の目じるしまでの kg と、進みぐあい", () => {
  const start = progressOf(0);
  assert.equal(start.passed, null);
  assert.equal(start.next.name, "パンダ");
  assert.equal(start.toNextKg, 100);
  assert.equal(start.progress, 0);
  const car = progressOf(1500);
  assert.equal(car.passed.name, "乗用車");
  assert.equal(car.next.name, "ゾウ");
  assert.equal(car.toNextKg, 4500);
  assert.equal(car.progress, 0);
  const half = progressOf(3750);
  assert.equal(half.progress, 0.5);
  assert.equal(progressOf(4799.5).toNextKg, 1200.5);
});

test("いちばん上（タイタニック号）を越えたら「タイタニック号 2隻分」「3隻分」…", () => {
  const top = LANDMARKS[LANDMARKS.length - 1];
  const over = progressOf(top.kg + 1);
  assert.equal(over.passed.name, "タイタニック号");
  assert.equal(over.next.name, "タイタニック号 2隻分");
  assert.equal(over.next.kg, top.kg * 2);
  assert.equal(progressOf(top.kg * 2).next.name, "タイタニック号 3隻分");
  assert.equal(marksFor(0).length, LANDMARKS.length);
});

test("新しく越えた目じるし（送ったあとの知らせ）", () => {
  assert.equal(newlyPassed(1000, 1400), null);
  assert.equal(newlyPassed(1000, 1600).name, "乗用車");
  assert.equal(newlyPassed(1000, 7000).name, "ゾウ"); // 2つ越えたら重いほう
  assert.equal(newlyPassed(6000, 6000), null);
  assert.equal(newlyPassed(0, 100).name, "パンダ"); // ちょうどで越えた
});

test("今日の重さは、1つ分にいちばん近い目じるしでくらべる（「ゾウ 0.9 頭分」）", () => {
  const elephant = compareWeight(5400);
  assert.equal(elephant.mark.name, "ゾウ");
  assert.equal(ratioLabel(elephant.ratio), "0.9");
  const car = compareWeight(1600);
  assert.equal(car.mark.name, "乗用車");
  assert.equal(ratioLabel(car.ratio), "1.1");
  assert.equal(compareWeight(6000).mark.name, "ゾウ");
  assert.equal(compareWeight(50).mark.name, "パンダ"); // いちばん軽いものより軽い
  assert.equal(ratioLabel(compareWeight(50).ratio), "0.5");
  assert.equal(ratioLabel(compareWeight(LANDMARKS[LANDMARKS.length - 1].kg * 12).ratio), "12"); // 10 からは整数
  assert.equal(compareWeight(0), null);
});

test("目じるしの重さの書き方（「約」をつける）", () => {
  assert.equal(weightLabel(700), "約 700 kg");
  assert.equal(weightLabel(6000), "約 6 t");
  assert.equal(weightLabel(4000000), "約 4,000 t");
  assert.equal(weightLabel(50000000), "約 5万 t");
});
