import * as mock from "../../mocks/site/settings";
import type { SiteSavePayload, SiteSettings } from "../../types/site";

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
