// 자유 학습 담당: 학습/복습을 고르고, 범위(단원)를 고르고, 유형 칸을 누르면 바로 시작해요.
// - 학습: 그 범위의 전체 항목. 복습: 이미 학습한 것만. 오답: 틀린 문제만 (복습 안에 있어요).
// - 과목은 설정 탭에서 바꿔요. (제목 옆 과목 표시를 눌러도 설정으로 가요)

const FREE_TYPES = [
  { type: "concept", name: "개념 카드", unit: "장" },
  { type: "ox", name: "OX 퀴즈", unit: "문제" },
  { type: "mcq", name: "심화 5지선다", unit: "문제" },
];

// 조건에 맞는 항목들 (과목, 학습/복습, 범위)
function freePool(type) {
  const review = state.sub === "review";
  const list = type === "wrong" ? wrongItems(state.subject) : Content[TYPE_LIST[type]].filter(x => x.subject === state.subject);
  return list.filter(x => (type === "wrong" || !review || isLearned(type, x.id)) &&
    (!state.units.length || state.units.includes(x.unit)));
}
function freeUnits() {
  const review = state.sub === "review";
  return unitsOf(state.subject).filter(u => !review ||
    FREE_TYPES.some(t => Content[TYPE_LIST[t.type]].some(x => x.subject === state.subject && x.unit === u && isLearned(t.type, x.id))));
}

// 범위: 평소에는 "범위 · 전체 ▾" 한 줄, 누르면 단원 체크 목록이 펼쳐져요
function renderRange() {
  const units = freeUnits(), n = state.units.length;
  const label = n === 0 ? "전체" : n === 1 ? state.units[0] : n + "개 단원";
  const row = (action, value, text, on) => `<button type="button" class="check${on ? " on" : ""}" data-action="${action}"` +
    (value ? ` data-value="${esc(value)}"` : "") + ` aria-pressed="${on}"><span class="box" aria-hidden="true"></span>${esc(text)}</button>`;
  return `<button type="button" class="range-btn${state.rangeOpen ? " open" : ""}" data-action="fr-range" aria-expanded="${state.rangeOpen}">` +
    `<span>범위</span><b>${esc(label)}</b><span class="arrow" aria-hidden="true">▾</span></button>` +
    (!state.rangeOpen ? "" : `<div class="range-list">` + (units.length
      ? row("fr-all", "", "전체", n === 0) + units.map(u => row("fr-unit", u, u, state.units.includes(u))).join("") +
        `<div class="pager"><button type="button" class="primary" data-action="fr-range">완료</button></div>`
      : `<div class="empty">아직 학습한 내용이 없어요</div>`) + `</div>`);
}

function renderFree() {
  const review = state.sub === "review";
  let html = `<h1>자유 학습 <button type="button" class="sbadge" data-tab="settings" aria-label="과목 바꾸기">${esc(state.subject)}</button></h1>` +
    `<div class="seg">` + [["learn", "학습"], ["review", "복습"]].map(([id, name]) =>
      `<button type="button" data-action="fr-sub" data-value="${id}" class="${state.sub === id ? "on" : ""}">${name}</button>`).join("") + `</div>`;

  html += renderRange();
  const tiles = FREE_TYPES.map(t => ({ ...t, n: freePool(t.type).length }));
  if (review) tiles.push({ type: "wrong", name: "오답 노트", unit: "문제", n: freePool("wrong").length, warn: true });
  html += `<h2>시작하기</h2><div class="tiles">` + tiles.map(t =>
    `<button type="button" class="tile${t.warn ? " warn" : ""}" data-action="fr-start" data-value="${t.type}"${t.n ? "" : " disabled"}>` +
    `<span class="tname">${t.name}</span><span class="tnum">${t.n}${t.unit}</span></button>`).join("") + `</div>`;
  return html;
}

Object.assign(Actions, {
  "fr-sub"(value) { state.sub = value; state.units = []; state.rangeOpen = false; },
  "fr-range"() { state.rangeOpen = !state.rangeOpen; return "stay"; },
  "fr-all"() { state.units = []; return "stay"; },
  "fr-unit"(value) {
    const i = state.units.indexOf(value);
    if (i >= 0) state.units.splice(i, 1); else state.units.push(value);
    return "stay";
  },
  "fr-start"(type) {
    const build = () => freePool(type).map(x => ({ type: x._type, id: x.id }));
    const list = build();
    if (!list.length) return "stay";
    const whole = type === "concept" && state.sub === "learn" && !state.units.length;   // 전체 범위 개념 학습만 마지막 위치를 기억해요
    startStudy(list, { wrongMode: type === "wrong", posKey: whole ? "pos.concept." + state.subject : null, rebuild: build });
  },
});
