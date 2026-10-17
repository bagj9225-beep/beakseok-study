// 이어서 학습 담당: 14일 일정 순서대로 개념 카드와 OX를 끊김 없이 이어서 보여줘요. (8단계)
// - 아직 학습하지 않은 것만 일정 순서(1일차 → 10일차)대로 줄을 세워요. 마지막에는 틀린 문제 총복습이 붙어요.
// - 하루에 몇 일차를 하든 상관없어요. 멈췄다가 다시 누르면 남은 것부터 이어져요.
// - 개념 카드는 뒷면을 확인해야 다음으로 넘어가요. (뒷면 확인 = 학습 완료)

const fl = { q: [], i: 0, shown: false, saw: false, picked: null, correct: 0, wrong: 0, learned: 0, done: false };

function buildFlowQueue() {
  const seen = Store.get("seen.concept", {}), solved = Store.get("solved.ox", {}), wrong = getWrong();
  const plans = {};
  SUBJECTS.forEach(s => { plans[s] = planFor(s); });          // planFor는 roadmap.js, getWrong은 ox.js에 있어요
  const q = [];
  for (let d = 0; d < LEARN_DAYS; d++) {
    SUBJECTS.forEach(s => {
      plans[s][d].forEach(unit => {
        Content.concepts.filter(c => c.subject === s && c.unit === unit && !seen[c.id])
          .forEach(c => q.push({ type: "concept", id: c.id, day: d, unit: unit }));
        Content.ox.filter(x => x.subject === s && x.unit === unit && !solved[x.id])
          .forEach(x => q.push({ type: "ox", id: x.id, day: d, unit: unit }));
      });
    });
  }
  Content.ox.filter(x => wrong[x.id]).forEach(x => q.push({ type: "ox", id: x.id, day: LEARN_DAYS, unit: x.unit, review: true }));
  return q;
}

function resetItem() { fl.shown = false; fl.saw = false; fl.picked = null; }
function startFlow() {
  fl.q = buildFlowQueue(); fl.i = 0; fl.correct = 0; fl.wrong = 0; fl.learned = 0; fl.done = false;
  resetItem();
  return fl.q.length;
}

// 로드맵의 동그라미 버튼
function renderFlowButton() {
  const q = buildFlowQueue(), n = q.length;
  const started = Object.keys(Store.get("seen.concept", {})).length + Object.keys(Store.get("solved.ox", {})).length > 0;
  const label = n === 0 ? "모두<br>완료" : started ? "이어서<br>학습" : "학습<br>시작";
  const cap = n === 0 ? "일정의 학습과 복습을 모두 마쳤어요."
    : "남은 학습 " + n + "개 · 다음: " + (q[0].review ? "총복습" : (q[0].day + 1) + "일차 · " + esc(q[0].unit));
  return `<div class="circlewrap"><button type="button" class="circle" data-action="f-start"${n === 0 ? " disabled" : ""}>${label}</button>` +
    `<div class="ccap">${cap}</div>` +
    `<div class="gsmall">일정 순서대로 이어서 학습해요. 하루에 여러 일차를 해도 괜찮아요.</div></div>`;
}

