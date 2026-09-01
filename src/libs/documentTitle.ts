/** 탭·방문 기록·북마크에 남는 이름. 정식 표기는 띄어쓰기가 있는 "GET IT" 이다. */
export const SITE_NAME = "GET IT";

/**
 * 홈만 사이트 이름을 먼저 둔다.
 *
 * 홈은 "어느 페이지"가 아니라 "어느 사이트"냐가 알고 싶은 자리고, 검색 결과·북마크에서
 * 이 한 줄이 사이트를 대표한다. 그래서 설명을 뒤에 붙여 준다.
 */
export const HOME_TITLE = `${SITE_NAME} · 경북대학교 컴퓨터학부 SW&창업 동아리`;

/**
 * `<페이지> · GET IT` 로 맞춘다.
 *
 * **구체적인 쪽을 앞에 둔다.** 브라우저 탭은 폭이 좁아 오른쪽부터 잘리므로, 사이트 이름을
 * 앞에 두면 탭 열 개가 전부 "GET IT…" 이 되어 지금과 달라지는 게 없다.
 *
 * `area` 는 같은 이름의 화면이 영역마다 있을 때만 준다 — 부원 대시보드와 어드민 대시보드가
 * 둘 다 "대시보드" 다.
 */
export function formatTitle(page: string, area?: string): string {
  return [page, area, SITE_NAME].filter((part) => part !== undefined).join(" · ");
}
