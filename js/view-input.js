// キロっく：入力の欄の部品（重さ・回数の − 数 ＋・種目の選び方・たたんだ種目の要約・メニューの行など）を作る（HTML の文字）。app.js から使う
import { EXERCISE_CATALOG, MUSCLE_FILTERS } from "./catalog.js?v=202611021614";
import { lineIcon, renderButton, renderChip } from "./components.js?v=202611021614";
import { escapeHtml, formatLocaleMetric } from "./format.js?v=202611021614";
import { countValidSets, hasEstimated1rm, isMaxRmSet, summarizeMenu } from "./workout.js?v=202611021614";

// 種目の一覧から id の種目を探して返す
export function findCatalogExercise(catalogId) {
  return EXERCISE_CATALOG.find(function (item) {
    return item.id === catalogId;
  });
}

// 種目の一覧から選んだ種目の名前・部位を、入力中の種目に入れる
export function applyCatalogToExercise(exercise, catalogId) {
  const catalogExercise = findCatalogExercise(catalogId);
  if (!catalogExercise) {
    return;
  }
  exercise.catalogId = catalogExercise.id;
  exercise.isCustom = false;
  exercise.name = catalogExercise.name;
  exercise.primaryMuscle = catalogExercise.muscle;
  exercise.selectionMuscle = catalogExercise.muscle;
}

// 1セット分の行。スマホで押しやすいよう2段にし、kg・回数は −／＋ でも変えられる
//   上段: 何セット目・推定RM・消す  下段: kg と回数
export function renderSetRow(exercise, set, setIndex) {
  const exerciseId = exercise.exerciseId;
  const canRemoveSet = exercise.sets.length > 1;
  const ids =
    'data-exercise-id="' + escapeHtml(exerciseId) + '" data-set-id="' + escapeHtml(set.setId) + '"';
  return [
    '<div class="set-row">',
    '  <div class="set-row-head">',
    '    <span class="set-badge">' + (setIndex + 1) + "セット目</span>",
    '    <div class="set-head-meta' +
      (isMaxRmSet(exercise, set) ? " is-max-rm" : "") +
      '" data-set-meta="estimated1rm" ' +
      ids +
      '><small class="metric-label">推定RM</small><strong class="metric-value" data-set-summary="estimated1rm" ' +
      ids +
      ">" +
      escapeHtml(hasEstimated1rm(set) ? formatLocaleMetric(set.estimated1rm, "kg", 1) : "-") +
      "</strong></div>",
    renderButton({
      label: "消す",
      className: "is-danger delete-pill",
      action: "remove-set",
      title: "このセットを消す",
      disabled: !canRemoveSet,
      attrs: {
        "data-exercise-id": exerciseId,
        "data-set-id": set.setId
      }
    }),
    "  </div>",
    '  <div class="set-row-inputs">',
    renderSetStepper({ field: "weight", unit: "kg", step: 2.5, inputmode: "decimal", inputStep: "0.5", value: set.weight, ids: ids }),
    renderSetStepper({ field: "reps", unit: "回", step: 1, inputmode: "numeric", inputStep: "1", value: set.reps, ids: ids }),
    "  </div>",
    "</div>"
  ].join("");
}

// 数値入力の左右に −／＋。押すと入力欄の値を変えて input イベントを出すので、手入力と同じ処理で反映される
export function renderSetStepper(options) {
  const label = options.unit === "kg" ? "重さ" : "回数";
  return [
    '<div class="set-stepper">',
    '  <button class="stepper-button" data-action="step-set" data-set-field="' +
      options.field +
      '" data-step="' +
      -options.step +
      '" type="button" aria-label="' +
      label +
      "を" +
      options.step +
      '減らす">−</button>',
    '  <label class="stepper-field">',
    '    <input class="stepper-input" aria-label="' +
      label +
      "（" +
      options.unit +
      '）" data-set-field="' +
      options.field +
      '" ' +
      options.ids +
      ' type="number" inputmode="' +
      options.inputmode +
      '" step="' +
      options.inputStep +
      '" min="0" placeholder="0" value="' +
      escapeHtml(String(options.value ?? "")) +
      '" />',
    '    <span class="stepper-unit">' + options.unit + "</span>",
    "  </label>",
    '  <button class="stepper-button" data-action="step-set" data-set-field="' +
      options.field +
      '" data-step="' +
      options.step +
      '" type="button" aria-label="' +
      label +
      "を" +
      options.step +
      '増やす">＋</button>',
    "</div>"
  ].join("");
}

// セットの − ／ ＋ を押したとき、重さ・回数を1目もり動かす
export function stepSetValue(button) {
  const row = button.closest(".set-row");
  const field = button.getAttribute("data-set-field");
  const input = row && row.querySelector('input[data-set-field="' + field + '"]');
  if (!input) {
    return;
  }
  const step = Number(button.getAttribute("data-step")) || 0;
  const next = Math.max(0, (Number(input.value) || 0) + step);
  // 重さは 0.5kg 刻み、回数は整数にそろえる
  input.value = String(field === "reps" ? Math.round(next) : Math.round(next * 2) / 2);
  input.dispatchEvent(new Event("input", { bubbles: true }));
}

