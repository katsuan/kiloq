// キロっく：重さの目じるし（パンダ〜月・地球）と、重さの書き方。画面には触らない（テストで呼ぶ）
// 計算（どこまで来たか・くらべ・消しても減らない合計）と見た目は Q キットの shared/milestones.js（window.QMilestones）。ここはキロっくだけのもの
// 読むところ：app.js（QMilestones.create({ marks: LANDMARKS, amount: amountLabel, markValue: weightLabel })）
//
// 合計は、記録の履歴（liff-workout-history。つづくも読むので形を変えない）とは別に残す（kiloq:lifted。js/store.js の loadLifted・saveLifted）。
//   { total: 合計の kg, counted: [[記録の id, 数えた kg], ...] }（QMilestones.syncLedger の形）

// 重さの目じるし（軽い順。value は kg。広く知られた数字の「約」）。count はくらべるときの数え方（「ゾウ 0.9 頭分」）、short は送る帯の中で使う短い呼び名（ないときは name）
// ふつうに続けて届く 100 kg 〜 数千 t（1回 3〜6 t、1年で 300〜500 t）は細かく、ほぼ毎回なにかを越える。その先は大きく飛ばして月・地球まで。
// 水は 1 m³ ＝ 1 t で、広く知られた水の量から。山のように重さの数字がないものは入れない。スカイツリーは公式の数字がないので、講談社の本の約3万2000 t。
// 地球を越えたら「地球 2個分」…と続ける
// big：名前と重さがよく知られた大きな物。まだ届いていなくても表に出す（「いつか地球まで」が見えるように）。ほかの先の目じるしはかくす
export const LANDMARKS = [
  { icon: "🐼", name: "パンダ", value: 100, count: "頭" },
  { icon: "🦁", name: "ライオン", value: 200, count: "頭" },
  { icon: "🐻", name: "ヒグマ", value: 300, count: "頭" },
  { icon: "🐎", name: "馬（サラブレッド）", short: "馬", value: 500, count: "頭" },
  { icon: "🐄", name: "乳牛", value: 700, count: "頭" },
  { icon: "🦬", name: "バイソン", value: 900, count: "頭" },
  { icon: "🦒", name: "キリン", value: 1200, count: "頭" },
  { icon: "🚗", name: "乗用車", value: 1500, count: "台" },
  { icon: "🦛", name: "カバ", value: 2000, count: "頭" },
  { icon: "🦏", name: "サイ", value: 2500, count: "頭" },
  { icon: "🚑", name: "救急車", value: 3500, count: "台" },
  { icon: "🐘", name: "ゾウ", value: 6000, count: "頭" },
  { icon: "🦖", name: "ティラノサウルス", short: "ティラノ", value: 9000, count: "体" },
  { icon: "🚌", name: "観光バス", value: 12000, count: "台" },
  { icon: "🚚", name: "大型トラック（荷物満載）", short: "トラック", value: 20000, count: "台" },
  { icon: "🚃", name: "電車1両", value: 30000, count: "両" },
  { icon: "🐳", name: "マッコウクジラ", short: "マッコウ", value: 45000, count: "頭" },
  { icon: "🦕", name: "アルゼンチノサウルス", short: "巨大恐竜", value: 70000, count: "体" },
  { icon: "🐋", name: "シロナガスクジラ", short: "クジラ", value: 150000, count: "頭" },
  { icon: "🗽", name: "自由の女神", value: 225000, count: "体" },
  { icon: "🙏", name: "奈良の大仏", short: "大仏", value: 250000, count: "体" },
  { icon: "✈️", name: "ジャンボジェット", short: "ジャンボ機", value: 400000, count: "機" },
  { icon: "🛫", name: "エアバス A380", short: "A380", value: 575000, count: "機" },
  { icon: "🚄", name: "新幹線（16両）", short: "新幹線", value: 700000, count: "編成" },
  { icon: "🚂", name: "貨物列車（いちばん長いもの）", short: "貨物列車", value: 1300000, count: "本" },
  { icon: "🚀", name: "スペースシャトル（打ち上げのとき）", short: "シャトル", value: 2000000, count: "機" },
  { icon: "🚀", name: "サターンV ロケット", short: "ロケット", value: 3000000, count: "機" },
  { icon: "🗼", name: "東京タワー", value: 4000000, count: "本", big: true },
  { icon: "🗼", name: "エッフェル塔", value: 10000000, count: "本", big: true },
  { icon: "🗼", name: "東京スカイツリー", short: "スカイツリー", value: 32000000, count: "本", big: true },
  { icon: "🚢", name: "タイタニック号", short: "タイタニック", value: 50000000, count: "隻", big: true },
  { icon: "⚓", name: "戦艦大和", value: 70000000, count: "隻" },
  { icon: "🛳️", name: "原子力空母", short: "空母", value: 100000000, count: "隻" },
  { icon: "🛢️", name: "大型タンカー（荷物満載）", short: "タンカー", value: 300000000, count: "隻" },
  { icon: "🏟️", name: "東京ドームいっぱいの水", short: "東京ドームの水", value: 1.24e9, count: "杯" },
  { icon: "🔺", name: "ギザの大ピラミッド", short: "ピラミッド", value: 6e9, count: "基", big: true },
  { icon: "💧", name: "黒部ダムの水", short: "黒部ダム", value: 2e11, count: "杯" },
  { icon: "🏞️", name: "琵琶湖の水", short: "琵琶湖", value: 2.75e13, count: "杯", big: true },
  { icon: "🏞️", name: "バイカル湖の水", short: "バイカル湖", value: 2.36e16, count: "杯" },
  { icon: "🌧️", name: "世界に1年でふる雨と雪", short: "1年の雨", value: 5e17, count: "年" },
  { icon: "🌬️", name: "地球の空気", short: "空気", value: 5.1e18, count: "個" },
  { icon: "🧊", name: "南極の氷", value: 2.4e19, count: "個" },
  { icon: "🌊", name: "地球の海の水", short: "海の水", value: 1.4e21, count: "個" },
  { icon: "🌕", name: "月", value: 7.3e22, count: "個", big: true },
  { icon: "🌍", name: "地球", value: 6e24, count: "個", big: true }
];

// 大きな数（万・億…）は Q キットの QMilestones.bigNumber。読めないとき（テストなど）は「12,345」の形
function big(value) {
  return globalThis.QMilestones ? globalThis.QMilestones.bigNumber(value) : (Math.round(value * 10) / 10).toLocaleString("ja-JP");
}

// 目じるしの重さ：「約 700 kg」「約 6 t」「約 3,000 t」「約 124万 t」「約 60垓 t」
export function weightLabel(kg) {
  return kg < 1000 ? "約 " + kg + " kg" : "約 " + big(kg / 1000) + " t";
}

// 合計・あと何 kg などの重さ：10万 kg までは「12,345 kg」、それより上は t で「1,235 t」「23.6兆 t」
export function amountLabel(kg) {
  const v = Math.max(0, Number(kg) || 0);
  return v < 100000 ? Math.round(v).toLocaleString("ja-JP") + " kg" : big(Math.round(v / 1000)) + " t";
}
