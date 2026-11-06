// キロっく：LINE 版のつなぎ先の設定（LIFF の ID など）と、機能の ON/OFF。index.html で app.js より先に読む（js/settings.js が window.APP_CONFIG を読む）
// Q キットの LINE 版の部品（shared/liff.js の LineShareLiff）が使う LIFF の ID。おくるん（config.js）と同じ名前の入れ物に、キロっくの ID を入れる
window.LINE_SHARE_CONFIG = Object.assign({}, window.LINE_SHARE_CONFIG, { liffId: "2012187502-SXNrASOl" });
window.APP_CONFIG = {
  LIFF_ID: "2012187502-SXNrASOl",
  APP_NAME: "kiloQ",
  DEFAULT_GROUP_KEY: "default-group",
  FEATURE_FLAGS: {
    enableDebugMode: false,
    enableLocalHistory: true,
    enableStatsMock: false,
    enableApiAdapter: false,
    enableRanking: false
  }
};
