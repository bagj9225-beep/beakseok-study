// 학습 홈 담당: D-day, 오늘 목표 그래프, 동그라미 "이어서 학습" 버튼, 14일 일정 칸.
// 일정 계산은 plan.js, 오늘 목표는 progress.js, 학습 화면은 study.js가 맡아요.

const hs = { sel: null, pick: false };   // sel: 일정에서 눌러 본 일차, pick: 과목 선택창이 열렸는지

function renderHome() {
  const e = examState();
  const dbox = e.has
    ? `<div class="card dbox"><div class="dday">${ddayText(e.d)}</div><div class="dsub">시험일 ${shortDate(e.exam)}</div></div>`
    : `<div class="card dbox"><div class="dday">D-?</div><button type="button" class="small" data-tab="settings">시험일 정하기</button></div>`;
  return `<div class="top2">${dbox}${renderGoalMini()}</div>` + renderFlowButton() + renderDays();
}

// 과목별 다음 할 것 이름: "2일차", "오답 복습", "완료"
function flowLabel(q) { return !q.length ? "완료" : q[0].review ? "오답 복습" : (q[0].day + 1) + "일차"; }

function renderFlowButton() {
  const qs = SUBJECTS.map(s => ({ s: s, q: flowQueue(s) })), n = qs.reduce((a, x) => a + x.q.length, 0);
  const started = Object.values(LEARN_KEY).some(k => Object.keys(Store.get(k, {})).length > 0);
  const label = n === 0 ? "모두<br>완료" : started ? "이어서<br>학습" : "학습<br>시작";
  const cap = n === 0 ? "14일 일정을 모두 마쳤어요" : qs.map(x => x.s + " " + flowLabel(x.q)).join(" · ");
  return `<div class="circlewrap"><button type="button" class="circle" data-action="h-pick"${n === 0 ? " disabled" : ""}>${label}</button>` +
    `<div class="ccap">${cap}</div></div>` + (hs.pick ? renderPicker(qs) : "");
}

// 동그라미를 누르면 뜨는 과목 선택창
function renderPicker(qs) {
  return `<div class="sheet-bg" data-action="h-pick-close"></div><div class="sheet" role="dialog" aria-label="과목 선택">` +
    `<div class="sheet-title">어떤 과목을 할까요?</div><div class="tiles">` +
    qs.map(x => `<button type="button" class="tile" data-action="h-go" data-value="${x.s}"${x.q.length ? "" : " disabled"}>` +
      `<span class="tname">${x.s}</span><span class="tnum">${flowLabel(x.q)}${x.q.length ? " · " + x.q.length + "개" : ""}</span></button>`).join("") +
    `</div><div class="pager"><button type="button" data-action="h-pick-close">닫기</button></div></div>`;
}

// 한 과목의 이어서 학습 시작 (study.js의 "다른 과목도 할까요?"에서도 써요)
function startFlow(subject) {
  const q = flowQueue(subject);
  if (!q.length) return false;
  if (!isDate(Store.get("roadmapStart", null))) Store.set("roadmapStart", kstToday());   // 처음 누른 날 = 1일차 (기록용)
  startStudy(q, { flow: true, subject: subject, rebuild: () => flowQueue(subject) });
  return true;
}

// 14일 일정: 작은 칸 14개. 칸을 누르면 그날의 단원이 나와요. 테두리가 진한 칸이 지금 일차예요.
function renderDays() {
  const plans = allPlans(), now = currentDay(plans);
  let chips = "", detail = "";
  for (let i = 0; i < PLAN_DAYS; i++) {
    const p = dayProgress(i, plans);
    let cls = "dchip", st;
    if (p.total > 0 && p.done >= p.total) { cls += " done"; st = "완료"; }
    else if (p.done > 0) { cls += " part"; st = p.done + "/" + p.total; }
    else st = p.total ? "시작 전" : "복습일";
    if (i === now) cls += " today";
    if (hs.sel === i) cls += " sel";
    chips += `<button type="button" class="${cls}" data-action="h-day" data-value="${i}" aria-label="${i + 1}일차 ${st}">${i + 1}</button>`;
    if (hs.sel === i) {
      const units = SUBJECTS.filter(s => plans[s][i].length).map(s => s + ": " + plans[s][i].join(", ")).join("\n");
      const kind = i < LEARN_DAYS ? "새 학습" : "오답 복습 · 심화";
      detail = `<div class="card detail"><b>${i + 1}일차</b> · ${kind} · ${st}` +
        `<div class="dunits">${esc(units || "새로 배울 단원 없음")}</div></div>`;
    }
  }
  return `<h2>일정</h2><div class="dgrid">${chips}</div>${detail}`;
}

Object.assign(Actions, {
  "h-day"(value) { const i = Number(value); hs.sel = hs.sel === i ? null : i; return "stay"; },
  "h-pick"() { hs.pick = true; return "stay"; },
  "h-pick-close"() { hs.pick = false; return "stay"; },
  "h-go"(subject) { hs.pick = false; startFlow(subject); },
});
