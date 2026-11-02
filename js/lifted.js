// キロっく：これまでに持ち上げた重さの合計（記録を消しても、10件をこえて古い記録が消えても減らさない）と、それを重さの目じるし（ゾウ・クジラ…月・地球）でくらべる計算と、大きな数の書き方（万・億・兆・京・垓）。画面には触らない（テストで呼ぶ）
// 読むところ：app.js（端末に残す読み書きは js/store.js の loadLifted・saveLifted）
//
// 合計は、記録の履歴（liff-workout-history。つづくも読むので形を変えない）とは別に残す（kiloq:lifted）。
//   { total: 合計の kg, counted: [[記録の id, 数えた kg], ...] }
// counted は、もう数えた記録。同じ記録を2回数えないため・同じ id の記録が書きかわったら差の分だけ直すために覚える（新しいものから COUNTED_MAX 件）
// 履歴から消えた記録は、数えたまま（合計から引かない）

export const COUNTED_MAX = 300; // 履歴は10件までなので、これだけ覚えていれば「元に戻す」で戻った記録も2回数えない

// 重さの目じるし（軽い順。kg は広く知られた数字の「約」）。count はくらべるときの数え方（「ゾウ 0.9 頭分」）、short は送る帯の中で使う短い呼び名（ないときは name）
// ふつうに続けて届く 100 kg 〜 数千 t（1回 3〜6 t、1年で 300〜500 t）は細かく、ほぼ毎回なにかを越える。その先は大きく飛ばして月・地球まで。
// 水は 1 m³ ＝ 1 t で、広く知られた水の量から。重さの公式の数字がないものは見積もり（スカイツリー：講談社の本の約3万2000 t、
// 富士山：体積 500 km³ 余り（防災科学技術研究所）× 岩の重さ 1 m³ あたり約 2 t）。地球を越えたら「地球 2個分」…と続ける
// big：名前と重さがよく知られた大きな物。まだ届いていなくても表に出す（「いつか地球まで」が見えるように）。ほかの先の目じるしはかくす
export const LANDMARKS = [
  { icon: "🐼", name: "パンダ", kg: 100, count: "頭" },
  { icon: "🦁", name: "ライオン", kg: 200, count: "頭" },
  { icon: "🐻", name: "ヒグマ", kg: 300, count: "頭" },
  { icon: "🐎", name: "馬（サラブレッド）", short: "馬", kg: 500, count: "頭" },
  { icon: "🐄", name: "乳牛", kg: 700, count: "頭" },
  { icon: "🦬", name: "バイソン", kg: 900, count: "頭" },
  { icon: "🦒", name: "キリン", kg: 1200, count: "頭" },
  { icon: "🚗", name: "乗用車", kg: 1500, count: "台" },
  { icon: "🦛", name: "カバ", kg: 2000, count: "頭" },
  { icon: "🦏", name: "サイ", kg: 2500, count: "頭" },
  { icon: "🚑", name: "救急車", kg: 3500, count: "台" },
  { icon: "🐘", name: "ゾウ", kg: 6000, count: "頭" },
  { icon: "🦖", name: "ティラノサウルス", short: "ティラノ", kg: 9000, count: "体" },
  { icon: "🚌", name: "観光バス", kg: 12000, count: "台" },
  { icon: "🚚", name: "大型トラック（荷物満載）", short: "トラック", kg: 20000, count: "台" },
  { icon: "🚃", name: "電車1両", kg: 30000, count: "両" },
  { icon: "🐳", name: "マッコウクジラ", short: "マッコウ", kg: 45000, count: "頭" },
  { icon: "🦕", name: "アルゼンチノサウルス", short: "巨大恐竜", kg: 70000, count: "体" },
  { icon: "🐋", name: "シロナガスクジラ", short: "クジラ", kg: 150000, count: "頭" },
  { icon: "🗽", name: "自由の女神", kg: 225000, count: "体" },
  { icon: "🙏", name: "奈良の大仏", short: "大仏", kg: 250000, count: "体" },
  { icon: "✈️", name: "ジャンボジェット", short: "ジャンボ機", kg: 400000, count: "機" },
  { icon: "🛫", name: "エアバス A380", short: "A380", kg: 575000, count: "機" },
  { icon: "🚄", name: "新幹線（16両）", short: "新幹線", kg: 700000, count: "編成" },
  { icon: "🚂", name: "貨物列車（いちばん長いもの）", short: "貨物列車", kg: 1300000, count: "本" },
  { icon: "🚀", name: "スペースシャトル（打ち上げのとき）", short: "シャトル", kg: 2000000, count: "機" },
  { icon: "🚀", name: "サターンV ロケット", short: "ロケット", kg: 3000000, count: "機" },
  { icon: "🗼", name: "東京タワー", kg: 4000000, count: "本", big: true },
  { icon: "🗼", name: "エッフェル塔", kg: 10000000, count: "本", big: true },
  { icon: "🗼", name: "東京スカイツリー", short: "スカイツリー", kg: 32000000, count: "本", big: true },
  { icon: "🚢", name: "タイタニック号", short: "タイタニック", kg: 50000000, count: "隻", big: true },
  { icon: "⚓", name: "戦艦大和", kg: 70000000, count: "隻" },
  { icon: "🛳️", name: "原子力空母", short: "空母", kg: 100000000, count: "隻" },
  { icon: "🛢️", name: "大型タンカー（荷物満載）", short: "タンカー", kg: 300000000, count: "隻" },
  { icon: "🏟️", name: "東京ドームいっぱいの水", short: "東京ドームの水", kg: 1.24e9, count: "杯" },
  { icon: "🔺", name: "ギザの大ピラミッド", short: "ピラミッド", kg: 6e9, count: "基", big: true },
  { icon: "💧", name: "黒部ダムの水", short: "黒部ダム", kg: 2e11, count: "杯" },
  { icon: "🏞️", name: "琵琶湖の水", short: "琵琶湖", kg: 2.75e13, count: "杯", big: true },
  { icon: "🗻", name: "富士山", kg: 1e15, count: "個", big: true },
  { icon: "🏞️", name: "バイカル湖の水", short: "バイカル湖", kg: 2.36e16, count: "杯" },
  { icon: "🌧️", name: "世界に1年でふる雨と雪", short: "1年の雨", kg: 5e17, count: "年" },
  { icon: "🌬️", name: "地球の空気", short: "空気", kg: 5.1e18, count: "個" },
  { icon: "🧊", name: "南極の氷", kg: 2.4e19, count: "個" },
  { icon: "🌊", name: "地球の海の水", short: "海の水", kg: 1.4e21, count: "個" },
  { icon: "🌕", name: "月", kg: 7.3e22, count: "個", big: true },
  { icon: "🌍", name: "地球", kg: 6e24, count: "個", big: true }
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

// 大きな数を 万・億・兆・京・垓 で（3けたくらいにまるめる）：12345 → "1.23万"、2.75e10 → "275億"、6e21 → "60垓"。1万より小さいときは「3,000」「1.5」
const UNITS = [[1e20, "垓"], [1e16, "京"], [1e12, "兆"], [1e8, "億"], [1e4, "万"]];
export function bigNumber(value) {
  const v = Math.max(0, Number(value) || 0);
  const unit = UNITS.find(([size]) => v >= size);
  if (!unit) return (Math.round(v * 10) / 10).toLocaleString("ja-JP");
  const n = v / unit[0];
  const digits = n >= 100 ? 0 : n >= 10 ? 1 : 2;
  return (Math.round(n * 10 ** digits) / 10 ** digits).toLocaleString("ja-JP") + unit[1];
}

// 目じるしの重さ：「約 700 kg」「約 6 t」「約 3,000 t」「約 124万 t」「約 60垓 t」
export function weightLabel(kg) {
  return kg < 1000 ? "約 " + kg + " kg" : "約 " + bigNumber(kg / 1000) + " t";
}

// 合計・あと何 kg などの重さ：10万 kg までは「12,345 kg」、それより上は t で「1,235 t」「23.6兆 t」
export function amountLabel(kg) {
  const v = Math.max(0, Number(kg) || 0);
  return v < 100000 ? Math.round(v).toLocaleString("ja-JP") + " kg" : bigNumber(Math.round(v / 1000)) + " t";
}

/**
 * 遠い目じるしにくらべて、いまどれくらいか：「1.2％」「0.0035％」、もっと小さければ「1兆分の1」（とほうもない「あと ◯ kg」の代わりに見せる）。
 * 0 kg・目じるしを越えていれば ""
 */
export function shareLabel(kg, markKg) {
  const v = Number(kg) || 0;
  if (v <= 0 || v >= markKg) return "";
  const percent = (v / markKg) * 100;
  if (percent >= 0.001) return String(Number(percent.toPrecision(2))) + "％";
  return bigNumber(Number((markKg / v).toPrecision(2))) + "分の1";
}

// totalKg までの目じるし（いちばん上を越えていたら「地球 2個分」…を、次の1つまで足す）
export function marksFor(totalKg) {
  const marks = LANDMARKS.slice();
  const laps = Math.floor(Math.max(0, Number(totalKg) || 0) / TOP.kg);
  for (let n = 2; n <= laps + 1; n += 1) marks.push(Object.assign({}, TOP, { name: TOP.name + " " + n + TOP.count + "分", short: TOP.name + " " + n + TOP.count + "分", kg: TOP.kg * n }));
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

/**
 * 次の目じるしより先の並び：よく知られた大きな物（big）はそのまま、そのあいだの細かい目じるしは「かくした数」にまとめる。
 * [{ mark }, { locked: 3 }, { mark }, ...]（表の「🗻 富士山 約1兆 t」「🔒 この間に、あと 3 個」）
 */
export function aheadOf(totalKg) {
  const next = progressOf(totalKg).next;
  const rows = [];
  for (const mark of LANDMARKS.filter((m) => m.kg > next.kg)) {
    if (mark.big) rows.push({ mark });
    else if (rows.length && rows[rows.length - 1].locked) rows[rows.length - 1].locked += 1;
    else rows.push({ locked: 1 });
  }
  return rows;
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

// 「0.9」「3.6」「12」「1.2万」（◯つ分の数。10 からは整数、1万からは 万・億…）
export function ratioLabel(ratio) {
  return ratio >= 10000 ? bigNumber(ratio) : ratio >= 10 ? String(Math.round(ratio)) : String(Math.round(ratio * 10) / 10);
}
