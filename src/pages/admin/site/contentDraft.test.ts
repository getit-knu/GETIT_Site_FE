import { describe, expect, it } from "vitest";

import type { Curriculum, Faq, SiteEvent } from "../../../types/site";

import { contentInvalidReason, emptyCurriculum, emptyEvent, emptyFaq, fromDrafts, toDrafts } from "./contentDraft";

const CURRICULUMS: Curriculum[] = [{ id: 1, title: "Python & 데이터 분석", subtitle: "기초부터" }];
const EVENTS: SiteEvent[] = [
  { id: 11, title: "개발 대회", startDate: "2026-09-27", endDate: "2026-11-11", type: "COMPETITION" },
];
const FAQS: Faq[] = [{ id: 1, question: "활동 시간은?", answer: "화요일 저녁 7시" }];

const drafts = () => ({
  curriculums: toDrafts(CURRICULUMS),
  events: toDrafts(EVENTS),
  faqs: toDrafts(FAQS),
});

describe("toDrafts · fromDrafts", () => {
  it("손대지 않으면 값이 그대로 돌아온다", () => {
    expect(fromDrafts(toDrafts(EVENTS))).toEqual(EVENTS);
  });

  it("화면 전용 key 는 서버로 나가지 않는다", () => {
    expect(fromDrafts(toDrafts(FAQS))[0]).not.toHaveProperty("key");
  });

  it("행마다 서로 다른 key 를 준다", () => {
    // id 를 key 로 쓰면 새로 만든 행이 전부 null 이라 React 가 행을 헷갈린다.
    const keys = [
      ...toDrafts(CURRICULUMS).map((r) => r.key),
      ...toDrafts(EVENTS).map((r) => r.key),
      emptyCurriculum().key,
      emptyEvent().key,
      emptyFaq().key,
    ];

    expect(new Set(keys).size).toBe(keys.length);
  });

  it("새 행은 id 가 null 이다", () => {
    // 10.20 요청 본문 규약.
    expect(fromDrafts([emptyCurriculum()])[0]).toEqual({ id: null, title: "", subtitle: "" });
    expect(fromDrafts([emptyEvent()])[0]).toEqual({
      id: null,
      title: "",
      startDate: "",
      endDate: "",
      type: "EVENT",
    });
    expect(fromDrafts([emptyFaq()])[0]).toEqual({ id: null, question: "", answer: "" });
  });

  it("빈 목록을 견딘다", () => {
    expect(fromDrafts(toDrafts([]))).toEqual([]);
  });
});

describe("contentInvalidReason", () => {
  it("올바른 입력은 막지 않는다", () => {
    const d = drafts();
    expect(contentInvalidReason(d.curriculums, d.events, d.faqs)).toBeNull();
  });

  it("셋 다 비어 있어도 막지 않는다", () => {
    expect(contentInvalidReason([], [], [])).toBeNull();
  });

  it("제목이 빈 커리큘럼을 막는다", () => {
    const d = drafts();
    expect(contentInvalidReason([...d.curriculums, emptyCurriculum()], d.events, d.faqs)).toBe(
      "제목이 비어 있는 커리큘럼이 있습니다.",
    );
  });

  it("공백만 있는 제목도 빈 것으로 본다", () => {
    const d = drafts();
    d.curriculums[0].title = "   ";
    expect(contentInvalidReason(d.curriculums, d.events, d.faqs)).toBe("제목이 비어 있는 커리큘럼이 있습니다.");
  });

  it("행사 기간이 비면 어느 행사인지 짚어 준다", () => {
    const d = drafts();
    d.events[0].endDate = "";
    expect(contentInvalidReason(d.curriculums, d.events, d.faqs)).toBe("개발 대회 의 행사 기간을 입력해 주세요.");
  });

  it("행사 종료일이 시작일보다 빠르면 막는다", () => {
    const d = drafts();
    d.events[0].endDate = "2026-09-01";
    expect(contentInvalidReason(d.curriculums, d.events, d.faqs)).toBe("개발 대회 의 종료일이 시작일보다 빠릅니다.");
  });

  it("하루짜리 행사는 막지 않는다", () => {
    // 시작과 종료가 같은 행사가 있다.
    const d = drafts();
    d.events[0].endDate = d.events[0].startDate;
    expect(contentInvalidReason(d.curriculums, d.events, d.faqs)).toBeNull();
  });

  it("질문이나 답변이 빈 FAQ 를 막는다", () => {
    const d = drafts();
    expect(contentInvalidReason(d.curriculums, d.events, [...d.faqs, emptyFaq()])).toBe(
      "질문이 비어 있는 FAQ 가 있습니다.",
    );

    // 답이 없으면 공개 사이트에 빈칸으로 나간다.
    const blankAnswer = drafts();
    blankAnswer.faqs[0].answer = "  ";
    expect(contentInvalidReason(blankAnswer.curriculums, blankAnswer.events, blankAnswer.faqs)).toBe(
      '"활동 시간은?" 의 답변을 입력해 주세요.',
    );
  });
});
