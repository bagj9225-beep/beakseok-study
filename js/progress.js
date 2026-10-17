// 진도 담당: 일일 목표, 진도율, 복습 기록을 계산하고 보여줘요. (7단계)
//
// 규칙
// - 학습 완료 기준: 개념 카드는 "뒷면을 확인"하면, OX 문제는 "한 번 풀면"(정답/오답 무관) 새로 학습한 것으로 세요.
// - 같은 카드·문제를 다시 학습하면 "복습"으로만 기록하고 진도율과 오늘 목표에는 더하지 않아요.
// - 오늘 목표는 오늘 "새로" 학습한 개수만 세요. 남은 새 학습이 목표보다 적으면 목표를 그만큼 줄여서 계산해요.
// - 아직 풀 수 없는 심화 문제는 진도율에 넣지 않아요. (9단계에서 추가)

const DEFAULT_GOALS = { concept: 10, ox: 20 };

function getGoals() {
  const g = Store.get("goals", {});
  const ok = n => Number.isInteger(n) && n >= 1 && n <= 200;
  return { concept: ok(g.concept) ? g.concept : DEFAULT_GOALS.concept, ox: ok(g.ox) ? g.ox : DEFAULT_GOALS.ox };
}

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

// 전체 진도율: 새로 학습한 서로 다른 카드·문제 수 / 전체 수
function overallStats() {
  const seen = Store.get("seen.concept", {}), solved = Store.get("solved.ox", {});
  const per = {};
  let done = 0, total = 0;
  SUBJECTS.forEach(s => {
    const cs_ = Content.concepts.filter(x => x.subject === s), qs = Content.ox.filter(x => x.subject === s);
    const d = cs_.filter(x => seen[x.id]).length + qs.filter(x => solved[x.id]).length;
    const n = cs_.length + qs.length;
    per[s] = { done: d, total: n, pct: n ? Math.round(d / n * 100) : 0 };
    done += d; total += n;
  });
  return { done: done, total: total, pct: total ? Math.round(done / total * 100) : 0, per: per };
}

function barRow(label, now, goal) {
  const pct = goal > 0 ? Math.min(100, Math.round(now / goal * 100)) : 100;
  return `<div class="grow"><span>${label}</span><span>${goal > 0 ? now + " / " + goal : "완료"}</span></div>` +
    `<div class="bar"><i style="width:${pct}%"></i></div>`;
}

// 오늘의 목표 카드. compact=true면 홈용 간단한 모양이에요.
function renderGoalCard(compact) {
  const s = todayStats();
  const sum = s.cGoal + s.qGoal, got = Math.min(s.cToday, s.cGoal) + Math.min(s.qToday, s.qGoal);   // 개념+문제를 합쳐서 보여줘요
  let msg;
  if (s.empty) msg = "새로 배울 내용을 모두 마쳤어요. 오답 복습이나 다시 보기를 해 보세요.";
  else if (s.pct >= 100) msg = "오늘 목표를 모두 채웠어요. 수고했어요.";
  else msg = `목표까지 ${Math.max(0, sum - got)}개 남았어요.`;

  let html = `<div class="card goal"><h2 style="margin-top:0">오늘의 목표 <span class="gpct">${s.pct}%</span></h2>` +
    barRow("오늘 새로 학습", got, sum) +
    `<div class="gmsg">${msg}</div>`;
  if (!compact) {
    html += `<div class="gsmall">복습 ${s.rev.concept + s.rev.ox}개 · 복습 대기 오답 ${wrongTotal()}문제</div>` +
      `<div class="gsmall">오늘 목표는 오늘 처음 학습한 것만 세요. 복습은 목표에 더해지지 않아요.</div>`;
  }
  return html + `</div>`;
}

function renderOverallCard() {
  const o = overallStats();
  return `<div class="card"><h2 style="margin-top:0">전체 진도 <span class="gpct">${o.pct}%</span></h2>` +
    `<div class="bar"><i style="width:${o.pct}%"></i></div>` +
    `<div class="gsmall" style="margin-top:6px">지금까지 처음 학습한 카드·문제 ${o.done} / ${o.total}개</div>` +
    SUBJECTS.map(s => `<div class="grow"><span>${s}</span><span>${o.per[s].done} / ${o.per[s].total}</span></div>` +
      `<div class="bar"><i style="width:${o.per[s].pct}%"></i></div>`).join("") + `</div>`;
}

function renderGoalSettings() {
  const g = getGoals();
  return `<div class="card"><h2 style="margin-top:0">일일 목표 정하기</h2>` +
    `<div class="sub">하루에 새로 학습할 개수예요. 언제든 바꿀 수 있고, 기록은 그대로 남아요. (1~200)</div>` +
    `<div class="grow"><span>개념 카드</span></div><input type="number" id="goal-concept" class="dateinput" min="1" max="200" value="${g.concept}">` +
    `<div class="grow" style="margin-top:8px"><span>문제 풀이</span></div><input type="number" id="goal-ox" class="dateinput" min="1" max="200" value="${g.ox}">` +
    `<div class="pager"><button type="button" class="primary" data-action="r-save-goals">저장</button></div>` +
    `<div class="gsmall" style="margin-top:10px">학습 완료 기준<br>· 개념 카드: 뒷면을 확인하면 학습 완료<br>` +
    `· OX 문제: 한 번 풀면 학습 완료 (정답·오답 무관)<br>· 같은 카드·문제를 다시 학습하면 복습으로만 기록돼요</div></div>`;
}

function progressSections() { return renderGoalCard(false) + renderOverallCard() + renderFlowButton() + renderGoalSettings(); }
