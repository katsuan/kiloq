// 重さの目じるしと重さの書き方（js/lifted.js）のテスト。node --test test/
// どこまで来たか・くらべ・消しても減らない合計の計算は Q キット（q-oqrn の shared/milestones.js）のテストで確かめる
import test from "node:test";
import assert from "node:assert";

const { amountLabel, LANDMARKS, weightLabel } = await import("../js/lifted.js");

test("目じるしは軽い順で、いちばん先は地球。どれも名前・しるし・数え方がある", () => {
  for (let i = 1; i < LANDMARKS.length; i += 1) assert.ok(LANDMARKS[i].value > LANDMARKS[i - 1].value, LANDMARKS[i].name);
  for (const m of LANDMARKS) assert.ok(m.icon && m.name && m.count && m.value > 0, m.name);
  assert.equal(LANDMARKS[LANDMARKS.length - 1].name, "地球");
  assert.ok(LANDMARKS.some((m) => m.name === "月"));
  assert.ok(!LANDMARKS.some((m) => m.name === "富士山")); // 重さの数字がないので入れない
});

test("ふつうに届く範囲（〜数千 t）は細かい：1回分で10こ越え、1万 kg 〜 1万 t はとなりとの差が3倍まで", () => {
  assert.equal(LANDMARKS.filter((m) => m.value <= 3000).length, 10);
  assert.ok(LANDMARKS.filter((m) => m.value <= 400000).length >= 22); // 1年ぶんでジャンボジェット
  const near = LANDMARKS.filter((m) => m.value >= 10000 && m.value <= 1e7);
  for (let i = 1; i < near.length; i += 1) assert.ok(near[i].value / near[i - 1].value <= 3, near[i].name);
});

test("よく知られた大きな物（big）は、まだ届いていなくても表に出す", () => {
  const big = LANDMARKS.filter((m) => m.big).map((m) => m.name);
  for (const name of ["東京タワー", "東京スカイツリー", "ギザの大ピラミッド", "月", "地球"]) assert.ok(big.includes(name), name);
});

test("送る帯で使う短い呼び名は、7字まで", () => {
  for (const m of LANDMARKS) assert.ok((m.short || m.name).length <= 7, m.name);
});

test("重さの書き方：目じるしは「約」をつけ、合計は 10万 kg までは kg", () => {
  assert.equal(weightLabel(700), "約 700 kg");
  assert.equal(weightLabel(6000), "約 6 t");
  assert.equal(weightLabel(3000000), "約 3,000 t");
  assert.equal(amountLabel(99999), "99,999 kg");
  assert.equal(amountLabel(-5), "0 kg");
  assert.equal(amountLabel(1234567), "1,235 t");
});

test("大きな数（万・億…）は Q キットの QMilestones.bigNumber にまかせる", () => {
  globalThis.QMilestones = { bigNumber: (v) => "《" + v + "》" };
  try {
    assert.equal(weightLabel(6e24), "約 《" + 6e21 + "》 t");
    assert.equal(amountLabel(2.36e16), "《23600000000000》 t");
  } finally {
    delete globalThis.QMilestones;
  }
});
