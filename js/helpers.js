// キロっく：画面の小さな道具（デバッグ・ランキングを出すか・見本を開いたかを残す・送る前の写し・日付と重さの文字・URL の一回きりの値・コピー・続いた週）。app.js から使う
import { lineIcon } from "./components.js?v=202611021614";
import { amountLabel } from "./lifted.js?v=202611021614";
import { generateId } from "./page.js?v=202611021614";
import { FEATURE_FLAGS, STORAGE_KEYS } from "./settings.js?v=202611021614";
import { hydrateWorkout, resolveWorkoutTitle } from "./workout.js?v=202611021614";

// デバッグモード（Flex JSON のコピーなど）かを返す
export function isDebugModeEnabled() {
  return Boolean(FEATURE_FLAGS.enableDebugMode);
}

// ランキング（デバッグ用）を出すかを返す
export function isRankingEnabled() {
  return isDebugModeEnabled() && Boolean(FEATURE_FLAGS.enableRanking);
}

// 送信プレビューを開いておくか（端末に覚える。保存できなくても開いた状態で動く）
export function loadPreviewOpen() {
  try {
    return window.localStorage.getItem(STORAGE_KEYS.previewOpen) !== "false";
  } catch (error) {
    return true;
  }
}

// 送信プレビューを開いているかを端末に覚える（覚えられなくても切りかわる）
export function savePreviewOpen(isOpen) {
  try {
    window.localStorage.setItem(STORAGE_KEYS.previewOpen, String(isOpen));
  } catch (error) {
    // 保存できなくても表示はそのまま切り替わる
  }
}

// 「1,234 kg」
export function formatKg(kg) {
  return amountLabel(kg);
}

// 送る記録の写し（新しい ID・タイトル・時刻）を作って返す
export function createShareSnapshot(workout) {
  const now = new Date().toISOString();
  return hydrateWorkout(
    Object.assign({}, workout, {
      workoutId: generateId("workout"),
      title: resolveWorkoutTitle(workout.title, workout.user),
      createdAt: now,
      updatedAt: now
    })
  );
}

// 「2026-10-01」→「10/1」（読めなければ ""）
export function formatShortDate(date) {
  const m = String(date || "").match(/^\d{4}-(\d{2})-(\d{2})$/);
  return m ? Number(m[1]) + "/" + Number(m[2]) : "";
}

// 記録の月（"2026-10"、日付がなければ "none"）を返す
export function historyMonthKey(workout) {
  const date = String((workout && workout.date) || "");
  return /^\d{4}-\d{2}/.test(date) ? date.slice(0, 7) : "none";
}

// 月の見出し（「2026年10月」「日付なし」）を返す
export function historyMonthLabel(key) {
  return key === "none" ? "日付なし" : Number(key.slice(0, 4)) + "年" + Number(key.slice(5, 7)) + "月";
}

// タブの画面を出す（ランキングはデバッグのときだけ）
export function setPanelVisibility(tabName, element) {
  if (!element) {
    return;
  }
  const shouldShow = tabName === "ranking" ? isRankingEnabled() : true;
  element.hidden = !shouldShow;
}

// URL の ?name= を読んで、URL からは消す（開きなおしても、もう一度入れない）。なければ null
export function takeUrlParam(name) {
  const url = new URL(window.location.href);
  if (!url.searchParams.has(name)) {
    return null;
  }
  const value = url.searchParams.get(name) || "";
  url.searchParams.delete(name);
  history.replaceState(null, "", url);
  return value;
}

// 名前のある LINE のプロフィールか（名前なし・anonymous でない）
export function isNamed(profile) {
  const name = profile ? String(profile.displayName || "").trim().toLowerCase() : "";
  return !!name && name !== "anonymous";
}

// 草グラフは右が今週。狭い画面では横に動かせるので、はじめは右のはし（今週）を見せる
export function showLatestWeeks() {
  document.querySelectorAll(".grass-grid").forEach(function (grid) {
    grid.scrollLeft = grid.scrollWidth;
  });
}

// 記録した週の連続（いま・最長）の1行の HTML を返す。今週まだなら「今週やれば ◯週」
export function renderStreak(streak) {
  // 「最長 3週」は1かたまりで折り返す（320px で「最／長」と折れないように）
  const best = ' ・ <span class="ls-nowrap">最長 <b>' + streak.best + "週</b></span>";
  if (streak.thisWeek) {
    return '<p class="grass-streak">' + lineIcon("flame", true) + "いま <b>" + streak.current + "週</b> 連続" + best + "</p>";
  }
  if (streak.current > 0) {
    return '<p class="grass-streak">' + lineIcon("flame", true) + "<b>" + streak.current + '週</b> 連続中<span class="ls-nowrap">（今週やれば ' + (streak.current + 1) + "週）</span>" + best + "</p>";
  }
  return '<p class="grass-streak">今週やると、連続がはじまります' + (streak.best ? best : "") + "</p>";
}

// 文字をコピーする。できたら true
export async function copyText(text) {
  try {
    if (navigator.clipboard && typeof navigator.clipboard.writeText === "function") {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch (error) {
    console.warn("Clipboard copy failed:", error);
  }
  return false;
}
