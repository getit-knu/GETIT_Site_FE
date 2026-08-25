import { describe, expect, it } from "vitest";

import type { MemberLecture } from "../../mocks/lecture/memberLectures";

import { ALL_LECTURES_FILTER, filterLectures } from "./lectureFilters";

const LECTURES: MemberLecture[] = [
  { id: 1, trackId: 1, subCategoryId: 1, week: 1, title: "A", durationMinutes: 60, deadline: "", completed: false },
  { id: 2, trackId: 1, subCategoryId: 2, week: 1, title: "B", durationMinutes: 60, deadline: "", completed: false },
  { id: 3, trackId: 2, subCategoryId: null, week: 1, title: "C", durationMinutes: 60, deadline: "", completed: false },
];

describe("filterLectures", () => {
  it("ALL이면 전체를 그대로 반환한다", () => {
    expect(filterLectures(LECTURES, ALL_LECTURES_FILTER)).toHaveLength(3);
  });

  it("소분류 키로 그 소분류의 강의만 골라낸다", () => {
    expect(filterLectures(LECTURES, "sub-2")).toEqual([LECTURES[1]]);
  });

  it("소분류 없는 트랙 키로 그 트랙의 강의만 골라낸다", () => {
    expect(filterLectures(LECTURES, "track-2")).toEqual([LECTURES[2]]);
  });
});
