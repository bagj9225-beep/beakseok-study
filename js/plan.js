// 14일 일정 담당: 단원을 날짜(일차)에 나누고, 동그라미 "이어서 학습"의 순서를 정해요.
// - 14일은 "학습에 필요한 기간"이라 시험일과 상관없어요. 동그라미 버튼을 처음 누른 날이 1일차예요.
// - 하루에 여러 일차를 해도 돼요. 그래서 "지금 일차"는 날짜가 아니라 진도(아직 안 끝난 첫 일차)로 정해요.
// - 1~10일차: 단원별 새 학습(개념 카드 + OX). 11~14일차: 오답 총복습 + 심화. 심화는 잠그지 않아요.

const PLAN_DAYS = 14, LEARN_DAYS = 10;
const REVIEW_DAYS = PLAN_DAYS - LEARN_DAYS;   // 11~14일차, 4일

// 단원 목록을 n일에 나눠요. 단원이 n개 이상이면 고르게 묶고, 적으면 하루에 한 단원씩 앞에서부터 배정해요.
function spread(units, n) {
  const days = Array.from({ length: n }, () => []);
  units.forEach((u, j) => { days[units.length >= n ? Math.floor(j * n / units.length) : j].push(u); });
  return days;
}

// 과목별 일정: 길이 14인 목록, 각 칸은 그날의 단원들
function planFor(subject) {
  return spread(unitsOf(subject, ["concept", "ox"]), LEARN_DAYS).concat(spread(unitsOf(subject, ["mcq"]), REVIEW_DAYS));
}
function allPlans() { const p = {}; SUBJECTS.forEach(s => { p[s] = planFor(s); }); return p; }

// 한 일차에 배정된 항목들 (과목 순서 → 단원 순서 → 개념 카드 먼저, 그다음 문제). subjects를 주면 그 과목만.
function dayItems(i, plans, subjects) {
  plans = plans || allPlans();
  const out = [];
  const types = i < LEARN_DAYS ? ["concept", "ox"] : ["mcq"];
  (subjects || SUBJECTS).forEach(s => plans[s][i].forEach(unit => types.forEach(t =>
    Content[TYPE_LIST[t]].filter(x => x.subject === s && x.unit === unit)
      .forEach(x => out.push({ type: t, id: x.id, day: i, unit: unit })))));
  return out;
}

function dayProgress(i, plans, subjects) {
  const items = dayItems(i, plans, subjects);
  return { total: items.length, done: items.filter(it => isLearned(it.type, it.id)).length };
}

// 지금 일차: 항목이 있고 아직 다 끝나지 않은 첫 일차 (모두 끝났으면 -1)
function currentDay(plans) {
  plans = plans || allPlans();
  for (let i = 0; i < PLAN_DAYS; i++) {
    const p = dayProgress(i, plans);
    if (p.total > 0 && p.done < p.total) return i;
  }
  return -1;
}

// 동그라미 버튼의 학습 순서 (한 과목씩): 1~10일차의 안 한 것 → 오답 총복습 → 11~14일차의 안 푼 심화
function flowQueue(subject) {
  const plans = allPlans(), q = [], ids = new Set(), only = [subject];
  const add = it => { if (!ids.has(it.id)) { ids.add(it.id); q.push(it); } };
  for (let d = 0; d < LEARN_DAYS; d++) dayItems(d, plans, only).filter(it => !isLearned(it.type, it.id)).forEach(add);
  wrongItems(subject).forEach(x => add({ type: x._type, id: x.id, day: LEARN_DAYS, unit: x.unit, review: true }));
  for (let d = LEARN_DAYS; d < PLAN_DAYS; d++) dayItems(d, plans, only).filter(it => !isLearned(it.type, it.id)).forEach(add);
  return q;
}
