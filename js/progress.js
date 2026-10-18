// 오늘 목표 담당: 오늘 새로 학습한 개수를 세서 홈의 동그란 그래프로 보여줘요.
//
// 규칙
// - 오늘 "처음" 학습한 개념 카드와 OX만 세요. 복습은 세지 않아요. (심화는 목표에 넣지 않아요)
// - 목표 숫자는 config.js의 DAILY_GOAL에만 있어요.
// - 남은 새 학습이 목표보다 적으면 목표를 그만큼 줄여서 계산해요. 그래서 다 끝나면 100%가 돼요.

function todayStats() {
  const t = kstToday();
  const count = (type, list, goal) => {
    const m = learnedMap(type);
    const today = list.filter(x => m[x.id] && learnedDate(m[x.id]) === t).length;
    const before = list.filter(x => m[x.id] && learnedDate(m[x.id]) !== t).length;
    const g = Math.min(goal, list.length - before);   // 새로 배울 게 목표보다 적으면 목표를 줄여요
    return { today: today, goal: g, got: Math.min(today, g) };
  };
  const c = count("concept", Content.concepts, DAILY_GOAL.concept);
  const q = count("ox", Content.ox, DAILY_GOAL.ox);
  const goal = c.goal + q.goal, got = c.got + q.got;
  return { goal: goal, got: got, pct: goal === 0 ? 100 : Math.round(got / goal * 100) };
}

function renderGoalMini() {
  const s = todayStats();
  const r = 38, c = 2 * Math.PI * r, off = c * (1 - s.pct / 100);
  return `<div class="card gbox"><svg viewBox="0 0 100 100" class="ring" role="img" aria-label="오늘 목표 ${s.pct}%">` +
    `<circle cx="50" cy="50" r="${r}" class="ring-bg"/>` +
    `<circle cx="50" cy="50" r="${r}" class="ring-fg" stroke-dasharray="${c.toFixed(1)}" stroke-dashoffset="${off.toFixed(1)}" transform="rotate(-90 50 50)"/>` +
    `<text x="50" y="57" text-anchor="middle" class="ring-t">${s.pct}%</text></svg>` +
    `<div class="gnum">${s.goal === 0 ? "모두 완료" : "오늘 " + s.got + " / " + s.goal}</div></div>`;
}
