// 학습 화면 담당: 개념 카드, OX, 심화 5지선다를 한 화면에서 순서대로 보여줘요.
// 동그라미 "이어서 학습"(home.js)과 자유 학습(free.js)이 모두 이 화면을 써요.
// 학습 기록(새로 학습/복습/오답)은 records.js의 함수로 남겨요.

const ss = {
  list: [],        // 학습할 항목들: { type: "concept"|"ox"|"mcq", id, day?, review? }
  i: 0,            // 지금 보는 항목 번호
  shown: false,    // 개념 카드: 지금 뒷면인지
  saw: false,      // 개념 카드: 이번에 뒷면을 한 번이라도 봤는지
  picked: null,    // 문제: 고른 답 (OX는 true/false, 심화는 0~4)
  learned: 0, correct: 0, wrong: 0, done: false,
  opts: {},        // flow(이어서 학습), wrongMode(오답 복습), posKey(마지막 위치 저장 키), rebuild(다시 하기 목록)
  reviewed: new Set(),   // 이번 학습에서 이미 기록한 개념 카드 (여러 번 뒤집어도 한 번만 세요)
  cheer: null,     // 이어서 학습: 방금 끝낸 일차 번호 (축하 화면을 보여 줄 때만 값이 있어요)
  mark: null,      // 이번 일차를 시작할 때의 개수 (축하 화면에서 그 일차 동안 한 개수만 보여 주려고)
};

function startStudy(list, opts) {
  Object.assign(ss, { list: list, i: 0, learned: 0, correct: 0, wrong: 0, done: false, opts: opts || {}, reviewed: new Set(),
    cheer: null, mark: { learned: 0, correct: 0, wrong: 0 } });
  if (ss.opts.posKey) {
    const p = Store.get(ss.opts.posKey, 0);
    if (Number.isInteger(p) && p > 0 && p < list.length) ss.i = p;
  }
  resetItem();
  state.screen = "study";   // state는 app.js에 있어요
}
function resetItem() { ss.shown = false; ss.saw = false; ss.picked = null; }
function curItem() { return ss.list[ss.i]; }
function curData() { return Content.byId[curItem().id]; }
function savePos(n) { if (ss.opts.posKey) Store.set(ss.opts.posKey, n); }
function conceptOnly() { return ss.list.every(it => it.type === "concept"); }

// 다음으로 넘어갈 수 있는지: 문제는 답을 골라야, 개념 카드는 이어서 학습일 때만 뒷면을 봐야 해요.
function canNext() {
  const it = curItem();
  if (it.type === "concept") return ss.opts.flow ? ss.saw : true;
  return ss.picked !== null;
}
function canPrev() { return !ss.opts.flow && conceptOnly() && ss.i > 0; }
function isRight(it, x) { return it.type === "ox" ? ss.picked === x.answer : ss.picked === x.answer_index; }

/* ---------- 화면 ---------- */
function renderStudy() {
  if (ss.cheer !== null) return renderCheer();
  if (ss.done) return renderStudyDone();
  const it = curItem(), x = curData(), n = ss.list.length;
  const tag = ss.opts.flow ? (it.review ? "오답 복습" : (it.day + 1) + "일차") : (ss.opts.wrongMode ? "오답 복습" : "");
  let html = `<div class="study-top"><button type="button" class="exit" data-action="s-exit" aria-label="나가기">✕</button>` +
    `<div class="bar"><i style="width:${Math.round((ss.i + 1) / n * 100)}%"></i></div><div class="count">${ss.i + 1}/${n}</div></div>` +
    `<div class="chip">${tag ? esc(tag) + " · " : ""}${esc(x.unit)}</div>`;

  if (it.type === "concept") html += conceptView(x);
  else html += (it.type === "ox" ? oxView(x) : mcqView(x)) + (ss.picked !== null ? resultView(it, x) : "");

  const last = ss.i === n - 1;
  html += `<div class="pager">` +
    (!ss.opts.flow && conceptOnly() ? `<button type="button" data-action="s-prev"${canPrev() ? "" : " disabled"}>이전</button>` : "") +
    `<button type="button" class="primary" data-action="s-next"${canNext() ? "" : " disabled"}>${last ? "마치기" : "다음"}</button></div>`;
  return html;
}

function conceptView(c) {
  if (!ss.shown) {
    return `<button type="button" class="flash front" data-action="s-flip" aria-label="카드 뒤집기">` +
      `<div class="q">${esc(c.front)}</div><div class="hint">눌러서 답 보기</div></button>`;
  }
  return `<button type="button" class="flash back" data-action="s-flip" aria-label="앞면으로 돌아가기">` +
    `<div class="term">${esc(c.term)}</div>` +
    `<div class="lbl">뜻</div><div class="txt">${esc(c.definition)}</div>` +
    `<div class="lbl">핵심</div><div class="txt">${esc(c.key_point)}</div>` +
    `<div class="lbl">헷갈리는 점</div><div class="txt">${esc(c.confusion)}</div></button>`;
}

