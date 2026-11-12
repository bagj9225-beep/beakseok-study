// 캐릭터 꾸미기 탭 담당: 캐릭터를 크게 보여 주고, 소품 칸을 보여 줘요.
// 소품은 아직 없어요. 나중에 소품을 넣으면 고른 소품을 저장하는 키를 새로 만들어요.

const CLOSET_SLOTS = 4;   // 소품 칸 개수 (지금은 빈 칸)

function renderCloset() {
  const slots = Array.from({ length: CLOSET_SLOTS }, () => `<div class="slot" aria-hidden="true"></div>`).join("");
  return `<h1>꾸미기</h1>` +
    `<div class="card stage"><img class="char char-closet" src="img/char-plain.png" alt="내 캐릭터"></div>` +
    `<h2>소품</h2><div class="slots">${slots}</div><div class="memo">곧 추가돼요</div>`;
}
