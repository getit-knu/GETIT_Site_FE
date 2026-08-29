import { afterEach, describe, expect, it, vi } from "vitest";

import { client } from "../client";

import {
  createQuestion,
  deleteQuestion,
  getCriteria,
  getQuestions,
  getSchedule,
  reorderQuestions,
  saveCriteria,
  saveSchedule,
  updateQuestion,
} from "./recruitmentApi";

afterEach(() => {
  vi.restoreAllMocks();
});

describe("getSchedule / saveSchedule", () => {
  it("GET /api/admin/recruitment/schedule 를 호출한다", async () => {
    const get = vi.spyOn(client, "get").mockResolvedValue({ data: { generationId: 1 } });
    await getSchedule();
    expect(get).toHaveBeenCalledWith("/api/admin/recruitment/schedule");
  });

  it("PUT /api/admin/recruitment/schedule 를 호출한다", async () => {
    const put = vi.spyOn(client, "put").mockResolvedValue({ data: { generationId: 1 } });
    const payload = {
      totalStartAt: "2026-09-01T00:00",
      totalEndAt: "2026-09-30T23:59",
      documentStartAt: "2026-09-01T00:00",
      documentEndAt: "2026-09-10T23:59",
      interviewStartAt: "2026-09-15T00:00",
    };
    await saveSchedule(payload);
    expect(put).toHaveBeenCalledWith("/api/admin/recruitment/schedule", payload);
  });
});

describe("문항 CRUD", () => {
  it("GET /api/admin/recruitment/questions 를 호출한다", async () => {
    const get = vi.spyOn(client, "get").mockResolvedValue({ data: [] });
    await getQuestions();
    expect(get).toHaveBeenCalledWith("/api/admin/recruitment/questions");
  });

  it("POST /api/admin/recruitment/questions 를 호출한다", async () => {
    const post = vi.spyOn(client, "post").mockResolvedValue({ data: {} });
    const payload = { type: "TEXT" as const, content: "동기는?", required: true, maxLength: 300, options: null };
    await createQuestion(payload);
    expect(post).toHaveBeenCalledWith("/api/admin/recruitment/questions", payload);
  });

  it("PUT /api/admin/recruitment/questions/{id} 를 호출한다", async () => {
    const put = vi.spyOn(client, "put").mockResolvedValue({ data: {} });
    const payload = { type: "TEXT" as const, content: "동기는?", required: true, maxLength: 300, options: null };
    await updateQuestion(1, payload);
    expect(put).toHaveBeenCalledWith("/api/admin/recruitment/questions/1", payload);
  });

  it("DELETE /api/admin/recruitment/questions/{id} 를 호출한다", async () => {
    const del = vi.spyOn(client, "delete").mockResolvedValue({ data: undefined });
    await deleteQuestion(1);
    expect(del).toHaveBeenCalledWith("/api/admin/recruitment/questions/1");
  });

  it("PUT /api/admin/recruitment/questions/order 를 호출한다", async () => {
    const put = vi.spyOn(client, "put").mockResolvedValue({ data: undefined });
    await reorderQuestions([3, 1, 2]);
    expect(put).toHaveBeenCalledWith("/api/admin/recruitment/questions/order", { orderedIds: [3, 1, 2] });
  });
});

describe("getCriteria", () => {
  it("GET /api/admin/recruitment/criteria 를 호출한다", async () => {
    const get = vi.spyOn(client, "get").mockResolvedValue({ data: { criteria: [], totalScore: 0, valid: false } });
    await getCriteria();
    expect(get).toHaveBeenCalledWith("/api/admin/recruitment/criteria");
  });
});

