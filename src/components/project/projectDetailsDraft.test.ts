import { describe, expect, it } from "vitest";

import { detailsInvalidReason, emptyDetailsDraft, toDetailsPayload } from "./projectDetailsDraft";

describe("projectDetailsDraft (#389)", () => {
  it("비운 칸은 null 로, 채운 칸은 앞뒤 공백을 걷어 보낸다 — BE @HttpUrl 은 빈 문자열을 거절한다", () => {
    expect(
      toDetailsPayload({ oneLiner: "  한 줄  ", progressStatus: "", playStoreUrl: " ", appStoreUrl: "https://a.b/c " }),
    ).toEqual({ oneLiner: "한 줄", progressStatus: null, playStoreUrl: null, appStoreUrl: "https://a.b/c" });
  });

  it("60자를 넘거나 http(s)가 아닌 스토어 링크면 이유를 준다. 다 비어 있으면 통과한다", () => {
    expect(detailsInvalidReason(emptyDetailsDraft())).toBeNull();
    expect(detailsInvalidReason({ ...emptyDetailsDraft(), oneLiner: "가".repeat(61) })).toContain("60자");
    expect(detailsInvalidReason({ ...emptyDetailsDraft(), playStoreUrl: "play.google.com" })).toContain("Google Play");
    expect(detailsInvalidReason({ ...emptyDetailsDraft(), appStoreUrl: "javascript:x" })).toContain("App Store");
  });
});
