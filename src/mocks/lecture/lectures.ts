import type { Track } from "../../types/lecture";

/**
 * 강의 트랙 · 소분류 분류 체계 목.
 *
 * **부원 화면(강좌 목록)이 계속 이 값을 쓴다.** 어드민 강의 목록(`GET /api/admin/lectures`)
 * 응답에도 같은 분류가 실려 오지만, 그건 어드민 전용 엔드포인트라 부원 화면이 그대로 재사용할
 * 수 없다 — 부원용 공개 분류 엔드포인트가 생기기 전까지는 이 목이 관리자·부원 화면의 트랙
 * 이름을 맞춰 주는 유일한 통로다.
 */
export const TRACKS: Track[] = [
  {
    id: 1,
    name: "SW",
    subCategories: [
      { id: 1, name: "WEB 기초" },
      { id: 2, name: "Express.js" },
      { id: 3, name: "React.js" },
    ],
  },
  // 소분류가 비어 있는 트랙이 있다. 화면이 이 경우를 견뎌야 한다.
  { id: 2, name: "창업 빌드업", subCategories: [] },
  { id: 3, name: "세미나", subCategories: [] },
];
