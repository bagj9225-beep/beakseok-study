// OX 퀴즈 담당: 문제 보여주기, 채점, 즉시 해설. (4단계)
// 화면 전환 상태(state)는 app.js가 맡고, 글자를 안전하게 넣는 esc()는 concept.js에 있어요.

const os = { list: [], i: 0, picked: null, correct: 0, done: false, subject: "" };

function startOx(subject) {
  os.subject = subject;
  os.list = Content.ox.filter(x => x.subject === subject);
  os.i = 0;
  os.picked = null;   // 아직 고르지 않음 (true = O, false = X)
  os.correct = 0;
  os.done = false;
}

// 문제를 푼 기록. 처음 푼 시각만 남기고, 다시 풀어도 기록은 늘지 않아요. (7단계 진도율에서 사용)
function markSolved(id) {
  const solved = Store.get("solved.ox", {});
  if (!solved[id]) { solved[id] = Date.now(); Store.set("solved.ox", solved); }
}

function renderOx() {
  if (os.done) {
    return `<div class="card done"><div class="big">${esc(os.subject)} OX 퀴즈 끝!</div>` +
      `<div class="sub">${os.list.length}문제 중 ${os.correct}문제를 맞혔어요.</div>` +
      `<div class="pager"><button type="button" data-action="o-exit">홈으로</button>` +
      `<button type="button" class="primary" data-action="o-restart">다시 풀기</button></div></div>`;
  }
  const q = os.list[os.i];
  const answered = os.picked !== null;
  const pct = Math.round(((os.i + 1) / os.list.length) * 100);

  let html = `<div class="study-top"><button type="button" class="exit" data-action="o-exit">나가기</button>` +
    `<div class="progress"><div class="label">${os.i + 1} / ${os.list.length}</div>` +
    `<div class="bar"><i style="width:${pct}%"></i></div></div></div>`;

  html += `<div class="card ox-q"><div class="unit">${esc(q.unit)}</div><div class="q">${esc(q.question)}</div></div>`;

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
      `<div class="lbl">해설</div><div class="txt">${esc(q.explanation)}</div>` +
      (concept ? `<div class="lbl">관련 개념</div><div class="txt">${esc(concept.term)}</div>` : "") +
      `</div>`;
  }

  html += `<div class="pager"><button type="button" class="primary" data-action="o-next"${answered ? "" : " disabled"}>` +
    `${os.i === os.list.length - 1 ? "결과 보기" : "다음 문제"}</button></div>`;
  return html;
}

// app.js의 클릭 처리에서 불러요. OX 버튼이면 처리하고 true를 돌려줘요.
function oxAction(action, value) {
  if (action === "o-answer") {
    if (os.picked !== null) return true;               // 이미 골랐으면 무시 (중복 채점 방지)
    const q = os.list[os.i];
    os.picked = (value === "true");
    if (os.picked === q.answer) os.correct++;
    markSolved(q.id);
  } else if (action === "o-next") {
    if (os.picked === null) return true;               // 답을 고르기 전에는 넘어가지 않아요
    if (os.i < os.list.length - 1) { os.i++; os.picked = null; }
    else os.done = true;
  } else if (action === "o-restart") {
    startOx(os.subject);
  } else if (action === "o-exit") {
    state.screen = "home";   // state는 app.js에 있어요
  } else {
    return false;
  }
  return true;
}