function renderFlow() {
  if (fl.done) {
    const left = buildFlowQueue().length;
    return `<div class="card done"><div class="big">여기까지 했어요</div><div class="sub">` +
      `${fl.learned}개를 새로 학습했어요.` + (fl.wrong > 0 ? ` 틀린 ${fl.wrong}문제는 오답 복습에 저장했어요.` : "") +
      (left === 0 ? " 14일 일정의 학습을 모두 마쳤어요. 심화 문제는 다음 단계에서 이어져요." : " 남은 학습은 이어서 계속할 수 있어요.") +
      `</div><div class="pager"><button type="button" data-action="f-exit">로드맵으로</button>` +
      (left > 0 ? `<button type="button" class="primary" data-action="f-restart">계속하기</button>` : "") + `</div></div>`;
  }
  const it = fl.q[fl.i];
  const pct = Math.round(((fl.i + 1) / fl.q.length) * 100);
  let html = `<div class="study-top"><button type="button" class="exit" data-action="f-exit">나가기</button>` +
    `<div class="progress"><div class="label">${fl.i + 1} / ${fl.q.length}</div><div class="bar"><i style="width:${pct}%"></i></div></div></div>` +
    `<div class="chip">${it.review ? "총복습" : (it.day + 1) + "일차 · " + esc(it.unit)}</div>`;

  let canNext;
  if (it.type === "concept") {
    const c = Content.concepts.find(x => x.id === it.id);
    html += !fl.shown
      ? `<button type="button" class="flash front" data-action="f-flip" aria-label="카드 뒤집기"><div class="unit">${esc(c.unit)}</div>` +
        `<div class="q">${esc(c.front)}</div><div class="hint">눌러서 답 보기</div></button>`
      : `<button type="button" class="flash" data-action="f-flip" aria-label="앞면으로 돌아가기"><div class="unit">${esc(c.unit)}</div>` +
        `<div class="term">${esc(c.term)}</div><div class="lbl">뜻</div><div class="txt">${esc(c.definition)}</div>` +
        `<div class="lbl">핵심</div><div class="txt">${esc(c.key_point)}</div>` +
        `<div class="lbl">헷갈리는 점</div><div class="txt">${esc(c.confusion)}</div></button>`;
    canNext = fl.saw;
  } else {
    const q = Content.ox.find(x => x.id === it.id), answered = fl.picked !== null;
    html += `<div class="card ox-q"><div class="unit">${esc(q.unit)}</div><div class="q">${esc(q.question)}</div></div><div class="ox-btns">` +
      [true, false].map(v => {
        let cls = "ox-btn";
        if (answered) cls += v === q.answer ? " right" : v === fl.picked ? " wrong" : " dim";
        return `<button type="button" class="${cls}" data-action="f-answer" data-value="${v}"${answered ? " disabled" : ""} aria-label="${v ? "O" : "X"}">${v ? "O" : "X"}</button>`;
      }).join("") + `</div>`;
    if (answered) {
      const right = fl.picked === q.answer, concept = Content.concepts.find(c => c.id === q.concept_id);
      html += `<div class="card result"><div class="head ${right ? "ok" : "bad"}">${right ? "정답이에요" : "오답이에요"} · 정답은 ${q.answer ? "O" : "X"}</div>` +
        (!right ? `<div class="txt">오답 복습에 저장했어요.</div>` : (it.review ? `<div class="txt">오답 목록에서 빠졌어요.</div>` : "")) +
        `<div class="lbl">해설</div><div class="txt">${esc(q.explanation)}</div>` +
        (concept ? `<div class="lbl">관련 개념</div><div class="txt">${esc(concept.term)}</div>` : "") + `</div>`;
    }
    canNext = answered;
  }
  return html + `<div class="pager"><button type="button" class="primary" data-action="f-next"${canNext ? "" : " disabled"}>` +
    `${fl.i === fl.q.length - 1 ? "마치기" : "다음"}</button></div>`;
}

// app.js의 클릭 처리에서 불러요. 이어서 학습 버튼이면 처리하고 true를 돌려줘요.
function flowAction(action, value) {
  if (action.indexOf("f-") !== 0) return false;
  const it = fl.q[fl.i];
  if (action === "f-start") {
    if (startFlow() > 0) {
      if (!isDate(Store.get("roadmapStart", null))) Store.set("roadmapStart", kstToday());   // 처음 누른 날이 1일차
      state.screen = "flow";                                   // state는 app.js에 있어요
    }
  } else if (action === "f-flip") {
    fl.shown = !fl.shown;
    if (fl.shown) { markSeen(it.id); if (!fl.saw) { fl.saw = true; fl.learned++; } }
  } else if (action === "f-answer") {
    if (fl.picked !== null) return true;                      // 이미 골랐으면 무시
    const q = Content.ox.find(x => x.id === it.id);
    fl.picked = (value === "true");
    if (fl.picked === q.answer) { fl.correct++; if (it.review) clearWrong(q.id); }
    else { fl.wrong++; addWrong(q.id); }
    if (!it.review) fl.learned++;
    markSolved(q.id);
  } else if (action === "f-next") {
    const ok = it.type === "concept" ? fl.saw : fl.picked !== null;
    if (!ok) return true;
    if (fl.i < fl.q.length - 1) { fl.i++; resetItem(); } else fl.done = true;
  } else if (action === "f-restart") {
    if (startFlow() === 0) state.screen = "home";
  } else if (action === "f-exit") {
    state.screen = "home";
  } else { return false; }
  return true;
}
