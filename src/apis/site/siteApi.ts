import * as mock from "../../mocks/site/settings";
import * as staffMock from "../../mocks/site/staffs";
import type { FeatureToggle, SiteSavePayload, SiteSettings, Staff, StaffPayload, StaffSection } from "../../types/site";

/**
 * 사이트 설정 API. 명세서 10절.
 *
 * **아직 목 데이터를 돌려준다.** 연동 이슈에서 `mock.*` 만 `client.*` 로 바꾸면 된다.
 */

/**
 * 10.1 · 10.3 · 10.10 · 10.14 · 10.18 조회.
 *
 * 화면이 다섯 섹션을 모두 들고 있어야 10.20 으로 되돌려 보낼 수 있어 한 번에 받는다.
 * BE 연동 시 `Promise.all` 로 다섯을 병렬 호출한다.
 */
export const getSiteSettings = (): Promise<SiteSettings> => mock.fetchSiteSettings();

/** `POST /api/admin/setting/home/save` */
export const saveSiteSettings = (payload: SiteSavePayload): Promise<SiteSettings> => mock.saveSiteSettings(payload);

/**
 * 운영진 · 기능 토글 (10.21 ~ 10.24).
 *
 * **10.20 일괄 저장에 들어가지 않는다.** 개별 엔드포인트로 즉시 반영된다.
 */

/** `GET /api/admin/setting/staffs` */
export const getStaffs = (): Promise<Staff[]> => staffMock.fetchStaffs();

/** `POST /api/admin/setting/staffs` */
export const createStaff = (payload: StaffPayload): Promise<Staff> => staffMock.createStaff(payload);

/** `PUT /api/admin/setting/staffs/{id}` */
export const updateStaff = (id: number, payload: StaffPayload): Promise<Staff> => staffMock.updateStaff(id, payload);

/** `DELETE /api/admin/setting/staffs/{id}` */
export const deleteStaff = (id: number): Promise<void> => staffMock.deleteStaff(id);

/** `PUT /api/admin/setting/staffs/order` — 구역 안에서만 순서를 다시 매긴다. */
export const reorderStaffs = (section: StaffSection, orderedIds: number[]): Promise<void> =>
  staffMock.reorderStaffs(section, orderedIds);

/** `GET /api/admin/setting/features` */
export const getFeatures = (): Promise<FeatureToggle[]> => staffMock.fetchFeatures();

/** `PUT /api/admin/setting/features/{key}` */
export const toggleFeature = (key: string, enabled: boolean): Promise<FeatureToggle> =>
  staffMock.toggleFeature(key, enabled);
