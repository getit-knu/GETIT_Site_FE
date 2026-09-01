/**
 * 사용자가 OS에서 "동작 줄이기"를 켰는지. JS로 구동하는 애니메이션(스크롤 등장·패럴랙스·
 * 마키 자동 흐름)은 CSS의 `prefers-reduced-motion` 미디어 쿼리가 못 막으므로 각자 이걸로
 * 분기한다. jsdom엔 `matchMedia`가 아예 없어서 함수 존재부터 확인한다(모킹 없이도 테스트가
 * "모션 없음" 경로로 통과하게).
 */
export function prefersReducedMotion(): boolean {
  return typeof window.matchMedia === "function" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}
