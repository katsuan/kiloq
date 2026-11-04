// キロっく：送る前の見本（LINE に送るカードと同じ並び）・ランキングのカード・種目ごとの集計の札を作る（HTML の文字）。app.js から使う
import { getCreditText } from "./card.js?v=202611021614";
import { escapeHtml, formatLocaleMetric } from "./format.js?v=202611021614";
import { countValidSets, getNamedExercises, resolveWorkoutTitle } from "./workout.js?v=202611021614";

// 記録の種目ごとの集計の HTML を返す
export function renderWorkoutExerciseStats(workout) {
  const exercises = getNamedExercises(workout);
  return exercises.length ? '<div class="stats-grid">' + exercises.map(renderExerciseStatCard).join("") + "</div>" : "";
}

// 種目が多いと LINE ではカードが横に並ぶ（カルーセル）。プレビューも同じく横スクロールで見せる
export function renderBubbleCarousel(workout, bubbles) {
  const items = bubbles.map(function (bubble) {
    return renderBubblePreview(workout, bubble);
  });
  if (items.length <= 1) {
    return items.join("");
  }
  return [
    '<div class="talk-carousel" tabindex="0" aria-label="カード ' + items.length + '枚（横にスクロール）">',
    items
      .map(function (item) {
        return '<div class="talk-carousel-item">' + item + "</div>";
      })
      .join(""),
    "</div>"
  ].join("");
}

// 送るカード1枚の見本（見出し・種目・下の帯）の HTML を、カードの中身から作って返す
export function renderBubblePreview(workout, bubble) {
  const exerciseBoxes = bubble.body && bubble.body.contents ? bubble.body.contents : [];
  const headerContents = bubble.header && bubble.header.contents ? bubble.header.contents : [];
  const headerMetaBox = headerContents[0] && headerContents[0].contents ? headerContents[0] : null;
  const dateText = headerMetaBox && headerMetaBox.contents[0] ? headerMetaBox.contents[0].text : workout.date || "-";
  const userText =
    headerMetaBox && headerMetaBox.contents[1] ? headerMetaBox.contents[1].text : "";
  const titleText = headerContents[1] ? headerContents[1].text : resolveWorkoutTitle(workout.title, workout.user);
  // 下の帯のボタン（最後のカードの「同じメニューでやる」）も、送るカードと同じに出す
  const footerButtons = (bubble.footer && bubble.footer.contents ? bubble.footer.contents : []).filter(function (item) {
    return item.type === "button" && item.action && item.action.label;
  });
  return [
    '<section class="preview-bubble">',
    '  <div class="preview-bubble-header">',
    '    <div class="preview-header-meta">',
    "      <div>" + escapeHtml(dateText) + "</div>",
    userText ? '      <div class="preview-note-user">' + escapeHtml(userText) + "</div>" : "",
    "    </div>",
    '    <div class="preview-bubble-title">' + escapeHtml(titleText) + "</div>",
    "  </div>",
    exerciseBoxes
      .map(function (box) {
        // 「ほか N 種目」（カードに入らなかった種目）
        if (box.type !== "box") {
          return '<div class="preview-exercise-note">' + escapeHtml(box.text || "") + "</div>";
        }
        const headerBox = box.contents[0] || { contents: [] };
        const title = headerBox.contents[0] ? headerBox.contents[0].text : "";
        const summary = headerBox.contents[1] ? headerBox.contents[1].text : "";
        const bodyLines = box.contents.slice(1);
        return [
          '<article class="preview-exercise">',
          '  <div class="preview-exercise-head">',
          "    <h4>" + escapeHtml(title) + "</h4>",
          '    <span class="preview-exercise-rm">' + escapeHtml(summary) + "</span>",
          "  </div>",
          '  <div class="preview-sets">',
          bodyLines
            .map(function (line) {
              if (line.type === "box") {
                const numberBox = line.contents[0] || {};
                const left = numberBox.contents && numberBox.contents[0] ? numberBox.contents[0].text : numberBox.text || "";
                const main = line.contents[1] ? line.contents[1].text : "";
                const badge =
                  line.contents[2] && line.contents[2].contents && line.contents[2].contents[0]
                    ? line.contents[2].contents[0].text
                    : "";
                return (
                  '<div class="preview-set-line"><span class="preview-set-number">' +
                  escapeHtml(left) +
                  '</span><span class="preview-set-main">' +
                  escapeHtml(main) +
                  "</span>" +
                  (badge ? '<strong class="preview-rm-badge">' + escapeHtml(badge) + "</strong>" : "") +
                  "</div>"
                );
              }
              return '<div class="preview-exercise-note">' + escapeHtml(line.text || "") + "</div>";
            })
            .join(""),
          "  </div>",
          "</article>"
        ].join("");
      })
      .join(""),
    '  <div class="preview-bubble-footer">' +
    footerButtons
      .map(function (button) {
        return '<span class="preview-bubble-button">' + escapeHtml(button.action.label) + "</span>";
      })
      .join("") +
    escapeHtml(getCreditText()) +
    "</div>",
    "</section>"
  ].join("");
}

// ランキングのカード（デバッグ用）の HTML を返す
export function renderRankingCard(title, rows, unit) {
  return [
    '<article class="ranking-card">',
    "  <header>",
    "    <h4>" + escapeHtml(title) + "</h4>",
    "  </header>",
    rows && rows.length
      ? '  <div class="ranking-stack">' +
      rows
        .map(function (row, index) {
          return [
            '<div class="ranking-row">',
            '  <div><strong>#' +
            (index + 1) +
            "</strong> " +
            escapeHtml(row.name) +
            '<div class="ranking-meta">' +
            escapeHtml(row.label || "") +
            "</div></div>",
            '  <strong>' + escapeHtml(formatLocaleMetric(row.value, unit, 1)) + "</strong>",
            "</div>"
          ].join("");
        })
        .join("") +
      "  </div>"
      : '<p class="ls-hint">ランキングデータはまだありません。</p>',
    "</article>"
  ].join("");
}

// 種目1つの集計のカード（セット・ボリューム・推定1RM）の HTML を返す
export function renderExerciseStatCard(exercise) {
  const validSetCount = countValidSets(exercise);
  const caption = [String(validSetCount) + "セット"];

  if (exercise.primaryMuscle) {
    caption.push(exercise.primaryMuscle);
  }

  return [
    '<article class="summary-card">',
    '  <div class="summary-card-main">',
    '    <strong class="summary-name">' + escapeHtml(exercise.name || "未入力種目") + "</strong>",
    '    <span class="summary-inline-meta">' + escapeHtml(caption.join(" / ")) + "</span>",
    "  </div>",
    '  <strong class="summary-value">' +
      escapeHtml(exercise.maxEstimated1rm > 0 ? formatLocaleMetric(exercise.maxEstimated1rm, "kg", 1) : "-") +
      "</strong>",
    "</article>"
  ].join("");
}
