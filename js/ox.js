// OX 퀴즈 담당: 문제 보여주기, 채점, 즉시 해설, 오답 저장·복습. (4~5단계)
// 화면 전환 상태(state)는 app.js가 맡고, 글자를 안전하게 넣는 esc()는 concept.js에 있어요.

const os = { list: [], i: 0, picked: null, correct: 0, wrong: 0, done: false, subject: "", review: false, units: null };

/* ---------- 오답 저장소 ----------
   저장 모양: { "ox-001": { n: 틀린 횟수, last: 마지막으로 틀린 시각 } }
   오답 복습에서 맞히면 목록에서 빠져요. 일반 풀이에서 맞혀도 목록은 그대로예요. */
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
// 현재 콘텐츠에 실제로 있는 오답 문제만 골라요 (파일이 바뀌어 사라진 문제는 무시)
function wrongItems(subject) {
  const w = getWrong();
  return Content.ox.filter(x => x.subject === subject && w[x.id]);
}
function wrongCount(subject) { return wrongItems(subject).length; }

/* ---------- 시작 ---------- */
function startOx(subject, units) {   // units: 로드맵에서 시작할 때 그날 단원 목록 (없으면 전체)
  os.subject = subject;
  os.units = units || null;
  os.list = Content.ox.filter(x => x.subject === subject && (!units || units.includes(x.unit)));
  resetRun(false);
}
function startOxReview(subject) {
  os.subject = subject;
  os.units = null;
  os.list = wrongItems(subject);
  resetRun(true);
}
function resetRun(review) {
  os.review = review;
  os.i = 0;
  os.picked = null;   // 아직 고르지 않음 (true = O, false = X)
  os.correct = 0;
  os.wrong = 0;
  os.done = false;
}

// 문제를 푼 기록. 처음 푼 시각만 남기고, 다시 풀어도 기록은 늘지 않아요. (7단계 진도율에서 사용)
function markSolved(id) {
  const solved = Store.get("solved.ox", {});
  if (!solved[id]) { solved[id] = kstToday(); Store.set("solved.ox", solved); }   // 처음 푼 날짜(한국 기준)
  else bumpReview("ox");                                                          // 이미 푼 문제는 복습으로만 기록
}

/* ---------- 화면 ---------- */
function renderOx() {
  const title = os.review ? "오답 복습" : "OX 퀴즈";
  if (os.done) {
    let body;
    if (os.review) {
      const left = os.list.length - os.correct;
      body = `${os.list.length}문제 중 ${os.correct}문제를 해결했어요.` +
        (left > 0 ? ` ${left}문제는 오답 목록에 남아 있어요.` : " 오답이 모두 정리됐어요!");
    } else {
      body = `${os.list.length}문제 중 ${os.correct}문제를 맞혔어요.` +
        (os.wrong > 0 ? ` 틀린 ${os.wrong}문제는 홈의 오답 복습에서 다시 풀 수 있어요.` : "");
    }
    const again = os.review
      ? (os.list.length - os.correct > 0 ? `<button type="button" class="primary" data-action="o-restart">남은 오답 다시 풀기</button>` : "")
      : `<button type="button" class="primary" data-action="o-restart">다시 풀기</button>`;
    return `<div class="card done"><div class="big">${esc(os.subject)} ${title} 끝!</div>` +
      `<div class="sub">${body}</div>` +
      `<div class="pager"><button type="button" data-action="o-exit">홈으로</button>${again}</div></div>`;
  }

  const q = os.list[os.i];
  const answered = os.picked !== null;
  const pct = Math.round(((os.i + 1) / os.list.length) * 100);

  let html = `<div class="study-top"><button type="button" class="exit" data-action="o-exit">나가기</button>` +
    `<div class="progress"><div class="label">${os.review ? "오답 복습 " : ""}${os.i + 1} / ${os.list.length}</div>` +
    `<div class="bar"><i style="width:${pct}%"></i></div></div></div>`;

  html += `<div class="card ox-q">${os.review ? `<div class="tag">오답 복습</div>` : ""}` +
    `<div class="unit">${esc(q.unit)}</div><div class="q">${esc(q.question)}</div></div>`;

  html += `<div class="ox-btns">` + [true, false].map(v => {
    let cls = "ox-btn";
    if (answered) {
      if (v === q.answer) cls += " right";            // 정답 쪽은 초록
      else if (v === os.picked) cls += " wrong";      // 내가 고른 오답은 주황
      else cls += " dim";
    }
    return `<button type="button" class="${cls}" data-action="o-answer" data-value="${v}"` +
      `${answered ? " disabled" : ""} aria-label="${v ? "O" : "X"}">${v ? "O" : "X"}</button>`;
  }).join("") + `</div>`;

  if (answered) {
    const right = os.picked === q.answer;
    const concept = Content.concepts.find(c => c.id === q.concept_id);
    html += `<div class="card result"><div class="head ${right ? "ok" : "bad"}">` +
      `${right ? "정답이에요" : "오답이에요"} · 정답은 ${q.answer ? "O" : "X"}</div>` +
      (os.review && right ? `<div class="txt">오답 목록에서 빠졌어요.</div>` : "") +
      (!right ? `<div class="txt">오답 복습에 저장했어요.</div>` : "") +
      `<div class="lbl">해설</div><div class="txt">${esc(q.explanation)}</div>` +
      (concept ? `<div class="lbl">관련 개념</div><div class="txt">${esc(concept.term)}</div>` : "") +
      `</div>`;
  }

  html += `<div class="pager"><button type="button" class="primary" data-action="o-next"${answered ? "" : " disabled"}>` +
    `${os.i === os.list.length - 1 ? "결과 보기" : "다음 문제"}</button></div>`;
  return html;
}

/* ---------- 클릭 처리 ----------
   app.js의 클릭 처리에서 불러요. OX·오답 복습 버튼이면 처리하고 true를 돌려줘요. */
function oxAction(action, value) {
  if (action === "review") {                            // 홈의 오답 복습 버튼
    startOxReview(state.subject);
    if (os.list.length === 0) { state.note = "복습할 오답이 없어요."; return true; }
    state.screen = "ox"; state.note = "";
  } else if (action === "o-answer") {
    if (os.picked !== null) return true;               // 이미 골랐으면 무시 (중복 채점 방지)
    const q = os.list[os.i];
    os.picked = (value === "true");
    if (os.picked === q.answer) {
      os.correct++;
      if (os.review) clearWrong(q.id);                 // 복습에서 맞히면 오답 목록에서 제거
    } else {
      os.wrong++;
      addWrong(q.id);                                  // 틀리면 오답 목록에 저장
    }
    markSolved(q.id);
  } else if (action === "o-next") {
    if (os.picked === null) return true;               // 답을 고르기 전에는 넘어가지 않아요
    if (os.i < os.list.length - 1) { os.i++; os.picked = null; }
    else os.done = true;
  } else if (action === "o-restart") {
    if (os.review) startOxReview(os.subject); else startOx(os.subject, os.units);
    if (os.list.length === 0) state.screen = "home";
  } else if (action === "o-exit") {
    state.screen = "home";   // state는 app.js에 있어요
  } else {
    return false;
  }
  return true;
}
