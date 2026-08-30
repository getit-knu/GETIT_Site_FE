import { afterEach, describe, expect, it, vi } from "vitest";

import { client } from "../client";

import { getQuestion, getQuestions, saveAnswer } from "./questionsApi";

afterEach(() => {
  vi.restoreAllMocks();
});

describe("getQuestions", () => {
  it("필터를 쿼리로 보낸다", async () => {
    const page = { content: [], page: 0, size: 10, totalElements: 0, totalPages: 0, first: true, last: true };
    const get = vi.spyOn(client, "get").mockResolvedValue({ data: page });

    const result = await getQuestions({ status: "PENDING", lectureId: "none", page: 0, size: 10 });

    expect(get).toHaveBeenCalledWith("/api/admin/questions", {
      params: { status: "PENDING", lectureId: "none", page: 0, size: 10 },
    });
    expect(result).toBe(page);
  });
});

describe("getQuestion", () => {
  it("id로 상세를 조회한다", async () => {
    const detail = { id: 1 };
    const get = vi.spyOn(client, "get").mockResolvedValue({ data: detail });

    const result = await getQuestion(1);

    expect(get).toHaveBeenCalledWith("/api/admin/questions/1");
    expect(result).toBe(detail);
  });
});

describe("saveAnswer", () => {
  it("isEdit이 false면 POST로 작성한다", async () => {
    const post = vi.spyOn(client, "post").mockResolvedValue({ data: {} });

    await saveAnswer(1, "답변 내용", false);

    expect(post).toHaveBeenCalledWith("/api/admin/questions/1/answer", { content: "답변 내용" });
  });

  it("isEdit이 true면 PUT으로 수정한다", async () => {
    // 이미 답변이 있는데 POST 하면 409 ALREADY_ANSWERED 라, 화면이 아는 상태에 맞춰 갈라 보낸다.
    const put = vi.spyOn(client, "put").mockResolvedValue({ data: {} });

    await saveAnswer(1, "고친 답변", true);

    expect(put).toHaveBeenCalledWith("/api/admin/questions/1/answer", { content: "고친 답변" });
  });
});
