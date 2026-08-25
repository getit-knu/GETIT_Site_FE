/**
 * 단과대학 · 전공 목록 타입. API 명세서 2.6 · 2.7.
 *
 * BE에 실제 공개 엔드포인트(`GET /api/public/colleges`, `GET /api/public/majors`)가 있다.
 * 지금은 mock만 쓰고, 실제 연동은 후속 이슈(API 연동)에서 진행한다.
 */
export interface College {
  id: number;
  name: string;
}

export interface Major {
  id: number;
  collegeId: number;
  name: string;
}
