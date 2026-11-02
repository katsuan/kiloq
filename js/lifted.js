// キロっく：これまでに持ち上げた重さの合計（記録を消しても、10件をこえて古い記録が消えても減らさない）と、それを重さの目じるし（ゾウ・クジラ…）でくらべる計算。画面には触らない（テストで呼ぶ）
// 読むところ：app.js（端末に残す読み書きは js/store.js の loadLifted・saveLifted）
//
// 合計は、記録の履歴（liff-workout-history。つづくも読むので形を変えない）とは別に残す（kiloq:lifted）。
//   { total: 合計の kg, counted: [[記録の id, 数えた kg], ...] }
// counted は、もう数えた記録。同じ記録を2回数えないため・同じ id の記録が書きかわったら差の分だけ直すために覚える（新しいものから COUNTED_MAX 件）
// 履歴から消えた記録は、数えたまま（合計から引かない）

export const COUNTED_MAX = 300; // 履歴は10件までなので、これだけ覚えていれば「元に戻す」で戻った記録も2回数えない

// 重さの目じるし（軽い順。kg は広く知られた数字の「約」）。count はくらべるときの数え方（「ゾウ 0.9 頭分」）、short は送る帯の中で使う短い呼び名（ないときは name）
// 1回分（3〜6 t）でも、はじめの数個はすぐ越えられる。いちばん上を越えたら「タイタニック号 2隻分」…と続ける
export const LANDMARKS = [
  { icon: "🐼", name: "パンダ", kg: 100, count: "頭" },
  { icon: "🐻", name: "ヒグマ", kg: 300, count: "頭" },
  { icon: "🐄", name: "乳牛", kg: 700, count: "頭" },
  { icon: "🚗", name: "乗用車", kg: 1500, count: "台" },
  { icon: "🐘", name: "ゾウ", kg: 6000, count: "頭" },
  { icon: "🦖", name: "ティラノサウルス", short: "ティラノ", kg: 9000, count: "体" },
  { icon: "🚚", name: "大型トラック（荷物満載）", short: "トラック", kg: 20000, count: "台" },
  { icon: "🚃", name: "電車1両", kg: 30000, count: "両" },
  { icon: "🦕", name: "アルゼンチノサウルス", short: "巨大恐竜", kg: 70000, count: "体" },
  { icon: "🐋", name: "シロナガスクジラ", short: "クジラ", kg: 150000, count: "頭" },
  { icon: "🙏", name: "奈良の大仏", short: "大仏", kg: 250000, count: "体" },
  { icon: "✈️", name: "ジャンボジェット", short: "ジャンボ機", kg: 400000, count: "機" },
  { icon: "🚄", name: "新幹線（16両）", short: "新幹線", kg: 700000, count: "編成" },
  { icon: "🚀", name: "サターンV ロケット", short: "ロケット", kg: 3000000, count: "機" },
  { icon: "🗼", name: "東京タワー", kg: 4000000, count: "本" },
  { icon: "🗼", name: "エッフェル塔", kg: 10000000, count: "本" },
  { icon: "🚢", name: "タイタニック号", kg: 50000000, count: "隻" }
];
const TOP = LANDMARKS[LANDMARKS.length - 1];

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

// 「約 6 t」「約 700 kg」「約 5万 t」（目じるしの重さ）
export function weightLabel(kg) {
  if (kg < 1000) return "約 " + kg + " kg";
  const t = kg / 1000;
  return "約 " + (t >= 10000 ? t / 10000 + "万" : t.toLocaleString("ja-JP")) + " t";
}

// totalKg までの目じるし（いちばん上を越えていたら「タイタニック号 2隻分」…を、次の1つまで足す）
export function marksFor(totalKg) {
  const marks = LANDMARKS.slice();
  const laps = Math.floor(Math.max(0, Number(totalKg) || 0) / TOP.kg);
  for (let n = 2; n <= laps + 1; n += 1) marks.push(Object.assign({}, TOP, { name: TOP.name + " " + n + TOP.count + "分", short: TOP.name + " " + n + TOP.count, kg: TOP.kg * n }));
  return marks;
}

/**
 * 合計の kg が、目じるしのどこまで来たかを返す：{ passed（越えたいちばん重い目じるし。なければ null）, next（次の目じるし）,
 * toNextKg（次まであと何 kg）, progress（前の目じるしから次までの 0〜1）, passedCount（越えた数） }
 */
export function progressOf(totalKg) {
  const kg = Math.max(0, Number(totalKg) || 0);
  const marks = marksFor(kg);
  const nextIndex = marks.findIndex((mark) => mark.kg > kg);
  const next = marks[nextIndex];
  const passed = nextIndex > 0 ? marks[nextIndex - 1] : null;
  const from = passed ? passed.kg : 0;
  return {
    passed,
    next,
    passedCount: nextIndex,
    toNextKg: Math.max(0, Math.ceil((next.kg - kg) * 10) / 10),
    progress: Math.min(1, Math.max(0, (kg - from) / (next.kg - from)))
  };
}

// 合計が before から after に増えたとき、新しく越えた目じるし（いちばん重いもの）。越えていなければ null
export function newlyPassed(beforeKg, afterKg) {
  const a = progressOf(beforeKg).passed;
  const b = progressOf(afterKg).passed;
  return b && (!a || b.kg > a.kg) ? b : null;
}

/**
 * 1回の重さ（今日の重さ）を、いちばん近い目じるしでくらべる：{ mark, ratio }（「ゾウ 0.9 頭分」）。
 * すぐ下の目じるし（1つ分より多い）とすぐ上の目じるし（1つ分より少ない）のうち、1つ分に近いほう（倍でくらべる）。0 kg なら null
 */
export function compareWeight(kg) {
  const w = Number(kg) || 0;
  if (w <= 0) return null;
  const above = LANDMARKS.find((mark) => mark.kg >= w);
  const below = LANDMARKS.slice().reverse().find((mark) => mark.kg < w);
  const pick = !above ? below : !below ? above : w / below.kg <= above.kg / w ? below : above;
  return { mark: pick, ratio: w / pick.kg };
}

// 「0.9」「3.6」「12」（◯つ分の数。10 からは整数）
export function ratioLabel(ratio) {
  return ratio >= 10 ? String(Math.round(ratio)) : String(Math.round(ratio * 10) / 10);
}
