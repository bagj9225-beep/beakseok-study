// 설정 파일: 콘텐츠 파일 목록은 여기 한 곳에서만 관리해요.
// 파일이 추가되거나 이름이 바뀌면 이 목록만 고치면 됩니다.
const CONTENT_FILES = [
  { path: "data/concepts_economy.json",  type: "concept", label: "경제 개념 카드" },
  { path: "data/concepts_politics.json", type: "concept", label: "정치 개념 카드" },
  { path: "data/ox_quiz.json",           type: "ox",      label: "OX 퀴즈" },
  { path: "data/advanced_mcq.json",      type: "mcq",     label: "심화 5지선다" },
];

// 유형별 필수 필드 (팀원에게 전달한 형식 기준)
const REQUIRED_FIELDS = {
  concept: ["id", "subject", "unit", "term", "front", "definition", "key_point", "confusion", "source_note"],
  ox:      ["id", "subject", "unit", "concept_id", "question", "answer", "explanation", "difficulty"],
  mcq:     ["id", "subject", "unit", "concept_ids", "question", "choices", "answer_index", "explanation", "difficulty", "solution_steps"],
};

const SUBJECTS = ["경제", "정치"];

// 하루 학습 목표 (하루에 새로 학습할 개수). 팀에서 정한 값을 여기에만 적어 주세요.
// 2주 완성, 3주 완성처럼 계획이 달라지면 이 숫자도 달라질 수 있어요. (지금 값은 임시예요)
const DAILY_GOAL = { concept: 10, ox: 20 };

// 과목별 메인 색. 지금은 두 과목이 같은 색이에요.
// 나중에 과목마다 다르게 하려면 여기 색 값(accent: 진한 색, soft: 연한 색)만 바꾸면 돼요.
const SUBJECT_THEME = {
  "경제": { accent: "#2F6F8F", soft: "#E3EFF5" },
  "정치": { accent: "#2F6F8F", soft: "#E3EFF5" },
};
