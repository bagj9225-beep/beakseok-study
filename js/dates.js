// 날짜 담당: 오늘 날짜와 시험일 계산을 한 곳에서 해요.
// 기준: 한국(KST) 날짜, 시각은 버려요. 그래서 자정 근처나 기기 시간대 때문에 날짜가 어긋나지 않아요.

function dayNum(s) {                       // "2026-11-05" → 하루 단위 번호
  const p = s.split("-").map(Number);
  return Date.UTC(p[0], p[1] - 1, p[2]) / 86400000;
}
function addDays(s, n) { return new Date((dayNum(s) + n) * 86400000).toISOString().slice(0, 10); }
function daysBetween(a, b) { return dayNum(b) - dayNum(a); }   // a에서 b까지 며칠
function isDate(s) { return typeof s === "string" && /^\d{4}-\d{2}-\d{2}$/.test(s) && addDays(s, 0) === s; }

// 오늘 날짜(한국 기준). 개발용 도구에서 테스트 날짜를 켜 두면 그 날짜를 "오늘"로 써요.
function kstToday() {
  const dbg = Store.get("debugToday", null);
  if (isDate(dbg)) return dbg;
  return new Date(Date.now() + 9 * 3600 * 1000).toISOString().slice(0, 10);   // 한국은 UTC+9, 서머타임 없음
}

// 시험일 상태: has(정했는지), exam(시험일), d(시험까지 남은 일수)
function examState() {
  const exam = Store.get("exam", null);
  if (!isDate(exam)) return { has: false };
  return { has: true, exam: exam, d: daysBetween(kstToday(), exam) };
}

function ddayText(d) { return d > 0 ? "D-" + d : d === 0 ? "D-DAY" : "시험 끝"; }
function weekday(s) { return ["일", "월", "화", "수", "목", "금", "토"][new Date(dayNum(s) * 86400000).getUTCDay()]; }
function shortDate(s) { const p = s.split("-"); return Number(p[1]) + "/" + Number(p[2]) + "(" + weekday(s) + ")"; }
