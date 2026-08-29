import type { components } from "../../apis/generated";

/**
 * 단과대학 · 전공 목록 타입. API 명세서 2.6 · 2.7.
 *
 * `apis/generated.ts`(BE OpenAPI 스펙)에서 재노출한다.
 */
export type College = Required<components["schemas"]["CollegeResult"]>;
export type Major = Required<components["schemas"]["MajorResult"]>;
