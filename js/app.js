// 앱 담당: 화면 전환, 자유 학습 탭, 클릭 처리. (11단계: 처음 실행 안내, 설정에서 과목 선택, 범위 선택 위치 변경)

const MODES = [
  { id: "concept", name: "개념 카드",    desc: "앞뒤로 넘기며 익혀요",  unit: "장" },
  { id: "ox",      name: "OX 퀴즈",      desc: "풀고 바로 해설을 봐요", unit: "문제" },
  { id: "mcq",     name: "심화 5지선다", desc: "11~14일차에 다뤄요",    unit: "문제" },
];

const state = {
  tab: "home",       // home(학습 홈) / free(자유 학습) / settings(설정)
  screen: "home",    // home(탭 화면) / onboard(처음 실행 안내) / concept / ox / flow (학습 중)
  sub: "learn",      // 자유 학습 안의 선택: learn(학습) / review(복습)
  subject: Store.get("subject", "경제"),   // 과목은 설정 탭에서 바꿔요
  mode: null,
  rangeMode: "all",  // all(전체 범위) / pick(범위 선택)
  units: [],         // 범위 선택일 때 고른 단원들
  note: "",
};
if (!SUBJECTS.includes(state.subject)) state.subject = SUBJECTS[0];

// 과목별 메인 색 적용 (색 값은 config.js의 SUBJECT_THEME)
function applyTheme(subject) {
  const t = SUBJECT_THEME[subject];
  if (!t) return;
  const root = document.documentElement.style;
  root.setProperty("--accent", t.accent);
  root.setProperty("--accent-soft", t.soft);
}

// 지금 조건(과목, 학습/복습)에 맞는 항목들. 복습은 이미 학습한 것만이에요.
function pool(modeId, subject, sub) {
  const seen = Store.get("seen.concept", {}), solved = Store.get("solved.ox", {});
  if (modeId === "concept") return Content.concepts.filter(x => x.subject === subject && (sub !== "review" || seen[x.id]));
  if (modeId === "ox") return Content.ox.filter(x => x.subject === subject && (sub !== "review" || solved[x.id]));
  return Content.mcq.filter(x => x.subject === subject);
}
// 범위 선택지: 단원 이름과 항목 수 (개념 카드 + OX)
function unitChoices(subject, sub) {
  const out = [];
  pool("concept", subject, sub).concat(pool("ox", subject, sub)).forEach(x => {
    let o = out.find(u => u.unit === x.unit);
    if (!o) { o = { unit: x.unit, n: 0 }; out.push(o); }
    o.n++;
  });
  return out;
}
function countFor(modeId) {
  let list = pool(modeId, state.subject, state.sub);
  if (state.rangeMode === "pick") list = list.filter(x => state.units.includes(x.unit));
  return list.length;
}

// 학습 방식 맨 위: 범위를 전체로 할지, 직접 고를지
function renderRangeBar() {
  let html = `<div class="seg sub2" style="margin-top:10px">` +
    [["all", "전체 범위"], ["pick", "범위 선택"]].map(([id, name]) =>
      `<button type="button" data-action="rangemode" data-value="${id}" class="${state.rangeMode === id ? "on" : ""}">${name}</button>`).join("") + `</div>`;
  if (state.rangeMode === "pick") {
    const list = unitChoices(state.subject, state.sub);
    html += list.length
      ? `<div class="range"><div class="chips">` + list.map(u =>
          `<button type="button" class="rchip${state.units.includes(u.unit) ? " on" : ""}" data-action="unit" data-value="${esc(u.unit)}">${esc(u.unit)}<span>${u.n}</span></button>`).join("") +
        `</div>` + (state.units.length ? "" : `<div class="rnone" style="margin-top:8px">범위를 골라 주세요.</div>`) + `</div>`
      : `<div class="range"><div class="rnone">아직 학습한 내용이 없어요.</div></div>`;
  }
  return html;
}

function renderFree() {
  const review = state.sub === "review";
  let html = `<h1>자유 학습 <span class="sbadge">${state.subject}</span></h1><h2>학습 방식</h2>` +
    `<div class="seg sub2">` + [["learn", "자유 학습"], ["review", "복습"]].map(([id, name]) =>
      `<button type="button" data-action="sub" data-value="${id}" class="${state.sub === id ? "on" : ""}">${name}</button>`).join("") + `</div>`;
  html += renderRangeBar() + `<div style="height:12px"></div>`;

  MODES.filter(md => !(review && md.id === "mcq")).forEach(md => {
    html += `<button type="button" data-action="mode" data-value="${md.id}" class="mode${md.id === state.mode ? " on" : ""}">` +
      `<span><div class="name">${md.name}</div><div class="desc">${md.desc}</div></span><span class="badge">${countFor(md.id)}${md.unit}</span></button>`;
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
  document.body.classList.toggle("studying", studying);   // 학습·안내 화면에서는 아래 탭을 숨겨요
  let html;
  if (state.screen === "onboard") html = renderOnboard();
  else if (state.screen === "concept") html = renderConcept();
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
  // 안내는 onboard.js, 개념 카드는 concept.js, OX·오답 복습은 ox.js, 학습 홈·설정은 roadmap.js, 이어서 학습은 flow.js가 처리
  if (onboardAction(action, value) || conceptAction(action) || oxAction(action, value) || roadmapAction(action, value) || flowAction(action, value)) {
    render(); window.scrollTo(0, 0); return;
  }

  if (action === "sub") {
    state.sub = value; state.mode = null; state.rangeMode = "all"; state.units = []; state.note = "";
  } else if (action === "rangemode") {
    state.rangeMode = value; state.units = []; state.note = "";
  } else if (action === "unit") {
    const i = state.units.indexOf(value);
    if (i >= 0) state.units.splice(i, 1); else state.units.push(value);
  } else if (action === "mode") {
    state.mode = value; state.note = "";
  } else if (action === "start") {
    const review = state.sub === "review";
    const units = state.rangeMode === "pick" ? state.units.slice() : null;
    if (state.mode === "concept") {
      startConcept(state.subject, units, review);
      if (cs.list.length) { state.screen = "concept"; state.note = ""; } else state.note = "학습할 카드가 없어요.";
    } else if (state.mode === "ox") {
      startOx(state.subject, units, review);
      if (os.list.length) { state.screen = "ox"; state.note = ""; } else state.note = "풀 문제가 없어요.";
    } else if (state.mode === "mcq") {
      state.note = "심화 문제 풀이는 아직 준비 중이에요.";
    }
  }
  render();
});

async function start() {
  await loadContent();
  applyTheme(state.subject);
  if (!getProfile().done) { startOnboard(); state.screen = "onboard"; }   // 처음 실행이면 안내부터
  render();
}
start();
