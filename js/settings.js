// 설정 담당: 닉네임, 과목, 시험일, 앱 소개 다시 보기, 개발용 도구.
// 입력칸은 값을 바꾸면 바로 저장돼요. (저장 버튼 없음)

function renderSettings() {
  const e = examState(), p = getProfile();   // getProfile은 onboard.js에 있어요
  let html = `<h1>설정</h1><div class="list">` +
    `<label class="row"><span>닉네임</span><input type="text" class="field" maxlength="10" value="${esc(p.name || "")}" data-change="set-name" enterkeyhint="done"></label>` +
    `<div class="row"><span>과목</span><div class="seg mini">` +
    SUBJECTS.map(s => `<button type="button" data-action="set-subject" data-value="${s}" class="${s === state.subject ? "on" : ""}">${s}</button>`).join("") +
    `</div></div>` +
    `<label class="row"><span>시험일</span><input type="date" class="field" value="${e.has ? e.exam : ""}" data-change="set-exam"></label>` +
    `<button type="button" class="row link" data-action="set-intro"><span>앱 소개 다시 보기</span><span class="go">›</span></button>` +
    `</div>`;
  return html + renderDev();
}

/* ---------- 개발용 도구 (공개 전에 이 부분과 dev- 동작을 지워요) ---------- */
function renderDev() {
  const dbg = Store.get("debugToday", null);
  const P = Content.problems;
  return `<details class="dev"${state.devOpen ? " open" : ""}><summary data-action="dev-toggle">개발용 도구</summary>` +
    `<div class="card"><b>콘텐츠 검사</b> · ` + Content.loaded.map(f => `${esc(f.label)} ${f.count}`).join(", ") +
    (P.length ? `<ul class="problems">${P.slice(0, 50).map(x => `<li>${esc(x)}</li>`).join("")}</ul>` +
      (P.length > 50 ? `<div class="empty">외 ${P.length - 50}건</div>` : "") : `<div class="memo">문제 없음</div>`) + `</div>` +
    `<div class="card"><b>일정 테스트</b>` +
    `<input type="number" id="dev-day" class="field wide" min="1" max="${PLAN_DAYS}" value="${state.devDay}" data-change="dev-day">` +
    `<div class="pager"><button type="button" data-action="dev-fill">이 일차 전까지 완료로</button></div>` +
    `<div class="pager"><button type="button" data-action="dev-clear-day">이 일차 기록 지우기</button>` +
    `<button type="button" data-action="dev-clear-all">전체 기록 지우기</button></div></div>` +
    `<div class="card"><b>날짜 테스트</b>${isDate(dbg) ? ` <span class="warn">${dbg} 사용 중</span>` : ""}` +
    `<input type="date" id="dbg-input" class="field wide" value="${isDate(dbg) ? dbg : kstToday()}">` +
    `<div class="pager"><button type="button" data-action="dev-date-set">이 날짜로</button>` +
    `<button type="button" data-action="dev-date-clear">실제 날짜로</button></div></div></details>`;
}

// 일차 항목들의 학습 기록과 오답을 지우거나(clear), 완료로 표시해요(fill, 어제 날짜로 적어서 오늘 목표에는 안 들어가요).
function devMarkDay(i, fill) {
  const maps = {}, wrong = getWrong(), yesterday = addDays(kstToday(), -1);
  Object.keys(LEARN_KEY).forEach(t => { maps[t] = learnedMap(t); });
  dayItems(i).forEach(it => {
    if (fill) { if (!maps[it.type][it.id]) maps[it.type][it.id] = yesterday; }
    else { delete maps[it.type][it.id]; delete wrong[it.id]; }
  });
  Object.keys(LEARN_KEY).forEach(t => Store.set(LEARN_KEY[t], maps[t]));
  Store.set("wrong", wrong);
}

Object.assign(Actions, {
  "set-name"(value) {
    const name = value.trim();
    if (!name) { toast("닉네임을 입력해 주세요"); return; }
    Store.set("profile", Object.assign({}, getProfile(), { name: name, done: true }));
    toast("저장했어요");
    return "stay";
  },
  "set-subject"(value) {
    state.subject = value; state.units = [];
    Store.set("subject", value); applyTheme(value);   // applyTheme은 app.js에 있어요
    return "stay";
  },
  "set-exam"(value) {
    if (!value) { Store.set("exam", null); toast("시험일을 지웠어요"); return "stay"; }
    if (!isDate(value)) { toast("날짜를 다시 골라 주세요"); return; }
    Store.set("exam", value); toast("저장했어요");
    return "stay";
  },
  "set-intro"() { startOnboard(); state.screen = "onboard"; },

  "dev-toggle"() { state.devOpen = !state.devOpen; return "stay"; },
  "dev-day"(value) { const n = Number(value); if (Number.isInteger(n) && n >= 1 && n <= PLAN_DAYS) state.devDay = n; return "stay"; },
  "dev-fill"() { for (let i = 0; i < state.devDay - 1; i++) devMarkDay(i, true); toast((state.devDay - 1) + "일차까지 완료로 표시했어요"); return "stay"; },
  "dev-clear-day"() { devMarkDay(state.devDay - 1, false); toast(state.devDay + "일차 기록을 지웠어요"); return "stay"; },
  "dev-clear-all"() {
    if (!window.confirm("모든 학습 기록(학습 완료, 오답, 복습 횟수)을 지울까요? 닉네임과 시험일은 그대로예요.")) return "stay";
    Object.values(LEARN_KEY).forEach(k => Store.set(k, {}));
    Store.set("wrong", {}); Store.set("review", {}); Store.set("roadmapStart", null);
    SUBJECTS.forEach(s => Store.set("pos.concept." + s, 0));
    toast("모든 학습 기록을 지웠어요");
    return "stay";
  },
  "dev-date-set"() {
    const v = document.getElementById("dbg-input").value;
    if (isDate(v)) { Store.set("debugToday", v); toast(v + "로 테스트해요"); } else toast("날짜를 골라 주세요");
    return "stay";
  },
  "dev-date-clear"() { Store.set("debugToday", null); toast("실제 날짜로 돌아왔어요"); return "stay"; },
});
