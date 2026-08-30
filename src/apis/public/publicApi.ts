import type { PublicFaq } from "../../types/home";
import type { College, Major } from "../../types/college";
import type { RecruitmentStatus } from "../../types/recruitment";
import type { StaffDirectory } from "../../types/site";
import { client } from "../client";

/**
 * 공개 데이터 API. 명세서 2.3 · 2.5 · 2.6 · 2.7 · 2.8.
 *
 * 전부 로그인이 필요 없다 — `RequireRole` 밖(공개 라우트)에서도 호출된다.
 */

/** `GET /api/public/staffs` */
export async function getStaffs(): Promise<StaffDirectory> {
  const { data } = await client.get<StaffDirectory>("/api/public/staffs");
  return data;
}

/** `GET /api/public/colleges` */
export async function getColleges(): Promise<College[]> {
  const { data } = await client.get<College[]>("/api/public/colleges");
  return data;
}

/** `GET /api/public/majors` */
export async function getMajors(): Promise<Major[]> {
  const { data } = await client.get<Major[]>("/api/public/majors");
  return data;
}

/** `GET /api/public/recruitment/status` */
export async function getRecruitmentStatus(): Promise<RecruitmentStatus> {
  const { data } = await client.get<RecruitmentStatus>("/api/public/recruitment/status");
  return data;
}

/** `GET /api/public/faqs` — 2.5. 비공개 처리한 FAQ는 서버가 걸러서 안 준다. */
export async function getFaqs(): Promise<PublicFaq[]> {
  const { data } = await client.get<PublicFaq[]>("/api/public/faqs");
  return data;
}
