// これまでに持ち上げた重さの合計（js/lifted.js）のテスト。node --test test/
import test from "node:test";
import assert from "node:assert";

const { climbOf, COUNTED_MAX, liftedIn, newlyPassed, syncLifted } = await import("../js/lifted.js");

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

test("山の高さ：1 kg が 1 cm。次の目じるしまでの kg と、進みぐあい", () => {
  const start = climbOf(0);
  assert.equal(start.meters, 0);
  assert.equal(start.passed, null);
  assert.equal(start.next.name, "奈良の大仏");
  assert.equal(start.toNextKg, 1500);
  const tower = climbOf(33300);
  assert.equal(tower.passed.name, "東京タワー");
  assert.equal(tower.next.name, "高尾山");
  assert.equal(tower.progress, 0);
  const fuji = climbOf(377600);
  assert.equal(fuji.passed.name, "富士山");
  assert.equal(fuji.next.name, "キリマンジャロ");
});

test("エベレストを越えたら「エベレスト 2つ分」「3つ分」…", () => {
  const over = climbOf(884900 + 100);
  assert.equal(over.passed.name, "エベレスト");
  assert.equal(over.next.name, "エベレスト 2つ分");
  assert.equal(over.next.m, 8849 * 2);
  assert.equal(climbOf(884900 * 2).next.name, "エベレスト 3つ分");
});

test("新しく越えた目じるし（送ったあとの知らせ）", () => {
  assert.equal(newlyPassed(1000, 1400), null);
  assert.equal(newlyPassed(1000, 1600).name, "奈良の大仏");
  assert.equal(newlyPassed(30000, 61000).name, "高尾山"); // 2つ越えたら高いほう
  assert.equal(newlyPassed(1600, 1600), null);
});
