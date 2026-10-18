// 학습 기록 담당: 처음 학습한 날짜, 복습 횟수, 오답을 저장해요.
//
// 규칙
// - 학습 완료 기준: 개념 카드는 뒷면을 확인하면, OX·심화는 한 번 풀면(정답/오답 무관) "새로 학습"이에요.
// - 이미 학습한 것을 다시 하면 "복습"으로만 세고, 진도와 오늘 목표에는 더하지 않아요.
// - 오답은 틀리면 저장하고, 오답 복습에서 맞히면 목록에서 빠져요. (일반 풀이에서 맞혀도 그대로)

const LEARN_KEY = { concept: "seen.concept", ox: "solved.ox", mcq: "solved.mcq" };   // 저장 키 이름 (바꾸지 마세요)

function learnedMap(type) { return Store.get(LEARN_KEY[type], {}); }
function isLearned(type, id) { return !!learnedMap(type)[id]; }

// 기록에 적힌 날짜 읽기. 새 기록은 "2026-10-20" 같은 글자, 아주 예전 기록은 시각 숫자라서 둘 다 처리해요.
function learnedDate(v) {
  if (typeof v === "string") return v;
  if (typeof v === "number") return new Date(v + 9 * 3600 * 1000).toISOString().slice(0, 10);
  return "";
}

// 학습 기록 남기기. 처음이면 오늘 날짜를 적고 true, 이미 학습했으면 false를 돌려줘요.
function recordLearn(type, id) {
  const m = learnedMap(type);
  if (m[id]) return false;
  m[id] = kstToday();
  Store.set(LEARN_KEY[type], m);
  return true;
}

// 복습 횟수 (날짜별). 진도에는 더하지 않아요.
function bumpReview(type) {
  const t = kstToday(), r = Store.get("review", {});
  if (!r[t]) r[t] = {};
  r[t][type] = (r[t][type] || 0) + 1;
  Store.set("review", r);
}

/* ---------- 오답 ----------
   저장 모양: { "OX_ECO_001": { n: 틀린 횟수, last: 마지막으로 틀린 시각 } } (OX와 심화를 같이 저장해요) */
function getWrong() { return Store.get("wrong", {}); }
function addWrong(id) {
  const w = getWrong();
  w[id] = { n: (w[id] ? w[id].n : 0) + 1, last: Date.now() };
  Store.set("wrong", w);
}
function clearWrong(id) {
  const w = getWrong();
  if (w[id]) { delete w[id]; Store.set("wrong", w); }
}
// 지금 콘텐츠에 실제로 있는 오답만 골라요 (파일이 바뀌어 사라진 문제는 무시). subject가 없으면 전 과목.
function wrongItems(subject) {
  const w = getWrong();
  return Content.ox.concat(Content.mcq).filter(x => w[x.id] && (!subject || x.subject === subject));
}
