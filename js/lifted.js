// キロっく：これまでに持ち上げた重さの合計（記録を消しても、10件をこえて古い記録が消えても減らさない）と、それを山の高さにたとえる計算。画面には触らない（テストで呼ぶ）
// 読むところ：app.js（端末に残す読み書きは js/store.js の loadLifted・saveLifted）
//
// 合計は、記録の履歴（liff-workout-history。つづくも読むので形を変えない）とは別に残す（kiloq:lifted）。
//   { total: 合計の kg, counted: [[記録の id, 数えた kg], ...] }
// counted は、もう数えた記録。同じ記録を2回数えないため・同じ id の記録が書きかわったら差の分だけ直すために覚える（新しいものから COUNTED_MAX 件）
// 履歴から消えた記録は、数えたまま（合計から引かない）

export const COUNTED_MAX = 300; // 履歴は10件までなので、これだけ覚えていれば「元に戻す」で戻った記録も2回数えない
export const KG_PER_METER = 100; // 1 kg を 1 cm として高さにする（ふつうの1回 3,000〜6,000 kg で 30〜60 m。週2回で、富士山まで1年たらず）

// 高さの目じるし（低い順。m）。エベレストのあとは「エベレスト 2つ分」…と続ける
export const LANDMARKS = [
  { name: "奈良の大仏", m: 15 },
  { name: "東京ドーム", m: 56 },
  { name: "通天閣", m: 108 },
  { name: "東京タワー", m: 333 },
  { name: "高尾山", m: 599 },
  { name: "東京スカイツリー", m: 634 },
  { name: "筑波山", m: 877 },
  { name: "伊吹山", m: 1377 },
  { name: "大山（鳥取）", m: 1729 },
  { name: "富士山の五合目", m: 2305 },
  { name: "槍ヶ岳", m: 3180 },
  { name: "富士山", m: 3776 },
  { name: "キリマンジャロ", m: 5895 },
  { name: "エベレスト", m: 8849 }
];
const EVEREST = LANDMARKS[LANDMARKS.length - 1].m;

// 0.1 kg にそろえる（足し引きで出る小さなずれを残さない）
const round1 = (v) => Math.round(v * 10) / 10;

// 端末から読んだ中身を、合計の形にして返す（読めないものは null。はじめて開いたときも null）
export function liftedIn(value) {
  if (!value || typeof value !== "object" || !Array.isArray(value.counted)) return null;
  const total = Number(value.total);
  if (!Number.isFinite(total) || total < 0) return null;
  const counted = value.counted
    .filter((row) => Array.isArray(row) && typeof row[0] === "string" && row[0] && Number.isFinite(Number(row[1])))
    .filter((row, i, rows) => rows.findIndex((r) => r[0] === row[0]) === i) // 同じ id は前のもの1つ
    .map((row) => [row[0], Number(row[1])])
    .slice(0, COUNTED_MAX);
  return { total: round1(total), counted };
}

/**
 * 履歴（[{ id, kg }]）のうち、まだ数えていない記録を合計に足す。同じ id で kg が変わった記録（直した記録）は差の分だけ直す。
 * 履歴にない記録（消した・古くて消えた）は、合計から引かない。ledger が null（はじめて）なら、今ある記録を1回だけ数える。
 * { ledger: 新しい合計, added: 増えた kg（直して減ったときはマイナス） } を返す
 */
export function syncLifted(ledger, items) {
  const base = liftedIn(ledger) || { total: 0, counted: [] };
  const known = new Map(base.counted);
  let added = 0;
  const fresh = [];
  for (const item of items) {
    if (!item || typeof item.id !== "string" || !item.id) continue;
    const kg = round1(Math.max(0, Number(item.kg) || 0));
    if (known.has(item.id)) {
      const diff = kg - known.get(item.id);
      if (diff !== 0) {
        added += diff;
        known.set(item.id, kg);
      }
      continue;
    }
    known.set(item.id, kg);
    fresh.push([item.id, kg]);
    added += kg;
  }
  // 新しく数えた記録を前に（古いものから COUNTED_MAX をこえた分を外す）
  const rest = base.counted.map(([id]) => [id, known.get(id)]);
  const counted = [...fresh, ...rest].slice(0, COUNTED_MAX);
  return { ledger: { total: round1(Math.max(0, base.total + added)), counted }, added: round1(added) };
}

/**
 * 合計の kg を山の高さにして返す：{ meters, passed（越えた目じるし。なければ null）, next（次の目じるし）, toNextKg, progress（前の目じるしから次までの 0〜1） }
 * エベレストを越えたら、次は「エベレスト 2つ分」「3つ分」…
 */
export function climbOf(totalKg) {
  const kg = Math.max(0, Number(totalKg) || 0);
  const meters = kg / KG_PER_METER;
  const marks = LANDMARKS.slice();
  if (meters >= EVEREST) {
    const laps = Math.floor(meters / EVEREST);
    for (let n = 2; n <= laps + 1; n += 1) marks.push({ name: "エベレスト " + n + "つ分", m: EVEREST * n });
  }
  const nextIndex = marks.findIndex((mark) => mark.m > meters);
  const next = marks[nextIndex];
  const passed = nextIndex > 0 ? marks[nextIndex - 1] : null;
  const from = passed ? passed.m : 0;
  return {
    meters,
    passed,
    next,
    toNextKg: Math.max(0, Math.ceil((next.m * KG_PER_METER - kg) * 10) / 10),
    progress: Math.min(1, Math.max(0, (meters - from) / (next.m - from)))
  };
}

// 合計が before から after に増えたとき、新しく越えた目じるし（いちばん高いもの）。越えていなければ null
export function newlyPassed(beforeKg, afterKg) {
  const a = climbOf(beforeKg).passed;
  const b = climbOf(afterKg).passed;
  return b && (!a || b.m > a.m) ? b : null;
}
