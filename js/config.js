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
