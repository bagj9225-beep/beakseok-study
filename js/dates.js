// 날짜 담당: 시험일 계산을 한 곳에서 해요. (6단계)
// 기준: 한국(KST) 날짜, 시각은 버려요. 그래서 자정 근처나 기기 시간대 때문에 날짜가 어긋나지 않아요.

function dayNum(s) {                       // "2026-11-05" → 하루 단위 번호
  const p = s.split("-").map(Number);
  return Date.UTC(p[0], p[1] - 1, p[2]) / 86400000;
}
function addDays(s, n) { return new Date((dayNum(s) + n) * 86400000).toISOString().slice(0, 10); }
function daysBetween(a, b) { return dayNum(b) - dayNum(a); }   // a에서 b까지 며칠
function isDate(s) { return typeof s === "string" && /^\d{4}-\d{2}-\d{2}$/.test(s) && addDays(s, 0) === s; }

// 오늘 날짜(한국 기준). 테스트용 날짜를 켜 두면 그 날짜를 "오늘"로 써요.
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

// 심화 문제는 시험일과 상관없이 14일 로드맵의 마지막 4일(11일차)부터 열려요.
const PLAN_DAYS = 14, ADVANCED_LAST_DAYS = 4;
const ADVANCED_FROM_DAY = PLAN_DAYS - ADVANCED_LAST_DAYS + 1;   // 11일차

// 로드맵 시작일 기준으로 오늘이 몇 일차인지 (시작 전이면 0)
function roadmapDay() {
  const s = Store.get("roadmapStart", null);
  return isDate(s) ? daysBetween(s, kstToday()) + 1 : 0;
}
function advancedOpen() { return roadmapDay() >= ADVANCED_FROM_DAY; }

function ddayText(d) { return d > 0 ? "D-" + d : d === 0 ? "D-DAY" : "시험 끝 (D+" + (-d) + ")"; }
function phaseText(d) { return d < 0 ? "시험이 끝났어요." : d === 0 ? "오늘이 시험일이에요." : "시험까지 " + d + "일 남았어요."; }
function lockedNote() {
  const day = roadmapDay();
  if (day === 0) return "심화 문제는 14일 로드맵의 마지막 " + ADVANCED_LAST_DAYS + "일(" + ADVANCED_FROM_DAY + "일차)부터 열려요. 로드맵 탭에서 시작해 보세요.";
  return "심화 문제는 " + ADVANCED_FROM_DAY + "일차부터 열려요. (" + (ADVANCED_FROM_DAY - day) + "일 뒤)";
}
