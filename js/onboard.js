// 처음 실행 안내 담당: 앱 소개 3장과 닉네임·시험일 입력. (11단계)
// 입력한 정보는 이 기기의 브라우저에만 저장돼요. 설정 탭에서 다시 보거나 고칠 수 있어요.

const ob = { step: 0, name: "", exam: "", msg: "" };
const INTRO = [
  { title: "백석고 경제·정치 학습", text: "짧게 나눠서 기말고사까지 차근차근 끝내요." },
  { title: "동그라미 하나로 이어서", text: "홈의 동그라미를 누르면 오늘 할 개념 카드와 OX가 순서대로 나와요." },
  { title: "원하는 것만 골라서도", text: "자유 학습에서 개념 카드, OX, 복습을 직접 골라요." },
];

function getProfile() { return Store.get("profile", null) || {}; }

function startOnboard() {
  const p = getProfile(), e = examState();
  ob.step = 0; ob.name = p.name || ""; ob.exam = e.has ? e.exam : ""; ob.msg = "";
}

function readObForm() {   // 입력칸에 적은 값을 기억해 둬요 (화면을 다시 그리면 입력칸이 비워지기 때문)
  const n = document.getElementById("ob-name"), x = document.getElementById("ob-exam");
  if (n) ob.name = n.value; if (x) ob.exam = x.value;
}

function renderOnboard() {
  const total = INTRO.length + 1;
  const dots = Array.from({ length: total }, (_, i) => `<i class="${i === ob.step ? "on" : ""}"></i>`).join("");
  let body, buttons;
  if (ob.step < INTRO.length) {
    body = `<div class="ob-title">${INTRO[ob.step].title}</div><div class="ob-text">${INTRO[ob.step].text}</div>`;
    buttons = `<div class="pager"><button type="button" data-action="b-skip">건너뛰기</button>` +
      `<button type="button" class="primary" data-action="b-next">다음</button></div>`;
  } else {
    body = `<div class="ob-title">시작하기 전에</div>` +
      `<div class="grow"><span>닉네임</span></div>` +
      `<input type="text" id="ob-name" class="dateinput" maxlength="10" placeholder="10자까지" value="${esc(ob.name)}">` +
      `<div class="grow" style="margin-top:12px"><span>시험일 (나중에 설정에서 정해도 돼요)</span></div>` +
      `<input type="date" id="ob-exam" class="dateinput" value="${esc(ob.exam)}">` +
      `<div class="gsmall">입력한 정보는 이 기기에만 저장돼요.</div>` +
      (ob.msg ? `<div class="banner" style="margin-top:10px">${esc(ob.msg)}</div>` : "");
    buttons = `<div class="pager"><button type="button" data-action="b-prev">이전</button>` +
      `<button type="button" class="primary" data-action="b-start">시작하기</button></div>`;
  }
  return `<div class="ob">${body}<div class="dots">${dots}</div>${buttons}</div>`;
}

// app.js의 클릭 처리에서 불러요. 처음 실행 안내 버튼이면 처리하고 true를 돌려줘요.
function onboardAction(action, value) {
  if (action.indexOf("b-") !== 0) return false;
  if (action === "b-next") { ob.step = Math.min(ob.step + 1, INTRO.length);
  } else if (action === "b-skip") { ob.step = INTRO.length;
  } else if (action === "b-prev") { readObForm(); ob.step = Math.max(ob.step - 1, 0); ob.msg = "";
  } else if (action === "b-start") {
    readObForm();
    const name = ob.name.trim();
    if (!name) { ob.msg = "닉네임을 입력해 주세요."; return true; }
    if (ob.exam && !isDate(ob.exam)) { ob.msg = "시험일 날짜를 다시 골라 주세요."; return true; }
    Store.set("profile", { name: name, done: true });
    if (ob.exam) Store.set("exam", ob.exam);
    state.screen = "home";   // state는 app.js에 있어요
  } else { return false; }
  return true;
}
