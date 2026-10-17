// 진도 담당: 일일 목표, 진도율, 복습 기록을 계산하고 보여줘요. (7단계)
//
// 규칙
// - 학습 완료 기준: 개념 카드는 "뒷면을 확인"하면, OX 문제는 "한 번 풀면"(정답/오답 무관) 새로 학습한 것으로 세요.
// - 같은 카드·문제를 다시 학습하면 "복습"으로만 기록하고 진도율과 오늘 목표에는 더하지 않아요.
// - 오늘 목표는 오늘 "새로" 학습한 개수만 세요. 남은 새 학습이 목표보다 적으면 목표를 그만큼 줄여서 계산해요.
// - 아직 풀 수 없는 심화 문제는 진도율에 넣지 않아요. (9단계에서 추가)

function getGoals() { return DAILY_GOAL; }   // 하루 목표는 config.js의 DAILY_GOAL에서 가져와요

// 기록에 적힌 날짜 읽기. 새 기록은 "2026-10-20" 같은 글자, 예전 기록(1~6단계)은 시각 숫자라서 둘 다 처리해요.
function learnedDate(v) {
  if (typeof v === "string") return v;
  if (typeof v === "number") return new Date(v + 9 * 3600 * 1000).toISOString().slice(0, 10);
  return "";
}

// 복습 기록 (진도율에는 더하지 않아요)
function bumpReview(kind) {
  const t = kstToday(), r = Store.get("review", {});
  if (!r[t]) r[t] = { concept: 0, ox: 0 };
  r[t][kind] = (r[t][kind] || 0) + 1;
  Store.set("review", r);
}
function getReview(date) { const r = Store.get("review", {})[date]; return r || { concept: 0, ox: 0 }; }

function wrongTotal() { return SUBJECTS.reduce((a, s) => a + wrongCount(s), 0); }   // wrongCount는 ox.js에 있어요

function todayStats() {
  const t = kstToday(), g = getGoals();
  const seen = Store.get("seen.concept", {}), solved = Store.get("solved.ox", {});
  const cIds = Content.concepts.map(x => x.id), qIds = Content.ox.map(x => x.id);

  const cToday = cIds.filter(id => seen[id] && learnedDate(seen[id]) === t).length;
  const qToday = qIds.filter(id => solved[id] && learnedDate(solved[id]) === t).length;
  const cBefore = cIds.filter(id => seen[id] && learnedDate(seen[id]) !== t).length;
  const qBefore = qIds.filter(id => solved[id] && learnedDate(solved[id]) !== t).length;

  const cGoal = Math.min(g.concept, cIds.length - cBefore);   // 새로 배울 게 목표보다 적으면 목표를 줄여요
  const qGoal = Math.min(g.ox, qIds.length - qBefore);
  const goalSum = cGoal + qGoal;
  const pct = goalSum === 0 ? 100 : Math.round((Math.min(cToday, cGoal) + Math.min(qToday, qGoal)) / goalSum * 100);
  return { cToday: cToday, cGoal: cGoal, qToday: qToday, qGoal: qGoal, pct: pct, empty: goalSum === 0, rev: getReview(t) };
}

// 홈에 쓰는 오늘 목표 그래프: 동그란 달성률 + 개수 (개념과 문제를 합쳐서 보여줘요)
function renderGoalMini() {
  const s = todayStats();
  const sum = s.cGoal + s.qGoal, got = Math.min(s.cToday, s.cGoal) + Math.min(s.qToday, s.qGoal);
  const r = 38, c = 2 * Math.PI * r, off = c * (1 - s.pct / 100);
  return `<div class="card gbox"><svg viewBox="0 0 100 100" class="ring" role="img" aria-label="오늘 목표 ${s.pct}%">` +
    `<circle cx="50" cy="50" r="${r}" class="ring-bg"/>` +
    `<circle cx="50" cy="50" r="${r}" class="ring-fg" stroke-dasharray="${c.toFixed(1)}" stroke-dashoffset="${off.toFixed(1)}" transform="rotate(-90 50 50)"/>` +
    `<text x="50" y="57" text-anchor="middle" class="ring-t">${s.pct}%</text></svg>` +
    `<div class="gnum">${sum === 0 ? "모두 완료" : got + " / " + sum}</div></div>`;
}