function oxView(q) {
  const answered = ss.picked !== null;
  return `<div class="card qcard"><div class="q">${esc(q.question)}</div></div><div class="ox-btns">` +
    [true, false].map(v => {
      let cls = "ox-btn";
      if (answered) cls += v === q.answer ? " right" : v === ss.picked ? " wrong" : " dim";
      return `<button type="button" class="${cls}" data-action="s-pick" data-value="${v}"${answered ? " disabled" : ""}>${v ? "O" : "X"}</button>`;
    }).join("") + `</div>`;
}

function mcqView(q) {
  const answered = ss.picked !== null;
  return `<div class="card qcard"><div class="q pre">${esc(q.question)}</div></div><div class="choices">` +
    q.choices.map((c, k) => {
      let cls = "choice";
      if (answered) cls += k === q.answer_index ? " right" : k === ss.picked ? " wrong" : " dim";
      return `<button type="button" class="${cls}" data-action="s-pick" data-value="${k}"${answered ? " disabled" : ""}>` +
        `<span class="cn">${k + 1}</span><span class="ct">${esc(c)}</span></button>`;
    }).join("") + `</div>`;
}

function resultView(it, q) {
  const right = isRight(it, q);
  const ans = it.type === "ox" ? (q.answer ? "O" : "X") : "①②③④⑤"[q.answer_index];
  const fromWrong = it.review || ss.opts.wrongMode;
  const ids = it.type === "ox" ? [q.concept_id] : (q.concept_ids || []);
  const terms = ids.map(id => Content.byId[id]).filter(Boolean).map(c => c.term);
  return `<div class="card result"><div class="head ${right ? "ok" : "bad"}">${right ? "정답" : "오답 · 정답 " + ans}</div>` +
    (!right ? `<div class="memo">오답 노트에 저장했어요</div>` : fromWrong ? `<div class="memo">오답 노트에서 뺐어요</div>` : "") +
    `<div class="lbl">해설</div><div class="txt">${esc(q.explanation)}</div>` +
    (Array.isArray(q.solution_steps) && q.solution_steps.length
      ? `<div class="lbl">풀이</div><ol class="steps">${q.solution_steps.map(s => `<li>${esc(s)}</li>`).join("")}</ol>` : "") +
    (terms.length ? `<div class="lbl">관련 개념</div><div class="rel">${terms.map(t => `<span>${esc(t)}</span>`).join("")}</div>` : "") +
    `</div>`;
}

function renderStudyDone() {
  const name = getProfile().name;   // getProfile은 onboard.js에 있어요
  const solved = ss.correct + ss.wrong;
  const again = ss.opts.rebuild ? ss.opts.rebuild().length : 0;
  const againLabel = ss.opts.flow ? "계속하기" : ss.opts.wrongMode ? "남은 오답 풀기" : "다시 하기";
  return `<div class="card finish"><div class="big">${name ? esc(name) + "님, " : ""}수고했어요</div><div class="stats">` +
    `<div><b>${ss.learned}</b><span>새로 학습</span></div>` +
    (solved ? `<div><b>${ss.correct}/${solved}</b><span>정답</span></div>` : "") +
    (ss.opts.flow && again === 0 ? `<div><b>✓</b><span>14일 일정 끝</span></div>` : "") +
    `</div><div class="pager"><button type="button" data-action="s-exit">돌아가기</button>` +
    (again ? `<button type="button" class="primary" data-action="s-again">${againLabel}</button>` : "") + `</div></div>`;
}

// 일차 완료 축하 화면 (듀오링고처럼). 다른 과목도 할지, 이 과목을 더 할지, 그만할지 물어요.
function otherSubject() { return SUBJECTS.find(x => x !== ss.opts.subject); }
function renderCheer() {
  const learned = ss.learned - ss.mark.learned, correct = ss.correct - ss.mark.correct;
  const solved = correct + ss.wrong - ss.mark.wrong;
  const more = !ss.done || (ss.opts.rebuild && ss.opts.rebuild().length > 0);
  const other = otherSubject(), oq = other ? flowQueue(other) : [];
  let ask = "", btns;
  if (oq.length) {
    ask = `${other}도 할까요?`;
    btns = `<button type="button" class="primary" data-action="s-switch">${other} ${flowLabel(oq)} 하기</button>` +   // flowLabel은 home.js
      (more ? `<button type="button" data-action="s-more">${esc(ss.opts.subject)} 더 하기</button>` : "") +
      `<button type="button" data-action="s-exit">오늘은 그만</button>`;
  } else if (more) {
    ask = "더 학습할까요?";
    btns = `<button type="button" class="primary" data-action="s-more">더 학습하기</button><button type="button" data-action="s-exit">오늘은 그만</button>`;
  } else btns = `<button type="button" class="primary" data-action="s-exit">홈으로</button>`;
  return `<div class="card finish cheer"><div class="cheer-icon" aria-hidden="true">🎉</div>` +
    `<div class="big">${esc(ss.opts.subject)} ${ss.cheer + 1}일차 완료!</div><div class="stats">` +
    `<div><b>${learned}</b><span>새로 학습</span></div>` +
    (solved ? `<div><b>${correct}/${solved}</b><span>정답</span></div>` : "") + `</div>` +
    (ask ? `<div class="ask">${esc(ask)}</div>` : "") + `<div class="pager col">${btns}</div></div>`;
}
function dayComplete(d) { const p = dayProgress(d, null, [ss.opts.subject]); return p.total > 0 && p.done >= p.total; }   // dayProgress는 plan.js

