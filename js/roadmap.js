// 로드맵 담당: 시험일 입력, 14일 학습 일정, 날짜별 학습 시작. (6단계)
// 14일은 "학습에 필요한 기간"이라 시험일에 맞춰 자르지 않아요. 시작한 날이 1일차예요.
// 다음 날 학습은 미리 할 수 있고, 그 이후 날짜는 아직 잠겨 있어요.

const rs = { open: null, editExam: false, msg: "" };
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

// 홈 화면 맨 위의 D-day 한 줄
function homeExamLine() {
  const e = examState();
  if (!e.has) return `<div class="card dline">시험일을 아직 정하지 않았어요. 로드맵 탭에서 정해 보세요.</div>`;
  const day = roadmapDay();
  let st = day === 0 ? "14일 로드맵 시작 전" : day > PLAN_DAYS ? "14일 일정 완료" : "로드맵 " + day + "일차";
  return `<div class="card dline"><b>${ddayText(e.d)}</b> · ${st}</div>`;
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

  if (!e.has) return html + `<p class="sub">시험일을 알려 주면 남은 일수와 학습 일정을 보여줄게요.</p>` + examForm(e) + progressSections();

  html += `<div class="card"><div class="dday">${ddayText(e.d)}</div>` +
    `<div class="sub" style="margin:4px 0 0">시험일 ${shortDate(e.exam)} · 오늘 ${shortDate(kstToday())}</div>` +
    `<div style="margin-top:8px">${phaseText(e.d)}</div>` +
    `<div class="pager"><button type="button" data-action="r-edit-exam">시험일 바꾸기</button></div></div>`;
  if (rs.editExam) html += examForm(e);
  html += progressSections();   // 오늘의 목표·전체 진도·목표 설정 (progress.js)

  const start = Store.get("roadmapStart", null);
  if (!isDate(start)) {
    html += `<div class="card"><h2 style="margin-top:0">14일 학습 로드맵</h2>` +
      `<div class="sub">시작한 날이 1일차예요. 1~10일차에는 단원별로 새로 배우고, 11~14일차에는 총복습과 심화 문제를 다뤄요. 하루에 여러 일차를 이어서 해도 괜찮아요.` +
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
    ? `<div class="sub">14일 일정이 끝났어요. 위의 동그라미 버튼으로 남은 학습을 이어갈 수 있어요.</div>`
    : `<div class="sub">오늘은 ${todayDay}일차예요. 동그라미 버튼을 누르면 일정 순서대로 이어서 학습하고, 하루에 여러 일차를 해도 괜찮아요.</div>`;

  for (let i = 0; i < PLAN_DAYS; i++) {
    const date = addDays(start, i);
    const dayNo = i + 1;
    const afterExam = date > e.exam;
    let tags = "";
    if (dayNo === todayDay) tags += `<span class="tag2 now">오늘</span>`;
    if (date === e.exam) tags += `<span class="tag2 warn2">시험일</span>`;
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
      `<span class="dn">${dayNo}일차</span><span class="dd">${shortDate(date)}</span><span class="tags">${tags}</span>` +
      `<div class="dunits">${esc(units)}</div></div>`;
  }
  html += `<div class="pager"><button type="button" data-action="r-restart">오늘부터 일정 다시 시작</button></div>`;
  return html;
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
  } else if (action === "r-debug-set") {
    const v = document.getElementById("dbg-input").value;
    if (isDate(v)) Store.set("debugToday", v); else rs.msg = "테스트 날짜를 골라 주세요.";
  } else if (action === "r-debug-clear") { Store.set("debugToday", null);
  } else if (action === "r-save-goals") {
    const c = Number(document.getElementById("goal-concept").value), q = Number(document.getElementById("goal-ox").value);
    const ok = n => Number.isInteger(n) && n >= 1 && n <= 200;
    if (ok(c) && ok(q)) Store.set("goals", { concept: c, ox: q }); else rs.msg = "목표는 1~200 사이 정수로 입력해 주세요.";
  } else { return false; }
  return true;
}
