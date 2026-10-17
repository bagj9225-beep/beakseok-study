// 앱 담당: 화면 전환, 자유 학습 탭, 클릭 처리. (10단계: 설정 탭, 간단한 홈, 복습·범위 선택)

const MODES = [
  { id: "concept", name: "개념 카드",    desc: "앞뒤로 넘기며 익혀요",  unit: "장" },
  { id: "ox",      name: "OX 퀴즈",      desc: "풀고 바로 해설을 봐요", unit: "문제" },
  { id: "mcq",     name: "심화 5지선다", desc: "11~14일차에 다뤄요",    unit: "문제" },
];

const state = {
  tab: "home",       // home(학습 홈) / free(자유 학습) / settings(설정)
  screen: "home",    // home(탭 화면) / concept / ox / flow (학습 중)
  sub: "learn",      // 자유 학습 안의 탭: learn(학습) / review(복습)
  subject: Store.get("subject", "경제"),
  mode: null,
  range: "all",      // 개념 카드 범위: all(전체) 또는 단원 이름
  note: "",
};
if (!SUBJECTS.includes(state.subject)) state.subject = SUBJECTS[0];

// 지금 조건(과목, 학습/복습)에 맞는 항목들. 복습은 이미 학습한 것만이에요.
function pool(modeId, subject, sub) {
  const seen = Store.get("seen.concept", {}), solved = Store.get("solved.ox", {});
  if (modeId === "concept") return Content.concepts.filter(x => x.subject === subject && (sub !== "review" || seen[x.id]));
  if (modeId === "ox") return Content.ox.filter(x => x.subject === subject && (sub !== "review" || solved[x.id]));
  return Content.mcq.filter(x => x.subject === subject);
}
// 개념 카드 범위 선택지: 단원 이름과 카드 수
function rangeUnits(subject, sub) {
  const out = [];
  pool("concept", subject, sub).forEach(c => {
    let o = out.find(x => x.unit === c.unit);
    if (!o) { o = { unit: c.unit, n: 0 }; out.push(o); }
    o.n++;
  });
  return out;
}
function countFor(modeId) {
  let list = pool(modeId, state.subject, state.sub);
  if (modeId === "concept" && state.range !== "all") list = list.filter(x => x.unit === state.range);
  return list.length;
}

function rangeChip(value, label, n) {
  return `<button type="button" class="rchip${state.range === value ? " on" : ""}" data-action="range" data-value="${esc(value)}">${esc(label)}<span>${n}</span></button>`;
}
// 개념 카드를 눌렀을 때 아래로 나오는 범위 선택창
function renderRange() {
  const list = rangeUnits(state.subject, state.sub);
  if (!list.length) return `<div class="range"><div class="rnone">아직 학습한 카드가 없어요.</div></div>`;
  const total = list.reduce((a, x) => a + x.n, 0);
  return `<div class="range"><div class="rtitle">범위</div><div class="chips">` +
    rangeChip("all", "전체 범위", total) + list.map(u => rangeChip(u.unit, u.unit, u.n)).join("") + `</div></div>`;
}

function renderFree() {
  const review = state.sub === "review";
  let html = `<h1>자유 학습</h1><div class="seg sub2">` +
    [["learn", "학습"], ["review", "복습"]].map(([id, name]) =>
      `<button type="button" data-action="sub" data-value="${id}" class="${state.sub === id ? "on" : ""}">${name}</button>`).join("") + `</div>`;
  html += `<div class="seg" style="margin-top:10px">` + SUBJECTS.map(s =>
    `<button type="button" data-action="subject" data-value="${s}" class="${s === state.subject ? "on" : ""}">${s}</button>`).join("") + `</div>`;
  html += `<h2>${review ? "지금까지 학습한 내용" : "학습 방식"}</h2>`;

  MODES.filter(md => !(review && md.id === "mcq")).forEach(md => {
    const n = pool(md.id, state.subject, state.sub).length;
    html += `<button type="button" data-action="mode" data-value="${md.id}" class="mode${md.id === state.mode ? " on" : ""}">` +
      `<span><div class="name">${md.name}</div><div class="desc">${md.desc}</div></span><span class="badge">${n}${md.unit}</span></button>`;
    if (md.id === "concept" && state.mode === "concept") html += renderRange();
  });

  const n = state.mode ? countFor(state.mode) : 0;
  html += `<button type="button" class="start" data-action="start"${n > 0 ? "" : " disabled"}>시작하기</button>`;
  if (review) {
    const wn = wrongCount(state.subject);   // 오답 개수 계산은 ox.js에 있어요
    html += `<button type="button" class="review" data-action="review"${wn ? "" : " disabled"}>` +
      `<span>오답 복습</span><span class="n">${wn}문제</span></button>`;
  }
  if (state.note) html += `<div class="note">${state.note}</div>`;
  return html;
}

function render() {
  const studying = state.screen !== "home";
  document.body.classList.toggle("studying", studying);   // 학습 중에는 아래 탭을 숨겨요
  let html;
  if (state.screen === "concept") html = renderConcept();
  else if (state.screen === "ox") html = renderOx();
  else if (state.screen === "flow") html = renderFlow();
  else if (state.tab === "home") html = renderHome();          // 학습 홈, 설정은 roadmap.js에 있어요
  else if (state.tab === "free") html = renderFree();
  else html = renderSettings();
  document.getElementById("view").innerHTML = html;
  document.querySelectorAll("#tabbar .tab").forEach(b => b.classList.toggle("on", b.dataset.tab === state.tab));
}

// 클릭 처리: 버튼에 적힌 data-action 값을 보고 할 일을 정해요.
document.addEventListener("click", e => {
  const tab = e.target.closest("[data-tab]");
  if (tab) { state.tab = tab.dataset.tab; state.note = ""; rs.msg = ""; render(); window.scrollTo(0, 0); return; }

  const btn = e.target.closest("[data-action]");
  if (!btn || btn.disabled) return;
  const { action, value } = btn.dataset;
  // 개념 카드는 concept.js, OX·오답 복습은 ox.js, 학습 홈·설정은 roadmap.js, 이어서 학습은 flow.js가 처리
  if (conceptAction(action) || oxAction(action, value) || roadmapAction(action, value) || flowAction(action, value)) {
    render(); window.scrollTo(0, 0); return;
  }

  if (action === "sub") {
    state.sub = value; state.mode = null; state.range = "all"; state.note = "";
  } else if (action === "subject") {
    state.subject = value; state.range = "all"; state.note = "";
    Store.set("subject", value);
  } else if (action === "mode") {
    if (state.mode !== value) { state.mode = value; state.range = "all"; }
    state.note = "";
  } else if (action === "range") {
    state.range = value;
  } else if (action === "start") {
    const review = state.sub === "review";
    if (state.mode === "concept") {
      startConcept(state.subject, state.range === "all" ? null : [state.range], review);
      if (cs.list.length) { state.screen = "concept"; state.note = ""; } else state.note = "학습할 카드가 없어요.";
    } else if (state.mode === "ox") {
      startOx(state.subject, null, review);
      if (os.list.length) { state.screen = "ox"; state.note = ""; } else state.note = "풀 문제가 없어요.";
    } else if (state.mode === "mcq") {
      state.note = "심화 문제 풀이는 아직 준비 중이에요.";
    }
  }
  render();
});

async function start() {
  await loadContent();
  render();
}
start();
