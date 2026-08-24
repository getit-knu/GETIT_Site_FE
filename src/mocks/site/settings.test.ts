import { describe, expect, it } from "vitest";

import { toDraft, toSchedule } from "../../pages/admin/site/scheduleDraft";

import { fetchSiteSettings } from "./settings";

/**
 * 목이지만 화면과 맞물리는 규칙을 담고 있다. BE 가 붙으면 이 파일과 함께 지운다.
 */
describe("fetchSiteSettings", () => {
  it("아무것도 고치지 않고 저장해도 일정이 그대로다", async () => {
    /*
      화면은 `datetime-local` 이라 초를 다루지 않는다. 목에 초가 들어 있으면
      열었다 저장하는 것만으로 마감이 앞당겨진다.
    */
    const { schedule } = await fetchSiteSettings();
    const roundTripped = toSchedule(toDraft(schedule));

    for (const key of Object.keys(schedule) as (keyof typeof schedule)[]) {
      expect(new Date(roundTripped[key]).getTime()).toBe(new Date(schedule[key]).getTime());
    }
  });

  it("일정에 오프셋이 붙어 있다", async () => {
    // 빼면 브라우저가 실행 환경의 시간대로 읽는다.
    const { schedule } = await fetchSiteSettings();

    for (const value of Object.values(schedule)) {
      expect(value).toMatch(/[+-]\d{2}:\d{2}$|Z$/);
    }
  });
});
