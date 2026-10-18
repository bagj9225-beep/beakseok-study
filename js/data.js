// 데이터 담당: JSON 파일을 불러오고, 팀원 파일의 흔한 실수를 검사해요.
// 불러온 항목은 Content.concepts / ox / mcq 에 담기고, Content.byId[id]로 바로 찾을 수 있어요.
const Content = { concepts: [], ox: [], mcq: [], byId: {}, loaded: [], problems: [] };
const TYPE_LIST = { concept: "concepts", ox: "ox", mcq: "mcq" };   // 유형 → Content 안의 목록 이름

async function loadContent() {
  for (const f of CONTENT_FILES) {
    try {
      const res = await fetch(f.path, { cache: "no-store" });
      if (!res.ok) throw new Error("HTTP " + res.status);
      const items = await res.json();
      if (!Array.isArray(items)) throw new Error("최상위가 목록([ ])이 아니에요");
      items.forEach(it => { it._file = f.path; it._type = f.type; });
      Content[TYPE_LIST[f.type]].push(...items);
      Content.loaded.push({ ...f, count: items.length });
    } catch (e) {
      Content.problems.push(`[${f.path}] 불러오기 실패: ${e.message}`);
    }
  }
  validateContent();
  [...Content.concepts, ...Content.ox, ...Content.mcq].forEach(it => { if (it.id) Content.byId[it.id] = it; });
}

// 한 과목에서 쓰는 단원 목록 (콘텐츠에 나온 순서대로). types를 주면 그 유형에서만 찾아요.
function unitsOf(subject, types) {
  const out = [];
  (types || ["concept", "ox", "mcq"]).forEach(t => Content[TYPE_LIST[t]].forEach(x => {
    if (x.subject === subject && !out.includes(x.unit)) out.push(x.unit);
  }));
  return out;
}

function validateContent() {
  const P = Content.problems;
  const all = [...Content.concepts, ...Content.ox, ...Content.mcq];
  const seen = {};
  const conceptIds = new Set(Content.concepts.map(c => c.id));
  for (const it of all) {
    const type = it._type, where = `[${it._file}] ${it.id || "(id 없음)"}`;
    for (const k of REQUIRED_FIELDS[type]) {
      if (!(k in it) || it[k] === "" || it[k] === null) P.push(`${where}: '${k}' 값이 비었거나 없어요`);
    }
    if (it.id) {
      if (seen[it.id]) P.push(`${where}: id가 중복돼요 (${seen[it.id]} 와 겹침)`);
      seen[it.id] = it._file;
    }
    if (it.subject && !SUBJECTS.includes(it.subject)) P.push(`${where}: subject가 ${SUBJECTS.join("/")}가 아니에요 (${it.subject})`);
    if (type === "ox") {
      if (typeof it.answer !== "boolean") P.push(`${where}: answer는 true/false여야 해요`);
      if (it.concept_id && !conceptIds.has(it.concept_id)) P.push(`${where}: 없는 개념 id를 가리켜요 (${it.concept_id})`);
    }
    if (type === "mcq") {
      if (!Array.isArray(it.choices) || it.choices.length !== 5) P.push(`${where}: choices가 5개가 아니에요`);
      else if (!Number.isInteger(it.answer_index) || it.answer_index < 0 || it.answer_index > 4)
        P.push(`${where}: answer_index는 0~4여야 해요`);
      if (it.solution_steps && !Array.isArray(it.solution_steps)) P.push(`${where}: solution_steps는 목록([ ])이어야 해요`);
      (Array.isArray(it.concept_ids) ? it.concept_ids : []).forEach(cid => {
        if (!conceptIds.has(cid)) P.push(`${where}: 없는 개념 id를 가리켜요 (${cid})`);
      });
    }
  }
}
