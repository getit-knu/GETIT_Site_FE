import { client } from "../client";
import * as mock from "../../mocks/site/settings";
import * as staffMock from "../../mocks/site/staffs";
import type {
  Curriculum,
  CurriculumPayload,
  FeatureToggle,
  Generation,
  GenerationPayload,
  SiteEvent,
  SiteEventPayload,
  SiteSavePayload,
  SiteSettings,
  Staff,
  StaffPayload,
  StaffSection,
} from "../../types/site";

/**
 * 사이트 설정 API.
 *
 * 진행 기수 · 운영진 · 행사 · 커리큘럼은 실제 `client` 호출이다. 모집 일정 · 강의 분류 ·
 * FAQ · 기능 토글은 아직 실제 엔드포인트가 없어 `mock.*`/`staffMock.*` 를 그대로 쓴다.
 */

/** `GET /api/admin/setting/generation` */
export async function getGeneration(): Promise<Generation> {
  const { data } = await client.get<Generation>("/api/admin/setting/generation");
  return data;
}

/** `PUT /api/admin/setting/generation` */
export async function saveGeneration(payload: GenerationPayload): Promise<Generation> {
  const { data } = await client.put<Generation>("/api/admin/setting/generation", payload);
  return data;
}

/** 모집 일정 · 강의 분류 · FAQ 조회. */
export const getSiteSettings = (): Promise<SiteSettings> => mock.fetchSiteSettings();

export const saveSiteSettings = (payload: SiteSavePayload): Promise<SiteSettings> => mock.saveSiteSettings(payload);

/** `GET /api/admin/setting/staffs` */
export async function getStaffs(): Promise<Staff[]> {
  const { data } = await client.get<Staff[]>("/api/admin/setting/staffs");
  return data;
}

/** `POST /api/admin/setting/staffs` */
export async function createStaff(payload: StaffPayload): Promise<Staff> {
  const { data } = await client.post<Staff>("/api/admin/setting/staffs", payload);
  return data;
}

/** `PUT /api/admin/setting/staffs/{id}` */
export async function updateStaff(id: number, payload: StaffPayload): Promise<Staff> {
  const { data } = await client.put<Staff>(`/api/admin/setting/staffs/${id}`, payload);
  return data;
}

/** `DELETE /api/admin/setting/staffs/{id}` */
export async function deleteStaff(id: number): Promise<void> {
  await client.delete(`/api/admin/setting/staffs/${id}`);
}

/** `PUT /api/admin/setting/staffs/order` — 구역 안에서만 순서를 다시 매긴다. */
export async function reorderStaffs(section: StaffSection, orderedIds: number[]): Promise<void> {
  await client.put("/api/admin/setting/staffs/order", { section, orderedIds });
}

/** `GET /api/admin/setting/curriculums` */
export async function getCurriculums(): Promise<Curriculum[]> {
  const { data } = await client.get<Curriculum[]>("/api/admin/setting/curriculums");
  return data;
}

/** `POST /api/admin/setting/curriculums` */
export async function createCurriculum(payload: CurriculumPayload): Promise<Curriculum> {
  const { data } = await client.post<Curriculum>("/api/admin/setting/curriculums", payload);
  return data;
}

/** `PUT /api/admin/setting/curriculums/{id}` */
export async function updateCurriculum(id: number, payload: CurriculumPayload): Promise<Curriculum> {
  const { data } = await client.put<Curriculum>(`/api/admin/setting/curriculums/${id}`, payload);
  return data;
}

/** `DELETE /api/admin/setting/curriculums/{id}` */
export async function deleteCurriculum(id: number): Promise<void> {
  await client.delete(`/api/admin/setting/curriculums/${id}`);
}

/** `GET /api/admin/setting/events` */
export async function getEvents(): Promise<SiteEvent[]> {
  const { data } = await client.get<SiteEvent[]>("/api/admin/setting/events");
  return data;
}

/** `POST /api/admin/setting/events` */
export async function createEvent(payload: SiteEventPayload): Promise<SiteEvent> {
  const { data } = await client.post<SiteEvent>("/api/admin/setting/events", payload);
  return data;
}

/** `PUT /api/admin/setting/events/{id}` */
export async function updateEvent(id: number, payload: SiteEventPayload): Promise<SiteEvent> {
  const { data } = await client.put<SiteEvent>(`/api/admin/setting/events/${id}`, payload);
  return data;
}

/** `DELETE /api/admin/setting/events/{id}` */
export async function deleteEvent(id: number): Promise<void> {
  await client.delete(`/api/admin/setting/events/${id}`);
}

/** `GET /api/admin/setting/features` — 아직 실제 엔드포인트가 없다. */
export const getFeatures = (): Promise<FeatureToggle[]> => staffMock.fetchFeatures();

/** `PUT /api/admin/setting/features/{key}` — 아직 실제 엔드포인트가 없다. */
export const toggleFeature = (key: string, enabled: boolean): Promise<FeatureToggle> =>
  staffMock.toggleFeature(key, enabled);
