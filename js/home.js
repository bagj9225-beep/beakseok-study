// 학습 홈 담당: D-day, 오늘 목표 그래프, 동그라미 "이어서 학습" 버튼, 14일 일정 칸.
// 일정 계산은 plan.js, 오늘 목표는 progress.js, 학습 화면은 study.js가 맡아요.

const hs = { sel: null };   // 일정에서 눌러 본 일차 (없으면 null)

function renderHome() {
  const e = examState();
  const dbox = e.has
    ? `<div class="card dbox"><div class="dday">${ddayText(e.d)}</div><div class="dsub">시험일 ${shortDate(e.exam)}</div></div>`
    : `<div class="card dbox"><div class="dday">D-?</div><button type="button" class="small" data-tab="settings">시험일 정하기</button></div>`;
  return `<div class="top2">${dbox}${renderGoalMini()}</div>` + renderFlowButton() + renderDays();
}

function renderFlowButton() {
  const q = flowQueue(), n = q.length;
  const started = Object.values(LEARN_KEY).some(k => Object.keys(Store.get(k, {})).length > 0);
  const label = n === 0 ? "모두<br>완료" : started ? "이어서<br>학습" : "학습<br>시작";
  const cap = n === 0 ? "14일 일정을 모두 마쳤어요" : "남은 " + n + "개 · " + (q[0].review ? "오답 복습" : (q[0].day + 1) + "일차");
  return `<div class="circlewrap"><button type="button" class="circle" data-action="h-flow"${n === 0 ? " disabled" : ""}>${label}</button>` +
    `<div class="ccap">${cap}</div></div>`;
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
  "h-flow"() {
    const q = flowQueue();
    if (!q.length) return;
    if (!isDate(Store.get("roadmapStart", null))) Store.set("roadmapStart", kstToday());   // 처음 누른 날 = 1일차 (기록용)
    startStudy(q, { flow: true, rebuild: flowQueue });
  },
});
