// 로드맵 담당: 시험일 입력, 14일 학습 일정, 날짜별 학습 시작. (6단계)
// 14일은 "학습에 필요한 기간"이라 시험일에 맞춰 자르지 않아요. 시작한 날이 1일차예요.
// 다음 날 학습은 미리 할 수 있고, 그 이후 날짜는 아직 잠겨 있어요.

const rs = { open: null, editExam: false, msg: "" };
const PLAN_DAYS = 14;      // 전체 일정
const LEARN_DAYS = 10;     // 1~10일차: 새 단원 학습, 11~14일차: 총복습·심화

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

// 홈 화면 맨 위의 D-day 한 줄
function homeExamLine() {
  const e = examState();
  if (!e.has) return `<div class="card dline">시험일을 아직 정하지 않았어요. 로드맵 탭에서 정해 보세요.</div>`;
  return `<div class="card dline"><b>${ddayText(e.d)}</b> · ${phaseText(e.d)}</div>`;
}

function examForm(e) {
  return `<div class="card"><h2 style="margin-top:0">${e.has ? "시험일 바꾸기" : "시험일을 정해 주세요"}</h2>` +
    `<div class="sub">시험일을 바꾸면 남은 일수와 심화 문제 열리는 날을 다시 계산해요. 학습 기록은 그대로 남고, 14일 일정은 새로 시작해요.</div>` +
    `<input type="date" id="exam-input" class="dateinput" value="${e.has ? e.exam : ""}">` +
    `<div class="pager"><button type="button" class="primary" data-action="r-save-exam">저장</button>` +
    (e.has ? `<button type="button" data-action="r-cancel-exam">취소</button>` : "") + `</div></div>`;
}

function renderRoadmap() {
  const e = examState();
  let html = `<h1>학습 로드맵</h1>`;
  if (rs.msg) html += `<div class="banner">${esc(rs.msg)}</div>`;

  if (!e.has) return html + `<p class="sub">시험일을 알려 주면 남은 일수와 학습 일정을 보여줄게요.</p>` + examForm(e);

  html += `<div class="card"><div class="dday">${ddayText(e.d)}</div>` +
    `<div class="sub" style="margin:4px 0 0">시험일 ${shortDate(e.exam)} · 오늘 ${shortDate(kstToday())}</div>` +
    `<div style="margin-top:8px">${phaseText(e.d)}</div>` +
    `<div class="pager"><button type="button" data-action="r-edit-exam">시험일 바꾸기</button></div></div>`;
  if (rs.editExam) html += examForm(e);

  const start = Store.get("roadmapStart", null);
  if (!isDate(start)) {
    html += `<div class="card"><h2 style="margin-top:0">14일 학습 로드맵</h2>` +
      `<div class="sub">시작한 날이 1일차예요. 1~10일차에는 단원별로 새로 배우고, 11~14일차에는 총복습을 해요.` +
      (e.d >= 0 && e.d <= 14 ? " 지금이 시작하기 좋은 때예요." : "") + `</div>` +
      (e.d >= 0 ? `<button type="button" class="start" data-action="r-start">오늘부터 시작하기</button>` : "") + `</div>`;
  } else {
    html += renderDays(e, start);
  }
  return html + renderDebug();
}

function renderDays(e, start) {
  const today = kstToday();
  const todayDay = daysBetween(start, today) + 1;       // 오늘이 몇 일차인지
  const plans = {};
  SUBJECTS.forEach(s => { plans[s] = planFor(s); });

  let html = `<h2>일정</h2>`;
  html += todayDay > PLAN_DAYS
    ? `<div class="sub">14일 일정이 끝났어요. 지난 일차는 언제든 다시 학습할 수 있어요.</div>`
    : `<div class="sub">오늘은 ${todayDay}일차예요. 내일 학습은 미리 할 수 있어요.</div>`;

  for (let i = 0; i < PLAN_DAYS; i++) {
    const date = addDays(start, i);
    const dayNo = i + 1;
    const locked = dayNo > todayDay + 1;                 // 내일(todayDay+1)까지만 열려요
    const afterExam = date > e.exam;
    let tags = "";
    if (dayNo === todayDay) tags += `<span class="tag2 now">오늘</span>`;
    else if (dayNo === todayDay + 1) tags += `<span class="tag2">내일 · 미리 학습</span>`;
    if (date === e.exam) tags += `<span class="tag2 warn2">시험일</span>`;
    else if (afterExam) tags += `<span class="tag2">시험 이후</span>`;
    if (locked) tags += `<span class="tag2">잠김</span>`;
    else if (i < LEARN_DAYS) {
      const p = dayProgress(plans, i);
      tags += p.total === 0 ? `<span class="tag2">복습일</span>`
        : p.done >= p.total ? `<span class="tag2 okk">완료</span>`
        : p.done > 0 ? `<span class="tag2">진행 중 ${p.done}/${p.total}</span>` : `<span class="tag2">시작 전</span>`;
    } else tags += `<span class="tag2">총복습</span>`;

    html += `<button type="button" class="day${dayNo === todayDay ? " today" : ""}${afterExam ? " dim" : ""}" data-action="r-day" data-value="${i}"${locked ? " disabled" : ""}>` +
      `<span class="dn">${dayNo}일차</span><span class="dd">${shortDate(date)}</span><span class="tags">${tags}</span></button>`;
    if (rs.open === i && !locked) html += renderDayDetail(plans, i);
  }
  html += `<div class="pager"><button type="button" data-action="r-restart">오늘부터 일정 다시 시작</button></div>`;
  return html;
}

