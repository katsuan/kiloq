// これまでに持ち上げた重さの合計（js/lifted.js）のテスト。node --test test/
import test from "node:test";
import assert from "node:assert";

const { aheadOf, amountLabel, bigNumber, compareWeight, COUNTED_MAX, LANDMARKS, liftedIn, marksFor, newlyPassed, progressOf, ratioLabel, shareLabel, syncLifted, weightLabel } = await import("../js/lifted.js");

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

test("目じるしは軽い順で、いちばん先は地球。ふつうに届く範囲（〜数千 t）は細かい", () => {
  for (let i = 1; i < LANDMARKS.length; i += 1) assert.ok(LANDMARKS[i].kg > LANDMARKS[i - 1].kg, LANDMARKS[i].name);
  assert.equal(LANDMARKS[LANDMARKS.length - 1].name, "地球");
  assert.ok(LANDMARKS.some((m) => m.name === "月"));
  // 1万 kg 〜 1万 t のあいだは、となりとの差が3倍まで（1回 3〜6 t・1年 300〜500 t で、こまめに越える）
  const near = LANDMARKS.filter((m) => m.kg >= 10000 && m.kg <= 1e7);
  for (let i = 1; i < near.length; i += 1) assert.ok(near[i].kg / near[i - 1].kg <= 3, near[i].name);
  assert.equal(progressOf(3000).passedCount, 10); // 1回分で10こ越える
  assert.ok(progressOf(400000).passedCount >= 22); // 1年ぶんでジャンボジェット
});

test("次の目じるしまでの kg と、進みぐあい", () => {
  const start = progressOf(0);
  assert.equal(start.passed, null);
  assert.equal(start.next.name, "パンダ");
  assert.equal(start.toNextKg, 100);
  assert.equal(start.progress, 0);
  const car = progressOf(1500);
  assert.equal(car.passed.name, "乗用車");
  assert.equal(car.next.name, "カバ");
  assert.equal(car.toNextKg, 500);
  assert.equal(car.progress, 0);
  assert.equal(progressOf(4750).progress, 0.5); // 救急車 3.5 t とゾウ 6 t のまん中
  assert.equal(progressOf(4799.5).toNextKg, 1200.5);
});

test("地球を越えたら「地球 2個分」「3個分」…", () => {
  const earth = LANDMARKS[LANDMARKS.length - 1].kg;
  const over = progressOf(earth * 1.5);
  assert.equal(over.passed.name, "地球");
  assert.equal(over.next.name, "地球 2個分");
  assert.equal(over.next.kg, earth * 2);
  assert.equal(progressOf(earth * 2).next.name, "地球 3個分");
  assert.equal(marksFor(0).length, LANDMARKS.length);
  assert.equal(marksFor(earth * 2).length, LANDMARKS.length + 2);
});

test("新しく越えた目じるし（送ったあとの知らせ）", () => {
  assert.equal(newlyPassed(1000, 1100), null);
  assert.equal(newlyPassed(1000, 1600).name, "乗用車"); // キリンも越えたら重いほう
  assert.equal(newlyPassed(1000, 7000).name, "ゾウ");
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
  assert.equal(ratioLabel(123456), "12.3万");
  assert.equal(compareWeight(0), null);
});

test("大きな数は 万・億・兆・京・垓 で（3けたくらい）", () => {
  assert.equal(bigNumber(3000), "3,000");
  assert.equal(bigNumber(1.5), "1.5");
  assert.equal(bigNumber(12345), "1.23万");
  assert.equal(bigNumber(1240000), "124万");
  assert.equal(bigNumber(2.75e10), "275億");
  assert.equal(bigNumber(2.36e13), "23.6兆");
  assert.equal(bigNumber(5.1e15), "5,100兆");
  assert.equal(bigNumber(7.3e19), "7,300京");
  assert.equal(bigNumber(6e21), "60垓");
});

test("目じるしの重さは「約」をつけ、t からは 万・億…で", () => {
  assert.equal(weightLabel(700), "約 700 kg");
  assert.equal(weightLabel(6000), "約 6 t");
  assert.equal(weightLabel(4000000), "約 4,000 t");
  assert.equal(weightLabel(50000000), "約 5万 t");
  assert.equal(weightLabel(7.3e22), "約 7,300京 t");
  assert.equal(weightLabel(6e24), "約 60垓 t");
});

test("合計・あと何 kg：10万 kg までは kg、それより上は t", () => {
  assert.equal(amountLabel(99999), "99,999 kg");
  assert.equal(amountLabel(1234567), "1,235 t");
  assert.equal(amountLabel(2.36e16), "23.6兆 t");
  assert.equal(amountLabel(-5), "0 kg");
});

test("遠い目じるしは「あと」の代わりに「◯％」「◯分の1」", () => {
  assert.equal(shareLabel(500000, 1.24e9), "0.04％");
  assert.equal(shareLabel(500000, 2e11), "40万分の1");
  assert.equal(shareLabel(12000, 6e24), "5垓分の1");
  assert.equal(shareLabel(0, 6e24), "");
  assert.equal(shareLabel(7e24, 6e24), "");
});

test("先の目じるし：よく知られた大きな物は見せ、あいだの細かい目じるしはまとめてかくす", () => {
  const names = (rows) => rows.map((r) => (r.mark ? r.mark.name : "🔒" + r.locked));
  const big = LANDMARKS.filter((m) => m.big).map((m) => m.name);
  for (const name of ["東京タワー", "東京スカイツリー", "ギザの大ピラミッド", "月", "地球"]) assert.ok(big.includes(name), name);
  const start = names(aheadOf(0));
  assert.equal(start[start.length - 1], "地球"); // いちばん先の地球は、はじめから見える
  assert.ok(start.includes("ギザの大ピラミッド") && start.includes("月"));
  assert.ok(!LANDMARKS.some((m) => m.name === "富士山")); // 重さの数字がないので入れない
  assert.ok(!start.includes("ゾウ")); // 細かい目じるしはかくす
  assert.ok(!start.some((n, i) => n.startsWith("🔒") && start[i + 1]?.startsWith("🔒"))); // かくした数は1行にまとまる
  // かくした数と見せた数を足すと、次より先の目じるしの数になる
  const count = aheadOf(0).reduce((sum, r) => sum + (r.mark ? 1 : r.locked), 0);
  assert.equal(count, LANDMARKS.length - 1);
  // 次の目じるしは「先」に入らない・越えた物は出ない
  assert.ok(!names(aheadOf(4500000)).includes("東京タワー"));
  assert.equal(progressOf(4500000).next.name, "エッフェル塔");
  assert.ok(!names(aheadOf(4500000)).includes("エッフェル塔"));
  assert.deepEqual(aheadOf(LANDMARKS[LANDMARKS.length - 1].kg * 1.5), []); // 地球を越えたら先はない
});