describe("saveCriteria", () => {
  const CURRENT = {
    criteria: [
      { id: 1, order: 1, name: "전공 적합성", guideline: "", maxScore: 20 },
      { id: 2, order: 2, name: "지원 동기", guideline: "", maxScore: 30 },
      { id: 3, order: 3, name: "경험 및 역량", guideline: "", maxScore: 30 },
      { id: 4, order: 4, name: "성장 가능성", guideline: "", maxScore: 20 },
    ],
    totalScore: 100,
    valid: true,
  };

  it("삭제된 항목은 DELETE, 새 항목(id 없음)은 POST, 남은 항목은 PUT으로 보낸다", async () => {
    vi.spyOn(client, "get").mockResolvedValue({ data: CURRENT });
    const del = vi.spyOn(client, "delete").mockResolvedValue({ data: undefined });
    const post = vi.spyOn(client, "post").mockResolvedValue({ data: {} });
    const put = vi.spyOn(client, "put").mockResolvedValue({ data: {} });

    await saveCriteria([
      { id: 1, name: "전공 적합성", guideline: "", maxScore: 20 },
      { id: 2, name: "지원 동기", guideline: "", maxScore: 30 },
      { id: 3, name: "경험 및 역량", guideline: "", maxScore: 30 },
      // id 4는 초안에서 빠졌다 — 삭제 대상
      { name: "성장 가능성", guideline: "", maxScore: 20 }, // id 없음 — 새로 추가
    ]);

    expect(del).toHaveBeenCalledWith("/api/admin/recruitment/criteria/4");
    expect(post).toHaveBeenCalledWith("/api/admin/recruitment/criteria", {
      name: "성장 가능성",
      guideline: "",
      maxScore: 20,
    });
    expect(put).toHaveBeenCalledWith("/api/admin/recruitment/criteria/1", {
      name: "전공 적합성",
      guideline: "",
      maxScore: 20,
    });
  });

  it("배점이 줄어드는 수정을 늘어나는 수정보다 먼저 보낸다(중간 합계가 100을 넘지 않도록)", async () => {
    vi.spyOn(client, "get").mockResolvedValue({ data: CURRENT });
    vi.spyOn(client, "delete").mockResolvedValue({ data: undefined });
    vi.spyOn(client, "post").mockResolvedValue({ data: {} });
    const put = vi.spyOn(client, "put").mockResolvedValue({ data: {} });

    // id 1: 20 → 30(+10), id 2: 30 → 20(-10) — 합계는 그대로 100이지만
    // id 1을 먼저 보내면 그 순간만 110이 되어 BE가 거절한다.
    await saveCriteria([
      { id: 1, name: "전공 적합성", guideline: "", maxScore: 30 },
      { id: 2, name: "지원 동기", guideline: "", maxScore: 20 },
      { id: 3, name: "경험 및 역량", guideline: "", maxScore: 30 },
      { id: 4, name: "성장 가능성", guideline: "", maxScore: 20 },
    ]);

    const order = put.mock.calls.map(([url]) => url);
    expect(order.indexOf("/api/admin/recruitment/criteria/2")).toBeLessThan(
      order.indexOf("/api/admin/recruitment/criteria/1"),
    );
  });

  it("삭제를 수정/추가보다 먼저 보낸다", async () => {
    vi.spyOn(client, "get").mockResolvedValue({ data: CURRENT });
    const del = vi.spyOn(client, "delete").mockResolvedValue({ data: undefined });
    const post = vi.spyOn(client, "post").mockResolvedValue({ data: {} });
    vi.spyOn(client, "put").mockResolvedValue({ data: {} });

    await saveCriteria([
      { id: 1, name: "전공 적합성", guideline: "", maxScore: 20 },
      { id: 2, name: "지원 동기", guideline: "", maxScore: 30 },
      { id: 3, name: "경험 및 역량", guideline: "", maxScore: 30 },
      { name: "성장 가능성 v2", guideline: "", maxScore: 20 },
    ]);

    // 삭제(id 4) 호출이 추가(POST) 호출보다 앞서 일어났는지 순서를 확인한다.
    const delOrder = del.mock.invocationCallOrder[0];
    const postOrder = post.mock.invocationCallOrder[0];
    expect(delOrder).toBeLessThan(postOrder);
  });
});
