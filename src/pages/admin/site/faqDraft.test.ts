import { describe, expect, it } from "vitest";

import type { Faq } from "../../../types/site";

import { emptyFaq, faqInvalidReason, fromDrafts, toDrafts } from "./faqDraft";

const FAQS: Faq[] = [{ id: 1, question: "활동 시간은?", answer: "화요일 저녁 7시" }];

describe("toDrafts · fromDrafts", () => {
  it("손대지 않으면 값이 그대로 돌아온다", () => {
    expect(fromDrafts(toDrafts(FAQS))).toEqual(FAQS);
  });

  it("화면 전용 key 는 서버로 나가지 않는다", () => {
    expect(fromDrafts(toDrafts(FAQS))[0]).not.toHaveProperty("key");
  });

  it("행마다 서로 다른 key 를 준다", () => {
    // id 를 key 로 쓰면 새로 만든 행이 전부 null 이라 React 가 행을 헷갈린다.
    const keys = [...toDrafts(FAQS).map((r) => r.key), emptyFaq().key, emptyFaq().key];
    expect(new Set(keys).size).toBe(keys.length);
  });

  it("새 행은 id 가 null 이다", () => {
    expect(fromDrafts([emptyFaq()])[0]).toEqual({ id: null, question: "", answer: "" });
  });

  it("빈 목록을 견딘다", () => {
    expect(fromDrafts(toDrafts([]))).toEqual([]);
  });
});

describe("faqInvalidReason", () => {
  it("올바른 입력은 막지 않는다", () => {
    expect(faqInvalidReason(toDrafts(FAQS))).toBeNull();
  });

  it("빈 목록은 막지 않는다", () => {
    expect(faqInvalidReason([])).toBeNull();
  });

  it("질문이 빈 FAQ 를 막는다", () => {
    expect(faqInvalidReason([...toDrafts(FAQS), emptyFaq()])).toBe("질문이 비어 있는 FAQ 가 있습니다.");
  });

  it("답이 없으면 공개 사이트에 빈칸으로 나가니 막는다", () => {
    const drafts = toDrafts(FAQS);
    drafts[0].answer = "  ";
    expect(faqInvalidReason(drafts)).toBe('"활동 시간은?" 의 답변을 입력해 주세요.');
  });
});
