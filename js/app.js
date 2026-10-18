// 앱 담당: 화면 상태(state), 화면 그리기, 클릭·입력 연결, 시작.
// 각 화면의 내용과 버튼 동작은 담당 파일에 있어요. (버튼 이름표 규칙은 ui.js 맨 위 설명)

const state = {
  tab: "home",       // 아래 탭: home(학습 홈) / free(자유 학습) / settings(설정)
  screen: "tab",     // tab(탭 화면) / onboard(처음 실행 안내) / study(학습 중)
  sub: "learn",      // 자유 학습: learn(학습) / review(복습)
  subject: Store.get("subject", SUBJECTS[0]),   // 자유 학습 과목 (설정 탭에서 바꿔요)
  units: [],         // 자유 학습 범위: 고른 단원들 (비어 있으면 전체)
  rangeOpen: false,  // 자유 학습 범위 목록이 펼쳐졌는지
  devOpen: false, devDay: 1,   // 개발용 도구
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

function render() {
  const inTab = state.screen === "tab";
  document.body.classList.toggle("studying", !inTab);   // 학습·안내 화면에서는 아래 탭을 숨겨요
  let html;
  if (state.screen === "onboard") html = renderOnboard();
  else if (state.screen === "study") html = renderStudy();
  else if (state.tab === "home") html = renderHome();
  else if (state.tab === "free") html = renderFree();
  else html = renderSettings();
  document.getElementById("view").innerHTML = html;
  document.querySelectorAll("#tabbar .tab").forEach(b => {
    const on = b.dataset.tab === state.tab;
    b.classList.toggle("on", on);
    if (on) b.setAttribute("aria-current", "page"); else b.removeAttribute("aria-current");
  });
}

// 동작을 실행하고 화면을 다시 그려요. 동작의 결과에 따라 스크롤을 정해요. (ui.js 설명 참고)
function run(name, value) {
  const fn = Actions[name];
  if (!fn) return;
  const r = fn(value);
  render();
  if (r === "result") {
    const el = document.querySelector("#view .result");
    if (el) el.scrollIntoView({ behavior: "smooth", block: "nearest" });
  } else if (r !== "stay") window.scrollTo(0, 0);
}

document.addEventListener("click", e => {
  const tab = e.target.closest("[data-tab]");
  if (tab) {
    state.tab = tab.dataset.tab; state.screen = "tab";
    render(); window.scrollTo(0, 0);
    return;
  }
  const btn = e.target.closest("[data-action]");
  if (!btn || btn.disabled) return;
  if (btn.tagName === "SUMMARY") e.preventDefault();   // 접기/펼치기는 state로 관리해요
  run(btn.dataset.action, btn.dataset.value);
});
document.addEventListener("change", e => {
  const el = e.target.closest("[data-change]");
  if (el) run(el.dataset.change, el.value);
});
document.addEventListener("keydown", e => {   // 입력칸에서 Enter를 누르면 저장되도록 입력칸을 빠져나가요
  if (e.key === "Enter" && e.target.matches("input[data-change]")) e.target.blur();
});

async function start() {
  await loadContent();
  applyTheme(state.subject);
  if (!getProfile().done) { startOnboard(); state.screen = "onboard"; }   // 처음 실행이면 안내부터
  render();
}
start();
