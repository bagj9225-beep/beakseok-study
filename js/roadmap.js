// 학습 홈 담당: 시험일, 오늘의 목표, 이어서 학습 버튼, 14일 일정, 개발용 도구.
// 14일은 "학습에 필요한 기간"이라 시험일에 맞춰 자르지 않아요. 동그라미 버튼을 처음 누른 날이 1일차예요.

const rs = { editExam: false, msg: "" };
const LEARN_DAYS = PLAN_DAYS - ADVANCED_LAST_DAYS;   // 1~10일차: 새 단원 학습, 11~14일차: 총복습·심화 (PLAN_DAYS는 dates.js)

function weekday(s) { return ["일", "월", "화", "수", "목", "금", "토"][new Date(dayNum(s) * 86400000).getUTCDay()]; }
function shortDate(s) { const p = s.split("-"); return Number(p[1]) + "/" + Number(p[2]) + "(" + weekday(s) + ")"; }

// 과목의 단원 목록 (콘텐츠에 나온 순서대로)
function unitsOf(subject) {
  const out = [];
  Content.concepts.concat(Content.ox).forEach(x => { if (x.subject === subject && !out.includes(x.unit)) out.push(x.unit); });
  return out;
}
// 단원을 1~10일차에 나눠요. 단원이 10개 이상이면 고르게 묶고, 적으면 하루에 한 단원씩 배정해요.
function planFor(subject) {
  const units = unitsOf(subject), n = units.length;
  const days = Array.from({ length: LEARN_DAYS }, () => []);
  units.forEach((u, j) => { days[n >= LEARN_DAYS ? Math.floor(j * LEARN_DAYS / n) : j].push(u); });
  return days;
}
function itemsIn(list, subject, units) { return list.filter(x => x.subject === subject && units.includes(x.unit)); }

// 그날 학습 상태: 카드는 뒷면을 봤는지, OX는 풀었는지 기준
function dayProgress(plans, i) {
  const seen = Store.get("seen.concept", {}), solved = Store.get("solved.ox", {});
  let total = 0, done = 0;
  SUBJECTS.forEach(s => {
    const u = plans[s][i];
    itemsIn(Content.concepts, s, u).forEach(c => { total++; if (seen[c.id]) done++; });
    itemsIn(Content.ox, s, u).forEach(q => { total++; if (solved[q.id]) done++; });
  });
  return { total: total, done: done };
}

function examForm(e) {
  return `<div class="card"><h2 style="margin-top:0">${e.has ? "시험일 바꾸기" : "시험일을 정해 주세요"}</h2>` +
    `<div class="sub">시험일을 바꾸면 남은 일수를 다시 계산해요. 학습 기록과 일정은 그대로 남아요.</div>` +
    `<input type="date" id="exam-input" class="dateinput" value="${e.has ? e.exam : ""}">` +
    `<div class="pager"><button type="button" class="primary" data-action="r-save-exam">저장</button>` +
    (e.has ? `<button type="button" data-action="r-cancel-exam">취소</button>` : "") + `</div></div>`;
}

// 학습 홈 화면
function renderHome() {
  const e = examState();
  let html = `<h1>학습 홈</h1>`;
  if (Content.problems.length) html += `<div class="banner">콘텐츠 파일에 확인할 문제가 ${Content.problems.length}건 있어요.</div>`;
  if (rs.msg) html += `<div class="banner">${esc(rs.msg)}</div>`;

  if (!e.has) {
    html += `<p class="sub">시험일을 알려 주면 남은 일수를 보여줄게요.</p>` + examForm(e);
  } else {
    html += `<div class="card"><div class="dday">${ddayText(e.d)}</div>` +
      `<div class="sub" style="margin:4px 0 0">시험일 ${shortDate(e.exam)} · 오늘 ${shortDate(kstToday())}</div>` +
      `<div style="margin-top:8px">${phaseText(e.d)}</div>` +
      `<div class="pager"><button type="button" data-action="r-edit-exam">시험일 바꾸기</button></div></div>`;
    if (rs.editExam) html += examForm(e);
  }
  return html + renderGoalCard(false) + renderFlowButton() + renderDays(e) + renderDev();
}

function renderDays(e) {
  const today = kstToday();
  const start = Store.get("roadmapStart", null);
  const hasStart = isDate(start);
  const todayDay = hasStart ? daysBetween(start, today) + 1 : 0;   // 오늘이 몇 일차인지
  const plans = {};
  SUBJECTS.forEach(s => { plans[s] = planFor(s); });

  let html = `<h2>14일 일정</h2>`;
  html += !hasStart ? `<div class="sub">동그라미 버튼을 처음 누르면 그날이 1일차가 돼요.</div>`
    : todayDay > PLAN_DAYS ? `<div class="sub">14일 일정이 끝났어요. 동그라미 버튼으로 남은 학습을 이어갈 수 있어요.</div>`
    : `<div class="sub">오늘은 ${todayDay}일차예요. 하루에 여러 일차를 이어서 해도 괜찮아요.</div>`;

  for (let i = 0; i < PLAN_DAYS; i++) {
    const dayNo = i + 1;
    const date = hasStart ? addDays(start, i) : "";
    const afterExam = hasStart && e.has && date > e.exam;
    let tags = "";
    if (dayNo === todayDay) tags += `<span class="tag2 now">오늘</span>`;
    if (hasStart && e.has && date === e.exam) tags += `<span class="tag2 warn2">시험일</span>`;
    else if (afterExam) tags += `<span class="tag2">시험 이후</span>`;
    let units;
    if (i < LEARN_DAYS) {
      const p = dayProgress(plans, i);
      tags += p.total === 0 ? `<span class="tag2">복습일</span>`
        : p.done >= p.total ? `<span class="tag2 okk">완료</span>`
        : p.done > 0 ? `<span class="tag2">진행 중 ${p.done}/${p.total}</span>` : `<span class="tag2">시작 전</span>`;
      units = SUBJECTS.filter(s => plans[s][i].length).map(s => s + ": " + plans[s][i].join(", ")).join(" / ") || "새로 배울 단원 없음";
    } else {
      tags += `<span class="tag2">총복습·심화</span>`;
      units = "틀린 문제 복습과 심화 문제";
    }
    html += `<div class="day${dayNo === todayDay ? " today" : ""}${afterExam ? " dim" : ""}">` +
      `<span class="dn">${dayNo}일차</span><span class="dd">${date ? shortDate(date) : ""}</span><span class="tags">${tags}</span>` +
      `<div class="dunits">${esc(units)}</div></div>`;
  }
  return html;
}

