import type { components } from "../../apis/generated";
import type { Page } from "../qna";

/**
 * 프로젝트 쇼케이스 공개 화면 목 데이터 타입. 실제로는 `GET /api/public/projects`가
 * 있다(#219에서 연동 예정) — 그 전까지 정적/목업 콘텐츠에 쓴다.
 */
export type ProjectSemester = "2025 Fall" | "2025 Spring" | "2024 Fall";

export interface Project {
  id: string;
  team: string;
  semester: ProjectSemester;
  title: string;
  description: string;
  gradient: string;
  techStack: string[];
  codeUrl: string;
  demoUrl: string;
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
