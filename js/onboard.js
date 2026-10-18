// 처음 실행 안내 담당: 앱 소개 3장과 닉네임·시험일 입력.
// 입력한 정보는 이 기기의 브라우저에만 저장돼요. 설정 탭에서 다시 보거나 고칠 수 있어요.

const ob = { step: 0, name: "", exam: "", msg: "" };
const INTRO = [
  { title: "백석고 경제·정치", text: "기말고사까지 짧게 나눠서 끝내요." },
  { title: "동그라미 하나로", text: "홈의 동그라미를 누르면 오늘 할 것이 순서대로 나와요." },
  { title: "골라서도 OK", text: "자유 학습에서 개념 카드, OX, 심화, 오답을 골라요." },
];

function getProfile() { return Store.get("profile", null) || {}; }

function startOnboard() {
  const p = getProfile(), e = examState();
  ob.step = 0; ob.name = p.name || ""; ob.exam = e.has ? e.exam : ""; ob.msg = "";
}

function readObForm() {   // 입력칸에 적은 값을 기억해 둬요 (화면을 다시 그리면 입력칸이 비워지기 때문)
  const n = document.getElementById("ob-name"), x = document.getElementById("ob-exam");
  if (n) ob.name = n.value;
  if (x) ob.exam = x.value;
}

function renderOnboard() {
  const total = INTRO.length + 1;
  const dots = Array.from({ length: total }, (_, i) => `<i class="${i === ob.step ? "on" : ""}"></i>`).join("");
  let body, buttons;
  if (ob.step < INTRO.length) {
    const s = INTRO[ob.step];
    body = `<div class="ob-title">${s.title}</div><div class="ob-text">${s.text}</div>`;
    buttons = `<div class="pager"><button type="button" data-action="ob-skip">건너뛰기</button>` +
      `<button type="button" class="primary" data-action="ob-next">다음</button></div>`;
  } else {
    body = `<div class="ob-title">시작하기 전에</div>` +
      `<label class="flabel" for="ob-name">닉네임</label>` +
      `<input type="text" id="ob-name" class="field wide" maxlength="10" placeholder="10자까지" value="${esc(ob.name)}">` +
      `<label class="flabel" for="ob-exam">시험일 <span>(나중에 정해도 돼요)</span></label>` +
      `<input type="date" id="ob-exam" class="field wide" value="${esc(ob.exam)}">` +
      `<div class="memo">이 기기에만 저장돼요</div>` +
      (ob.msg ? `<div class="banner">${esc(ob.msg)}</div>` : "");
    buttons = `<div class="pager"><button type="button" data-action="ob-prev">이전</button>` +
      `<button type="button" class="primary" data-action="ob-start">시작하기</button></div>`;
  }
  return `<div class="ob">${body}<div class="dots">${dots}</div>${buttons}</div>`;
}

Object.assign(Actions, {
  "ob-next"() { ob.step = Math.min(ob.step + 1, INTRO.length); },
  "ob-skip"() { ob.step = INTRO.length; },
  "ob-prev"() { readObForm(); ob.step = Math.max(ob.step - 1, 0); ob.msg = ""; },
  "ob-start"() {
    readObForm();
    const name = ob.name.trim();
    if (!name) { ob.msg = "닉네임을 입력해 주세요."; return; }
    if (ob.exam && !isDate(ob.exam)) { ob.msg = "시험일 날짜를 다시 골라 주세요."; return; }
    Store.set("profile", { name: name, done: true });
    if (ob.exam) Store.set("exam", ob.exam);
    state.screen = "tab"; state.tab = "home";
  },
});
