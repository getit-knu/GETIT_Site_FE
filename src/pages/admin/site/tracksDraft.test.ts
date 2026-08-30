import { describe, expect, it } from "vitest";

import type { SiteTrack } from "../../../types/site";

import { emptySubCategory, emptyTrack, toTrackDrafts, toTracks, tracksInvalidReason } from "./tracksDraft";

const TRACKS: SiteTrack[] = [
  {
    id: 1,
    name: "SW",
    order: 1,
    subCategories: [
      { id: 1, name: "웹기초", order: 1, lectureCount: 0 },
      { id: 2, name: "React.js", order: 2, lectureCount: 0 },
    ],
  },
  // 소분류가 비어 있는 대분류가 있다. 화면이 이 경우를 견뎌야 한다.
  { id: 3, name: "세미나", order: 2, subCategories: [] },
];

describe("toTrackDrafts · toTracks", () => {
  it("손대지 않으면 id · 이름 · 소분류가 그대로 돌아온다", () => {
    // toTracks 는 저장용 입력이라 order · lectureCount 는 안 담는다.
    expect(toTracks(toTrackDrafts(TRACKS))).toEqual([
      {
        id: 1,
        name: "SW",
        subCategories: [
          { id: 1, name: "웹기초" },
          { id: 2, name: "React.js" },
        ],
      },
      { id: 3, name: "세미나", subCategories: [] },
    ]);
  });

  it("항목마다 서로 다른 화면 key 를 준다", () => {
    // id 를 key 로 쓰면 새로 만든 항목이 전부 null 이라 React 가 행을 헷갈린다.
    const drafts = toTrackDrafts(TRACKS);
    const keys = [...drafts.map((t) => t.key), ...drafts.flatMap((t) => t.subCategories.map((s) => s.key))];

    expect(new Set(keys).size).toBe(keys.length);
  });

  it("새로 만든 항목은 id 가 null 로 나간다", () => {
    // 10.20 요청 본문 규약.
    const drafts = [...toTrackDrafts(TRACKS), { ...emptyTrack(), name: "창업" }];
    drafts[2].subCategories = [{ ...emptySubCategory(), name: "Figma" }];

    const result = toTracks(drafts);
    expect(result[2]).toEqual({ id: null, name: "창업", subCategories: [{ id: null, name: "Figma" }] });
  });

  it("이름의 앞뒤 공백은 보내지 않는다", () => {
    const drafts = toTrackDrafts(TRACKS);
    drafts[0].name = "  SW  ";
    drafts[0].subCategories[0].name = " 웹기초 ";

    const result = toTracks(drafts);
    expect(result[0].name).toBe("SW");
    expect(result[0].subCategories[0].name).toBe("웹기초");
  });

  it("소분류가 빈 대분류를 견딘다", () => {
    expect(toTracks(toTrackDrafts(TRACKS))[1]).toEqual({ id: 3, name: "세미나", subCategories: [] });
  });

  it("새 항목끼리도 key 가 겹치지 않는다", () => {
    const keys = [emptyTrack().key, emptyTrack().key, emptySubCategory().key];
    expect(new Set(keys).size).toBe(3);
  });
});

describe("tracksInvalidReason", () => {
  it("올바른 입력은 막지 않는다", () => {
    expect(tracksInvalidReason(toTrackDrafts(TRACKS))).toBeNull();
  });

  it("빈 목록도 막지 않는다", () => {
    expect(tracksInvalidReason([])).toBeNull();
  });

  it("이름이 빈 대분류를 막는다", () => {
    const drafts = [...toTrackDrafts(TRACKS), emptyTrack()];
    expect(tracksInvalidReason(drafts)).toBe("이름이 비어 있는 대분류가 있습니다.");
  });

  it("공백만 있는 이름도 빈 것으로 본다", () => {
    const drafts = toTrackDrafts(TRACKS);
    drafts[0].name = "   ";
    expect(tracksInvalidReason(drafts)).toBe("이름이 비어 있는 대분류가 있습니다.");
  });

  it("대분류 이름이 겹치면 막는다", () => {
    const drafts = toTrackDrafts(TRACKS);
    drafts[1].name = "SW";
    expect(tracksInvalidReason(drafts)).toBe("대분류 이름이 겹칩니다.");
  });

  it("소분류가 비었거나 겹치면 어느 대분류인지 짚어 준다", () => {
    const blank = toTrackDrafts(TRACKS);
    blank[0].subCategories.push(emptySubCategory());
    expect(tracksInvalidReason(blank)).toBe("SW 에 이름이 비어 있는 소분류가 있습니다.");

    const dup = toTrackDrafts(TRACKS);
    dup[0].subCategories[1].name = "웹기초";
    expect(tracksInvalidReason(dup)).toBe("SW 의 소분류 이름이 겹칩니다.");
  });

  it("다른 대분류의 소분류와는 이름이 같아도 된다", () => {
    // 'SW/기초' 와 '창업/기초' 는 다른 것이다.
    const drafts = toTrackDrafts(TRACKS);
    drafts[1].subCategories = [{ ...emptySubCategory(), name: "웹기초" }];

    expect(tracksInvalidReason(drafts)).toBeNull();
  });
});