function renderDayDetail(plans, i) {
  let html = `<div class="card detail">`;
  if (i < LEARN_DAYS) {
    let any = false;
    SUBJECTS.forEach(s => {
      const u = plans[s][i];
      if (!u.length) return;
      any = true;
      const nc = itemsIn(Content.concepts, s, u).length, nq = itemsIn(Content.ox, s, u).length;
      html += `<div class="subj"><b>${s}</b> · ${esc(u.join(", "))}</div><div class="pager">` +
        `<button type="button" data-action="r-study" data-value="concept|${s}|${i}"${nc ? "" : " disabled"}>개념 카드 ${nc}장</button>` +
        `<button type="button" data-action="r-study" data-value="ox|${s}|${i}"${nq ? "" : " disabled"}>OX ${nq}문제</button></div>`;
    });
    if (!any) html += `<div class="txt">이 날은 새로 배울 단원이 없어요. 오답 복습이나 자유 학습을 해 보세요.</div>`;
  } else {
    html += `<div class="txt">총복습 기간이에요. 틀린 문제를 다시 풀어 보세요.</div><div class="pager">` +
      SUBJECTS.map(s => { const n = wrongCount(s);
        return `<button type="button" data-action="r-review" data-value="${s}"${n ? "" : " disabled"}>${s} 오답 ${n}문제</button>`; }).join("") +
      `</div><div class="txt" style="margin-top:8px">심화 문제: ${advancedOpen() ? "열려 있어요 (풀이 화면은 9단계에서 연결돼요)" : esc(lockedNote())}</div>`;
  }
  return html + `</div>`;
}

function renderDebug() {
  const dbg = Store.get("debugToday", null);
  return `<h2>테스트 도구</h2><div class="card"><div class="sub">날짜를 바꿔서 D-14, D-4가 제대로 되는지 확인할 수 있어요.` +
    (isDate(dbg) ? ` <b class="warn">지금 테스트 날짜(${dbg})를 쓰는 중이에요.</b>` : "") + `</div>` +
    `<input type="date" id="dbg-input" class="dateinput" value="${isDate(dbg) ? dbg : kstToday()}">` +
    `<div class="pager"><button type="button" data-action="r-debug-set">이 날짜로 테스트</button>` +
    `<button type="button" data-action="r-debug-clear">실제 날짜로 되돌리기</button></div></div>`;
}

// app.js의 클릭 처리에서 불러요. 로드맵 버튼이면 처리하고 true를 돌려줘요.
function roadmapAction(action, value) {
  if (action.indexOf("r-") !== 0) return false;
  rs.msg = "";
  if (action === "r-save-exam") {
    const v = document.getElementById("exam-input").value;
    if (!isDate(v)) { rs.msg = "시험일 날짜를 골라 주세요."; return true; }
    Store.set("exam", v);
    Store.set("roadmapStart", null);        // 일정은 새로 시작 (학습 기록은 그대로)
    rs.editExam = false; rs.open = null;
  } else if (action === "r-edit-exam") { rs.editExam = true;
  } else if (action === "r-cancel-exam") { rs.editExam = false;
  } else if (action === "r-start") { Store.set("roadmapStart", kstToday()); rs.open = null;
  } else if (action === "r-restart") {
    if (window.confirm("오늘부터 14일 일정을 다시 시작할까요? 학습 기록은 그대로 남아요.")) { Store.set("roadmapStart", kstToday()); rs.open = null; }
  } else if (action === "r-day") { const i = Number(value); rs.open = rs.open === i ? null : i;
  } else if (action === "r-study") {
    const p = value.split("|"), kind = p[0], subject = p[1], units = planFor(subject)[Number(p[2])];
    if (kind === "concept") { startConcept(subject, units); if (!cs.list.length) { rs.msg = "이 날의 개념 카드가 없어요."; return true; } state.screen = "concept"; }
    else { startOx(subject, units); if (!os.list.length) { rs.msg = "이 날의 OX 문제가 없어요."; return true; } state.screen = "ox"; }
  } else if (action === "r-review") {
    startOxReview(value);
    if (!os.list.length) { rs.msg = "복습할 오답이 없어요."; return true; }
    state.screen = "ox";
  } else if (action === "r-debug-set") {
    const v = document.getElementById("dbg-input").value;
    if (isDate(v)) Store.set("debugToday", v); else rs.msg = "테스트 날짜를 골라 주세요.";
  } else if (action === "r-debug-clear") { Store.set("debugToday", null);
  } else { return false; }
  return true;
}
