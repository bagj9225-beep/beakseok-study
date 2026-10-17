// 개념 카드 담당: 카드 뒤집기, 이전/다음, 학습한 카드 기록. (3단계)
// 화면 전환 상태(state)와 화면 출력은 app.js가 맡고, 여기서는 카드 학습만 처리해요.

// 화면에 글자를 안전하게 넣는 도우미 (OX, 심화 화면에서도 같이 써요)
function esc(s) {
  return String(s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "\"": "&quot;" }[c]));
}

const cs = { list: [], i: 0, flipped: false, done: false, subject: "", units: null, scoped: false, rv: new Set() };

function startConcept(subject, units, onlySeen) {   // units: 특정 단원만(없으면 전체), onlySeen: 이미 학습한 카드만(복습)
  cs.subject = subject;
  cs.units = units || null;
  cs.scoped = !!(units || onlySeen);   // 범위를 고르거나 복습일 때는 마지막 위치를 저장하지 않아요
  const seenNow = Store.get("seen.concept", {});
  cs.rv = new Set();   // 이번 학습에서 복습으로 센 카드 (같은 카드를 여러 번 뒤집어도 한 번만 세요)
  cs.list = Content.concepts.filter(x => x.subject === subject && (!units || units.includes(x.unit)) && (!onlySeen || seenNow[x.id]));
  const saved = cs.scoped ? 0 : Store.get("pos.concept." + subject, 0);      // 마지막으로 본 위치
  cs.i = Number.isInteger(saved) && saved >= 0 && saved < cs.list.length ? saved : 0;
  cs.flipped = false;
  cs.done = false;
}

// 마지막 위치 저장 (로드맵에서 단원별로 시작한 학습은 저장하지 않아요)
function savePos(n) { if (!cs.scoped) Store.set("pos.concept." + cs.subject, n); }

// 뒷면을 본 카드를 "학습함"으로 기록해요. 처음 본 시각만 남기고, 다시 봐도 기록은 늘지 않아요.
function markSeen(id) {
  const seen = Store.get("seen.concept", {});
  if (!seen[id]) { seen[id] = kstToday(); Store.set("seen.concept", seen); cs.rv.add(id); }   // 처음 학습한 날짜(한국 기준). 이번 학습 중 다시 뒤집어도 복습으로 세지 않아요
  else if (!cs.rv.has(id)) { cs.rv.add(id); bumpReview("concept"); }          // 이미 학습한 카드는 복습으로만 기록
}

function renderConcept() {
  if (cs.done) {
    return `<div class="card done"><div class="big">${esc(cs.subject)} 개념 카드를 끝까지 봤어요</div>` +
      `<div class="sub">${cs.list.length}장을 모두 확인했어요.</div>` +
      `<div class="pager"><button type="button" data-action="c-exit">홈으로</button>` +
      `<button type="button" class="primary" data-action="c-restart">처음부터 다시</button></div></div>`;
  }
  const c = cs.list[cs.i];
  const pct = Math.round(((cs.i + 1) / cs.list.length) * 100);
  let html = `<div class="study-top"><button type="button" class="exit" data-action="c-exit">나가기</button>` +
    `<div class="progress"><div class="label">${cs.i + 1} / ${cs.list.length}</div>` +
    `<div class="bar"><i style="width:${pct}%"></i></div></div></div>`;

  if (!cs.flipped) {
    html += `<button type="button" class="flash front" data-action="c-flip" aria-label="카드 뒤집기">` +
      `<div class="unit">${esc(c.unit)}</div><div class="q">${esc(c.front)}</div>` +
      `<div class="hint">눌러서 답 보기</div></button>`;
  } else {
    html += `<button type="button" class="flash" data-action="c-flip" aria-label="앞면으로 돌아가기">` +
      `<div class="unit">${esc(c.unit)}</div><div class="term">${esc(c.term)}</div>` +
      `<div class="lbl">뜻</div><div class="txt">${esc(c.definition)}</div>` +
      `<div class="lbl">핵심</div><div class="txt">${esc(c.key_point)}</div>` +
      `<div class="lbl">헷갈리는 점</div><div class="txt">${esc(c.confusion)}</div></button>`;
  }
  html += `<div class="pager"><button type="button" data-action="c-prev"${cs.i === 0 ? " disabled" : ""}>이전</button>` +
    `<button type="button" class="primary" data-action="c-next">${cs.i === cs.list.length - 1 ? "마치기" : "다음"}</button></div>`;
  return html;
}

// app.js의 클릭 처리에서 불러요. 개념 카드 버튼이면 처리하고 true를 돌려줘요.
function conceptAction(action) {
  if (action === "c-flip") {
    cs.flipped = !cs.flipped;
    if (cs.flipped) markSeen(cs.list[cs.i].id);
  } else if (action === "c-next") {
    if (cs.i < cs.list.length - 1) { cs.i++; cs.flipped = false; savePos(cs.i); }
    else { cs.done = true; savePos(0); }
  } else if (action === "c-prev") {
    if (cs.i > 0) { cs.i--; cs.flipped = false; savePos(cs.i); }
  } else if (action === "c-restart") {
    cs.i = 0; cs.flipped = false; cs.done = false; savePos(0);
  } else if (action === "c-exit") {
    state.screen = "home";   // state는 app.js에 있어요
  } else {
    return false;
  }
  return true;
}