// 개발 중에만 쓰는 도구 (앱이 완성되면 이 부분을 없애요)
function renderDev() {
  const dbg = Store.get("debugToday", null);
  const start = Store.get("roadmapStart", null);
  const cur = isDate(start) ? Math.min(Math.max(daysBetween(start, kstToday()) + 1, 1), PLAN_DAYS) : 1;
  return `<h2>개발용 도구</h2><div class="card"><div class="sub">개발 중에만 쓰는 도구예요. 앱이 완성되면 없앨 거예요.</div>` +
    `<div class="grow"><span>일차 (1~14)</span></div>` +
    `<input type="number" id="dev-day" class="dateinput" min="1" max="${PLAN_DAYS}" value="${cur}">` +
    `<div class="pager"><button type="button" data-action="r-dev-set-day">오늘을 이 일차로 맞추기</button></div>` +
    `<div class="pager"><button type="button" data-action="r-dev-clear-day">이 일차 학습 기록 지우기</button></div>` +
    `<div class="pager"><button type="button" data-action="r-dev-clear-all">전체 학습 기록 지우기</button></div>` +
    `<div class="sub" style="margin-top:14px">날짜 테스트 (D-day 확인용)` +
    (isDate(dbg) ? ` <b class="warn">지금 테스트 날짜(${dbg})를 쓰는 중이에요.</b>` : "") + `</div>` +
    `<input type="date" id="dbg-input" class="dateinput" value="${isDate(dbg) ? dbg : kstToday()}">` +
    `<div class="pager"><button type="button" data-action="r-debug-set">이 날짜로 테스트</button>` +
    `<button type="button" data-action="r-debug-clear">실제 날짜로 되돌리기</button></div></div>`;
}

// 한 일차의 학습 기록(학습 완료, 오답)을 지워요. 11~14일차는 총복습이라 오답 목록을 비워요.
function clearDayRecords(n) {
  if (n > LEARN_DAYS) { Store.set("wrong", {}); return; }
  const seen = Store.get("seen.concept", {}), solved = Store.get("solved.ox", {}), wrong = getWrong();   // getWrong은 ox.js
  SUBJECTS.forEach(s => {
    const u = planFor(s)[n - 1];
    itemsIn(Content.concepts, s, u).forEach(c => { delete seen[c.id]; });
    itemsIn(Content.ox, s, u).forEach(q => { delete solved[q.id]; delete wrong[q.id]; });
  });
  Store.set("seen.concept", seen); Store.set("solved.ox", solved); Store.set("wrong", wrong);
}

// app.js의 클릭 처리에서 불러요. 학습 홈 버튼이면 처리하고 true를 돌려줘요.
function roadmapAction(action, value) {
  if (action.indexOf("r-") !== 0) return false;
  rs.msg = "";
  const devDay = () => {
    const el = document.getElementById("dev-day"), n = el ? Number(el.value) : 0;
    return Number.isInteger(n) && n >= 1 && n <= PLAN_DAYS ? n : 0;
  };
  if (action === "r-save-exam") {
    const v = document.getElementById("exam-input").value;
    if (!isDate(v)) { rs.msg = "시험일 날짜를 골라 주세요."; return true; }
    Store.set("exam", v);
    rs.editExam = false;
  } else if (action === "r-edit-exam") { rs.editExam = true;
  } else if (action === "r-cancel-exam") { rs.editExam = false;
  } else if (action === "r-dev-set-day") {
    const n = devDay();
    if (!n) rs.msg = "일차는 1~14 사이 숫자로 입력해 주세요.";
    else { Store.set("roadmapStart", addDays(kstToday(), -(n - 1))); rs.msg = "오늘을 " + n + "일차로 맞췄어요."; }
  } else if (action === "r-dev-clear-day") {
    const n = devDay();
    if (!n) rs.msg = "일차는 1~14 사이 숫자로 입력해 주세요.";
    else { clearDayRecords(n); rs.msg = n + "일차 학습 기록을 지웠어요."; }
  } else if (action === "r-dev-clear-all") {
    if (window.confirm("모든 학습 기록(학습 완료, 오답, 복습 횟수)을 지울까요? 시험일과 일정은 그대로예요.")) {
      Store.set("seen.concept", {}); Store.set("solved.ox", {}); Store.set("wrong", {}); Store.set("review", {});
      SUBJECTS.forEach(s => Store.set("pos.concept." + s, 0));
      rs.msg = "모든 학습 기록을 지웠어요.";
    }
  } else if (action === "r-debug-set") {
    const v = document.getElementById("dbg-input").value;
    if (isDate(v)) Store.set("debugToday", v); else rs.msg = "테스트 날짜를 골라 주세요.";
  } else if (action === "r-debug-clear") { Store.set("debugToday", null);
  } else { return false; }
  return true;
}
