// 데이터 담당: JSON 파일을 불러오고, 팀원 파일의 흔한 실수를 검사해요.
const Content = { concepts: [], ox: [], mcq: [], loaded: [], problems: [] };

async function loadContent() {
  for (const f of CONTENT_FILES) {
    try {
      const res = await fetch(f.path, { cache: "no-store" });
      if (!res.ok) throw new Error("HTTP " + res.status);
      const items = await res.json();
      if (!Array.isArray(items)) throw new Error("최상위가 목록([ ])이 아니에요");
      items.forEach(it => it._file = f.path);
      const bucket = f.type === "concept" ? Content.concepts : f.type === "ox" ? Content.ox : Content.mcq;
      bucket.push(...items);
      Content.loaded.push({ ...f, count: items.length });
    } catch (e) {
      Content.problems.push(`[${f.path}] 불러오기 실패: ${e.message}`);
    }
  }
  validateContent();
}

function validateContent() {
  const P = Content.problems;
  const all = [
    ...Content.concepts.map(x => ["concept", x]),
    ...Content.ox.map(x => ["ox", x]),
    ...Content.mcq.map(x => ["mcq", x]),
  ];
  const seen = {};
  const conceptIds = new Set(Content.concepts.map(c => c.id));
  for (const [type, it] of all) {
    const where = `[${it._file}] ${it.id || "(id 없음)"}`;
    for (const k of REQUIRED_FIELDS[type]) {
      if (!(k in it) || it[k] === "" || it[k] === null) P.push(`${where}: \x27${k}\x27 값이 비었거나 없어요`);
    }
    if (it.id) {
      if (seen[it.id]) P.push(`${where}: id가 중복돼요 (${seen[it.id]} 와 겹침)`);
      seen[it.id] = it._file;
    }
    if (it.subject && !SUBJECTS.includes(it.subject)) P.push(`${where}: subject가 경제/정치가 아니에요 (${it.subject})`);
    if (type === "ox") {
      if (typeof it.answer !== "boolean") P.push(`${where}: answer는 true/false여야 해요`);
      if (it.concept_id && !conceptIds.has(it.concept_id)) P.push(`${where}: 없는 개념 id를 가리켜요 (${it.concept_id})`);
    }
    if (type === "mcq") {
      if (!Array.isArray(it.choices) || it.choices.length !== 5) P.push(`${where}: choices가 5개가 아니에요`);
      else if (!Number.isInteger(it.answer_index) || it.answer_index < 0 || it.answer_index > 4)
        P.push(`${where}: answer_index는 0~4여야 해요`);
      (it.concept_ids || []).forEach(cid => {
        if (!conceptIds.has(cid)) P.push(`${where}: 없는 개념 id를 가리켜요 (${cid})`);
      });
    }
  }
}