// 入力の画面のいちばん下の小さな操作（サンプル・リセット）の HTML を返す
export function renderInputUtilityActions() {
  return [
    // 補助的な操作は一番下に小さく（「履歴から始める」は見出しの横へ移した）
    '<div class="input-utility-row">',
    '  <button class="text-link-button" data-action="sample-workout" type="button">サンプルを入れる</button>',
    "</div>"
  ].join("");
}

// 1行が1つのメニュー（Q キットの一覧の行）。押すと入る。保存したものだけ右に 🗑（消す）
export function renderMenuRow(menu, deletable) {
  const names = (menu.exercises || [])
    .map(function (exercise) {
      return exercise.name;
    })
    .join("・");
  const menuId = escapeHtml(menu.menuId);
  return [
    '<div class="ls-list-row">',
    '  <button class="ls-list-item" data-action="apply-menu" data-menu-id="' + menuId + '" type="button" title="' + escapeHtml("「" + menu.name + "」を入れる") + '">',
    '    <span class="menu-name">' + escapeHtml(menu.name) + '<span class="menu-meta">' + escapeHtml(summarizeMenu(menu)) + "</span></span>",
    "    <small>" + escapeHtml(names) + "</small>",
    "  </button>",
    deletable
      ? '  <button class="ls-icon-button" data-action="delete-menu" data-menu-id="' + menuId + '" type="button" aria-label="' + escapeHtml("「" + menu.name + "」を消す") + '">' + lineIcon("delete") + "</button>"
      : "",
    "</div>"
  ].join("");
}

// 名前の頭文字（写真がないときに出す。名前がなければ「W」）を返す
export function getUserInitial(displayName) {
  const normalized = String(displayName || "").trim();
  if (!normalized) {
    return "W";
  }
  return normalized.slice(0, 1).toUpperCase();
}

// 種目を選ぶところ：1. 部位（チップ） → 2. その部位の種目（チップ）か、自由入力
export function renderExercisePicker(exercise) {
  const idAttrs = { "data-exercise-id": exercise.exerciseId };
  const muscleChips = MUSCLE_FILTERS.filter(function (muscle) {
    return muscle !== "all";
  })
    .map(function (muscle) {
      return renderChip({
        label: muscle,
        action: "set-exercise-muscle",
        pressed: exercise.selectionMuscle === muscle,
        attrs: Object.assign({ "data-muscle": muscle }, idAttrs)
      });
    })
    .join("");

  const muscle = exercise.selectionMuscle;
  const candidates =
    muscle && muscle !== "その他"
      ? EXERCISE_CATALOG.filter(function (item) {
          return item.muscle === muscle;
        })
      : [];

  const options = candidates.length
    ? '<div class="ls-chips">' +
      candidates
        .map(function (item) {
          return renderChip({
            label: item.name,
            action: "choose-exercise-card",
            attrs: Object.assign({ "data-catalog-id": item.id }, idAttrs)
          });
        })
        .join("") +
      "</div>"
    : '<p class="ls-hint">' +
      (muscle === "その他"
        ? "自由入力で種目を追加します。"
        : muscle
          ? "この部位には候補がまだありません。手入力で追加できます。"
          : "先に部位を選ぶと、候補の種目が表示されます。") +
      "</p>";

  return [
    '<div class="exercise-picker">',
    '  <div class="ls-field">',
    '    <span class="ls-label">部位</span>',
    '    <div class="ls-chips">' + muscleChips + "</div>",
    "  </div>",
    '  <div class="ls-field">',
    '    <span class="ls-label">種目</span>',
    options,
    muscle
      ? renderButton({ label: "＋自由入力", className: "custom-exercise-button", action: "start-custom-exercise", attrs: idAttrs })
      : "",
    "  </div>",
    "</div>"
  ].join("");
}

// はじめに開いておく種目（種目を選んだ最初のもの）の id を返す
export function getDefaultExpandedExerciseId(exercises) {
  const matchedExercise = (exercises || []).find(function (exercise) {
    return Boolean(exercise && (exercise.catalogId || exercise.isCustom));
  });
  return matchedExercise ? matchedExercise.exerciseId : "";
}

// 種目のまとめの文字（「3セット・RM 75kg」など）を返す
export function renderExerciseSummary(exercise) {
  const validSetCount = countValidSets(exercise);
  const summaryParts = [];

  if (validSetCount > 0) {
    summaryParts.push(validSetCount + "セット");
  }
  if (exercise.maxEstimated1rm > 0) {
    summaryParts.push("RM " + formatLocaleMetric(exercise.maxEstimated1rm, "kg", 1));
  }

  return summaryParts.join(" / ");
}
