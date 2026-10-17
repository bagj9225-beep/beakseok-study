// 앱 담당: 화면을 그려요. (1단계에서는 불러오기 결과만 보여줘요)
function esc(s) { return String(s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "\"": "&quot;" }[c])); }

async function start() {
  await loadContent();
  const status = document.getElementById("status");
  const report = document.getElementById("report");

  const total = Content.concepts.length + Content.ox.length + Content.mcq.length;
  status.innerHTML = Content.problems.length === 0
    ? `<span class="ok">불러오기 성공</span> · 콘텐츠 ${total}개, 문제 없음`
    : `<span class="warn">확인이 필요해요</span> · 콘텐츠 ${total}개, 문제 ${Content.problems.length}건`;

  let html = "";
  for (const f of Content.loaded) {
    const first = (f.type === "concept" ? Content.concepts : f.type === "ox" ? Content.ox : Content.mcq)
      .find(x => x._file === f.path);
    const sample = first ? esc(first.term || first.question) : "-";
    html += `<div class="card"><h2>${esc(f.label)}</h2>${f.count}개 · 첫 항목: ${sample}</div>`;
  }
  if (Content.problems.length) {
    html += `<div class="card"><h2>문제 목록</h2><ul class="list">` +
      Content.problems.map(p => `<li>${esc(p)}</li>`).join("") + `</ul></div>`;
  }
  if (Content.loaded.length === 0) {
    html += `<div class="card warn">파일을 읽지 못했어요. index.html을 더블클릭해서 열었다면 README.txt의 실행 방법을 확인하세요.</div>`;
  }
  report.innerHTML = html;
}
start();
