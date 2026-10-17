// 앱 담당: 화면 전환과 홈 화면을 그려요. (3단계: 개념 카드 학습 연결)

// 학습 모드 목록. 심화 문제는 6단계에서 시험일 계산과 연결하기 전까지 잠가 둬요.
const MODES = [
  { id: "concept", name: "개념 카드",    desc: "앞뒤로 넘기며 익혀요",   unit: "장" },
  { id: "ox",      name: "OX 퀴즈",      desc: "풀고 바로 해설을 봐요",  unit: "문제" },
  { id: "mcq",     name: "심화 5지선다", desc: "시험 4일 전부터 열려요", unit: "문제", locked: true },
];

const state = {
  tab: "home",
  screen: "home",   // home(탭 화면) 또는 concept(개념 카드 학습 중)
  subject: Store.get("subject", "경제"),
  mode: null,
  note: "",
};
if (!SUBJECTS.includes(state.subject)) state.subject = SUBJECTS[0];

function countOf(modeId, subject) {
  const list = modeId === "concept" ? Content.concepts : modeId === "ox" ? Content.ox : Content.mcq;
  return list.filter(x => x.subject === subject).length;
}

function renderHome() {
  const m = MODES.find(x => x.id === state.mode);
  const canStart = m && !m.locked && countOf(m.id, state.subject) > 0;

  let html = `<h1>학습 홈</h1><p class="sub">과목과 학습 방식을 고르세요.</p>`;
  if (Content.problems.length) {
    html += `<div class="banner">콘텐츠 파일에 확인할 문제가 ${Content.problems.length}건 있어요.</div>`;
  }

  html += `<h2>과목</h2><div class="seg">` +
    SUBJECTS.map(s => `<button type="button" data-action="subject" data-value="${s}" class="${s === state.subject ? "on" : ""}">${s}</button>`).join("") +
    `</div><h2>학습 방식</h2>`;

  html += MODES.map(md => {
    const n = countOf(md.id, state.subject);
    const cls = "mode" + (md.id === state.mode ? " on" : "") + (md.locked ? " locked" : "");
    const badge = md.locked ? "잠김" : `${n}${md.unit}`;
    return `<button type="button" data-action="mode" data-value="${md.id}" class="${cls}"` +
      `${md.locked ? " aria-disabled=\"true\"" : ""}>` +
      `<span><div class="name">${md.name}</div><div class="desc">${md.desc}</div></span>` +
      `<span class="badge">${badge}</span></button>`;
  }).join("");

  html += `<button type="button" class="start" data-action="start"${canStart ? "" : " disabled"}>시작하기</button>`;
  if (state.note) html += `<div class="note">${state.note}</div>`;
  return html;
}

function renderRoadmap() {
  return `<h1>학습 로드맵</h1><p class="sub">시험일과 날짜별 목표를 보여줄 화면이에요.</p>` +
    `<div class="card">6단계에서 만들어요.</div>`;
}

function render() {
  const studying = state.screen === "concept";
  document.body.classList.toggle("studying", studying);   // 학습 중에는 아래 탭을 숨겨요
  document.getElementById("view").innerHTML = studying ? renderConcept()
    : (state.tab === "home" ? renderHome() : renderRoadmap());
  document.querySelectorAll("#tabbar .tab").forEach(b => b.classList.toggle("on", b.dataset.tab === state.tab));
}

// 클릭 처리: 버튼에 적힌 data-action 값을 보고 할 일을 정해요.
document.addEventListener("click", e => {
  const tab = e.target.closest("[data-tab]");
  if (tab) { state.tab = tab.dataset.tab; state.note = ""; render(); return; }

  const btn = e.target.closest("[data-action]");
  if (!btn || btn.disabled) return;
  const { action, value } = btn.dataset;
  if (conceptAction(action)) { render(); window.scrollTo(0, 0); return; }   // 개념 카드 버튼은 concept.js가 처리

  if (action === "subject") {
    state.subject = value; state.note = "";
    Store.set("subject", value);
  } else if (action === "mode") {
    const md = MODES.find(x => x.id === value);
    if (md.locked) { state.note = "심화 문제는 시험 4일 전부터 열려요."; state.mode = null; }
    else { state.mode = value; state.note = ""; }
  } else if (action === "start") {
    if (state.mode === "concept") { startConcept(state.subject); state.screen = "concept"; state.note = ""; }
    else state.note = "OX 퀴즈는 4단계에서 연결돼요.";
  }
  render();
});

async function start() {
  await loadContent();
  render();
}
start();