/* ---------- 동작 ---------- */
Object.assign(Actions, {
  "s-flip"() {
    const c = curData();
    ss.shown = !ss.shown;
    if (ss.shown && !ss.saw) {
      ss.saw = true;
      if (!ss.reviewed.has(c.id)) {
        ss.reviewed.add(c.id);
        if (recordLearn("concept", c.id)) ss.learned++; else bumpReview("concept");
      }
    }
    return "stay";
  },
  "s-pick"(value) {
    if (ss.picked !== null) return "stay";            // 이미 골랐으면 무시 (중복 채점 방지)
    const it = curItem(), q = curData();
    ss.picked = it.type === "ox" ? value === "true" : Number(value);
    if (isRight(it, q)) { ss.correct++; if (it.review || ss.opts.wrongMode) clearWrong(q.id); }
    else { ss.wrong++; addWrong(q.id); }
    if (recordLearn(it.type, q.id)) ss.learned++; else bumpReview(it.type);
    return "result";
  },
  "s-next"() {
    if (!canNext()) return "stay";
    const it = curItem(), nxt = ss.list[ss.i + 1];
    // 이어서 학습에서 한 일차의 마지막 항목을 끝냈으면 축하 화면을 띄워요
    const dayEnd = ss.opts.flow && !it.review && (!nxt || nxt.review || nxt.day !== it.day) && dayComplete(it.day);
    if (nxt) { ss.i++; resetItem(); savePos(ss.i); }
    else { ss.done = true; savePos(0); }
    if (dayEnd) ss.cheer = it.day;
  },
  "s-more"() {
    ss.cheer = null;
    ss.mark = { learned: ss.learned, correct: ss.correct, wrong: ss.wrong };
    if (ss.done) return Actions["s-again"]();   // 남은 게 오답 복습뿐이면 새로 줄을 세워 이어가요
  },
  "s-switch"() { if (!startFlow(otherSubject())) state.screen = "tab"; },   // startFlow는 home.js
  "s-prev"() { if (canPrev()) { ss.i--; resetItem(); savePos(ss.i); } },
  "s-again"() {
    const list = ss.opts.rebuild ? ss.opts.rebuild() : [];
    if (list.length) { savePos(0); startStudy(list, ss.opts); } else state.screen = "tab";
  },
  "s-exit"() { state.screen = "tab"; },
});

/* ---------- 손가락 밀기·키보드 ----------
   카드나 문제 화면에서 왼쪽으로 밀면 "다음", 오른쪽으로 밀면 "이전" 버튼을 누른 것과 같아요. (버튼이 꺼져 있으면 무시)
   컴퓨터에서는 ← → 키, 스페이스(카드 뒤집기), O/X, 1~5 키로도 할 수 있어요. */
function pressAction(name, value) {
  const sel = `[data-action="${name}"]` + (value === undefined ? "" : `[data-value="${value}"]`);
  const b = document.querySelector("#view " + sel);
  if (b && !b.disabled) b.click();
}
let touchX = null, touchY = null;
document.addEventListener("touchstart", e => {
  if (state.screen !== "study" || e.touches.length !== 1) { touchX = null; return; }
  touchX = e.touches[0].clientX; touchY = e.touches[0].clientY;
}, { passive: true });
document.addEventListener("touchend", e => {
  if (touchX === null) return;
  const dx = e.changedTouches[0].clientX - touchX, dy = e.changedTouches[0].clientY - touchY;
  touchX = null;
  if (Math.abs(dx) > 60 && Math.abs(dx) > Math.abs(dy) * 2) pressAction(dx < 0 ? "s-next" : "s-prev");
});
document.addEventListener("keydown", e => {
  if (state.screen !== "study" || e.target.matches("input, textarea") || e.ctrlKey || e.metaKey || e.altKey) return;
  const k = e.key.toLowerCase();
  if (k === "arrowright") pressAction("s-next");
  else if (k === "arrowleft") pressAction("s-prev");
  else if (k === " ") { e.preventDefault(); pressAction("s-flip"); }
  else if (k === "o") pressAction("s-pick", "true");
  else if (k === "x") pressAction("s-pick", "false");
  else if (k >= "1" && k <= "5") pressAction("s-pick", String(Number(k) - 1));
  else if (k === "escape") pressAction("s-exit");
});
