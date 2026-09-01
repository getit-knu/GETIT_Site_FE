import { describe, expect, it } from "vitest";

import { emptyDraft, invalidReason, toPayload, type Draft } from "./lectureFormState";

/** 검증을 통과하는 최소한의 강의. 각 테스트는 여기서 한 군데씩만 어긋뜨린다. */
function validDraft(overrides: Partial<Draft> = {}): Draft {
  return { ...emptyDraft(1), week: "1", title: "리액트 입문", ...overrides };
}

describe("invalidReason", () => {
  it("제목과 주차만 있으면 통과한다", () => {
    expect(invalidReason(validDraft())).toBeNull();
  });

  it("주차는 1 이상의 정수여야 한다", () => {
    // 0주차·소수 주차는 존재하지 않는다. 빈 칸도 `Number("")`가 0이라 여기서 걸린다.
    expect(invalidReason(validDraft({ week: "0" }))).toBe("주차는 1 이상의 정수여야 합니다.");
    expect(invalidReason(validDraft({ week: "1.5" }))).toBe("주차는 1 이상의 정수여야 합니다.");
    expect(invalidReason(validDraft({ week: "" }))).toBe("주차는 1 이상의 정수여야 합니다.");
  });

  it("URL 은 비워 둘 수 있지만 적었다면 형식이 맞아야 한다", () => {
    expect(invalidReason(validDraft({ youtubeUrl: "" }))).toBeNull();
    expect(invalidReason(validDraft({ youtubeUrl: "youtube.com/watch" }))).toBe("유튜브 URL 형식이 올바르지 않습니다.");
    expect(invalidReason(validDraft({ youtubeUrl: "https://youtube.com/watch?v=1" }))).toBeNull();
  });

  it("과제를 켜지 않으면 과제 칸이 비어 있어도 통과한다", () => {
    // 과제 없는 강의가 대부분이다. 안 쓰는 칸 때문에 저장이 막히면 안 된다.
    expect(invalidReason(validDraft({ hasAssignment: false, assignmentTitle: "" }))).toBeNull();
  });

  it("과제를 켜면 제출 방식을 하나 이상 골라야 한다", () => {
    const draft = validDraft({
      hasAssignment: true,
      assignmentTitle: "1주차 과제",
      assignmentDescription: "설명",
      assignmentDeadline: "2026-09-30T23:59",
      allowedTypes: [],
    });

    expect(invalidReason(draft)).toBe("과제 제출 방식을 하나 이상 선택해 주세요.");
  });

  it("주소를 손으로 고쳐 마감 기한이 깨지면 걸러낸다", () => {
    // `datetime-local` 이 아닌 값이 들어오면 `toIso`가 빈 문자열을 준다.
    const draft = validDraft({
      hasAssignment: true,
      assignmentTitle: "1주차 과제",
      assignmentDescription: "설명",
      assignmentDeadline: "언젠가",
    });

    expect(invalidReason(draft)).toBe("과제 마감 기한 형식이 올바르지 않습니다.");
  });
});

describe("toPayload", () => {
  it("화면에서 '없음'으로 쓰는 0 과 빈 칸을 null 로 바꿔 보낸다", () => {
    const payload = toPayload(validDraft({ subCategoryId: 0, durationMinutes: "" }));

    expect(payload.subCategoryId).toBeNull();
    expect(payload.durationMinutes).toBeNull();
    expect(payload.assignment).toBeNull();
  });

  it("링크 제출을 허용하지 않으면 링크 안내 문구는 보내지 않는다", () => {
    const payload = toPayload(
      validDraft({
        hasAssignment: true,
        assignmentTitle: "  1주차 과제  ",
        assignmentDeadline: "2026-09-30T23:59",
        allowedTypes: ["FILE"],
        linkPlaceholder: "구글 드라이브 링크",
      }),
    );

    expect(payload.assignment?.linkPlaceholder).toBeNull();
    // 제목은 앞뒤 공백을 털어 보낸다.
    expect(payload.assignment?.title).toBe("1주차 과제");
  });
});
