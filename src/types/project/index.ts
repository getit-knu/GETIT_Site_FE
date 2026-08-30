import type { components } from "../../apis/generated";
import type { Page } from "../qna";

/**
 * 프로젝트 쇼케이스 공개 화면(#219). `GET /api/public/projects` — 명세서 2.4.
 *
 * `semester`는 필터 쿼리에 실어 보내는 원본 값(`2026-FALL`), `semesterLabel`은
 * 서버가 사람이 읽기 좋게 만들어 준 표시용 값(`2026 Fall`)이다 — 화면은 표시엔
 * `semesterLabel`, 필터엔 `semester`를 쓴다.
 *
 * `thumbnailUrl`은 썸네일을 등록하지 않은 프로젝트에서 실제로 `null`이 온다(BE
 * 소스로 확인함, springdoc이 이 nullable을 못 잡음) — 손으로 되돌린다.
 */
export type PublicProject = Omit<Required<components["schemas"]["ProjectShowcaseResultItem"]>, "thumbnailUrl"> & {
  thumbnailUrl: string | null;
};

/**
 * `GET /api/public/projects` 응답. `semesters`는 전체 프로젝트 기준 중복 없는 학기
 * 목록(현재 페이지에 없는 학기도 포함) — 필터 탭을 만드는 용도다.
 */
export interface PublicProjectBoard extends Page<PublicProject> {
  semesters: string[];
}

export interface PublicProjectListParams {
  semester?: string;
  page?: number;
  size?: number;
}

/**
 * 어드민 프로젝트 관리(#222). `GET/POST/PUT/DELETE /api/admin/projects`.
 *
 * `semester`는 자유 문자열이 아니라 `\d{4}-(SPRING|SUMMER|FALL|WINTER)` 패턴 고정값이다
 * (BE 확인함) — 화면은 연도 입력 + 계절 선택으로 만들어 이 문자열을 조립한다.
 */
export type AdminProject = Required<components["schemas"]["ProjectResultItem"]>;

/**
 * `POST`/`PUT /api/admin/projects` 요청 본문.
 *
 * `order`는 생성 시 생략하면 맨 뒤(최대값+1)에 붙고, 수정 시 생략하면 순서를 유지한다
 * (BE 소스로 확인함). **커리큘럼과 달리 값을 넣어도 다른 항목을 밀어내지 않고 그 값으로만
 * 덮어쓴다** — 순서가 겹쳐도 서버가 알아서 정리해 주지 않는다.
 *
 * **`fileId`는 생략하면 `null`이 되어 기존 썸네일이 지워진다**(BE `Project.update`가
 * 매번 통째로 덮어씀, `StaffPayload.fileId`와 같은 함정) — 손대지 않았어도 항상 현재
 * 값을 명시적으로 실어 보내야 한다. 스키마엔 optional이라 손으로 되돌린다.
 */
export type AdminProjectPayload = Omit<components["schemas"]["ProjectRequestWrite"], "fileId"> & {
  fileId: number | null;
};

/** `GET /api/admin/projects` 응답. `Required<>`는 배열 원소 내부까지 못 채우므로 직접 합성한다. */
export type AdminProjectBoard = Page<AdminProject>;

export interface AdminProjectListParams {
  semester?: string;
  page?: number;
  size?: number;
}
