// 화면 공용 도구: 버튼 동작 목록(Actions), 글자 안전하게 넣기(esc), 짧은 알림(toast).
//
// 버튼 이름표 규칙
// - 버튼에 data-action="이름" (필요하면 data-value="값")을 붙이면, 클릭할 때 Actions["이름"](값)이 실행돼요.
// - 입력칸에 data-change="이름"을 붙이면, 값이 바뀔 때 Actions["이름"](값)이 실행돼요.
// - 이름 앞글자로 담당 파일을 구분해요: s- 학습 화면(study.js), h- 학습 홈(home.js), fr- 자유 학습(free.js),
//   set- 설정(settings.js), dev- 개발용 도구(settings.js), ob- 처음 실행 안내(onboard.js)
// - 동작이 "stay"를 돌려주면 화면을 다시 그린 뒤에도 스크롤 위치를 그대로 둬요. (기본은 맨 위로)
const Actions = {};

function esc(s) {
  return String(s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "\"": "&quot;", "'": "&#39;" }[c]));
}

let toastTimer = null;
function toast(msg) {
  const el = document.getElementById("toast");
  if (!el) return;
  el.textContent = msg;
  el.classList.add("on");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove("on"), 1800);
}
