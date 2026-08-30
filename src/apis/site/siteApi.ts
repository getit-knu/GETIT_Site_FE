import { client } from "../client";
import * as mock from "../../mocks/site/settings";
import type {
  Curriculum,
  CurriculumPayload,
  Faq,
  FaqPayload,
  FeatureToggle,
  FeatureTogglePayload,
  Generation,
  GenerationPayload,
  SiteEvent,
  SiteEventPayload,
  SiteSavePayload,
  SiteSettings,
  SiteTrack,
  Staff,
  StaffPayload,
  StaffSection,
} from "../../types/site";

/**
 * 사이트 설정 API.
 *
 * 진행 기수 · 운영진 · 행사 · 커리큘럼 · 강의 분류 · FAQ · 기능 토글은 실제 `client` 호출이다.
 * 모집 일정만 아직 실제 엔드포인트가 없어 `mock.*` 를 그대로 쓴다.
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

/** 모집 일정 조회. */
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

/** `GET /api/admin/setting/tracks` — 10.3. 대분류 트리(소분류 포함)를 통째로 준다. */
export async function getTracks(): Promise<SiteTrack[]> {
  const { data } = await client.get<SiteTrack[]>("/api/admin/setting/tracks");
  return data;
}

interface TrackDraftInput {
  id: number | null;
  name: string;
  subCategories: { id: number | null; name: string }[];
}

/**
 * 강의 분류 저장. 명세서 10.4 ~ 10.9 개별 CRUD만 있고 일괄 저장 엔드포인트는 없다 —
 * 최신 트리를 다시 조회해 비교하고, 삭제 → 수정 → 생성 순으로 나눠 보낸다
 * (`recruitmentApi.saveCriteria`와 같은 접근).
 *
 * **대분류를 지우면 그 아래 소분류도 서버가 cascade로 같이 지운다** — 따로 지울 필요 없다.
 * **강의가 연결된 분류는 서버가 `CATEGORY_IN_USE`로 막는다**(화면은 에러만 보여준다).
 */
export async function saveTracks(drafts: TrackDraftInput[]): Promise<void> {
  const current = await getTracks();
  const currentTracks = new Map(current.map((track) => [track.id, track]));
  const draftTrackIds = new Set(drafts.flatMap((draft) => (draft.id !== null ? [draft.id] : [])));

  for (const track of current.filter((track) => !draftTrackIds.has(track.id))) {
    await client.delete(`/api/admin/setting/tracks/${track.id}`);
  }

  for (const draft of drafts) {
    if (draft.id === null) continue;
    const existing = currentTracks.get(draft.id);
    if (existing === undefined) continue;

    if (existing.name !== draft.name) {
      await client.put(`/api/admin/setting/tracks/${draft.id}`, { name: draft.name });
    }

    const existingSubs = new Map(existing.subCategories.map((sub) => [sub.id, sub]));
    const draftSubIds = new Set(draft.subCategories.flatMap((sub) => (sub.id !== null ? [sub.id] : [])));

    for (const sub of existing.subCategories.filter((sub) => !draftSubIds.has(sub.id))) {
      await client.delete(`/api/admin/setting/subcategories/${sub.id}`);
    }

    for (const sub of draft.subCategories) {
      if (sub.id === null) continue;
      const existingSub = existingSubs.get(sub.id);
      if (existingSub !== undefined && existingSub.name !== sub.name) {
        await client.put(`/api/admin/setting/subcategories/${sub.id}`, { name: sub.name });
      }
    }

    for (const sub of draft.subCategories) {
      if (sub.id !== null) continue;
      await client.post("/api/admin/setting/subcategories", { trackId: draft.id, name: sub.name });
    }
  }

  for (const draft of drafts) {
    if (draft.id !== null) continue;

    const { data } = await client.post<{ id: number }>("/api/admin/setting/tracks", { name: draft.name });
    for (const sub of draft.subCategories) {
      await client.post("/api/admin/setting/subcategories", { trackId: data.id, name: sub.name });
    }
  }
}

/** `GET /api/admin/setting/faqs` — 10.18. */
export async function getFaqs(): Promise<Faq[]> {
  const { data } = await client.get<Faq[]>("/api/admin/setting/faqs");
  return data;
}

/** `POST /api/admin/setting/faqs` — 10.19. */
export async function createFaq(payload: FaqPayload): Promise<Faq> {
  const { data } = await client.post<Faq>("/api/admin/setting/faqs", payload);
  return data;
}

/** `PUT /api/admin/setting/faqs/{id}` — 10.19. */
export async function updateFaq(id: number, payload: FaqPayload): Promise<Faq> {
  const { data } = await client.put<Faq>(`/api/admin/setting/faqs/${id}`, payload);
  return data;
}

/** `DELETE /api/admin/setting/faqs/{id}` — 10.19. */
export async function deleteFaq(id: number): Promise<void> {
  await client.delete(`/api/admin/setting/faqs/${id}`);
}

/** `GET /api/admin/setting/features` — 10.23. */
export async function getFeatures(): Promise<FeatureToggle[]> {
  const { data } = await client.get<FeatureToggle[]>("/api/admin/setting/features");
  return data;
}

/** `PUT /api/admin/setting/features/{key}` — 10.24. */
export async function toggleFeature(key: FeatureToggle["key"], enabled: boolean): Promise<FeatureToggle> {
  const payload: FeatureTogglePayload = { enabled };
  const { data } = await client.put<FeatureToggle>(`/api/admin/setting/features/${key}`, payload);
  return data;
}
