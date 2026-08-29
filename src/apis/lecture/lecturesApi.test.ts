import { afterEach, describe, expect, it, vi } from "vitest";

import { client } from "../client";

import {
  createFeedback,
  createLecture,
  deleteLecture,
  getLectureDetail,
  getLectures,
  getSubmissionDetail,
  getSubmissions,
  navigateSubmissions,
  updateFeedback,
  updateLecture,
} from "./lecturesApi";

afterEach(() => {
  vi.restoreAllMocks();
});

describe("getLectures", () => {
  it("트랙 · 소분류 필터를 쿼리로 보낸다", async () => {
    const board = { tracks: [], lectures: [] };
    const get = vi.spyOn(client, "get").mockResolvedValue({ data: board });

    const result = await getLectures({ trackId: 1, subCategoryId: 2 });

    expect(get).toHaveBeenCalledWith("/api/admin/lectures", { params: { trackId: 1, subCategoryId: 2 } });
    expect(result).toBe(board);
  });
});

describe("deleteLecture", () => {
  it("id로 삭제 요청을 보낸다", async () => {
    const del = vi.spyOn(client, "delete").mockResolvedValue({ data: null });

    await deleteLecture(101);

    expect(del).toHaveBeenCalledWith("/api/admin/lectures/101");
  });
});

describe("getLectureDetail", () => {
  it("id로 상세를 조회한다", async () => {
    const detail = { id: 101, title: "HTML/CSS 기초" };
    const get = vi.spyOn(client, "get").mockResolvedValue({ data: detail });

    const result = await getLectureDetail(101);

    expect(get).toHaveBeenCalledWith("/api/admin/lectures/101");
    expect(result).toBe(detail);
  });
});

describe("createLecture / updateLecture", () => {
  const payload = {
    trackId: 1,
    subCategoryId: null,
    week: 1,
    title: "HTML/CSS 기초",
    description: "",
    youtubeUrl: "",
    materialUrl: "",
    durationMinutes: null,
    isPublished: true,
    fileIds: [],
    assignment: null,
  };

  it("POST /api/admin/lectures 로 새 강의를 만든다", async () => {
    const post = vi.spyOn(client, "post").mockResolvedValue({ data: null });

    await createLecture(payload);

    expect(post).toHaveBeenCalledWith("/api/admin/lectures", payload);
  });

  it("PUT /api/admin/lectures/{id} 로 강의를 고친다", async () => {
    const put = vi.spyOn(client, "put").mockResolvedValue({ data: null });

    await updateLecture(101, payload);

    expect(put).toHaveBeenCalledWith("/api/admin/lectures/101", payload);
  });
});

describe("getSubmissions", () => {
  it("lectureId는 경로로, 나머지는 쿼리로 보낸다", async () => {
    const board = { lecture: { id: 101, title: "t", deadline: "" }, counts: {}, content: [] };
    const get = vi.spyOn(client, "get").mockResolvedValue({ data: board });

    const result = await getSubmissions({ lectureId: 101, submitted: true, groupId: 1, page: 2 });

    expect(get).toHaveBeenCalledWith("/api/admin/lectures/101/submissions", {
      params: { submitted: true, groupId: 1, page: 2 },
    });
    expect(result).toBe(board);
  });
});

describe("getSubmissionDetail", () => {
  it("id로 제출 상세를 조회한다", async () => {
    const detail = { id: 3005 };
    const get = vi.spyOn(client, "get").mockResolvedValue({ data: detail });

    const result = await getSubmissionDetail(3005);

    expect(get).toHaveBeenCalledWith("/api/admin/submissions/3005");
    expect(result).toBe(detail);
  });
});

describe("createFeedback / updateFeedback", () => {
  it("POST /api/admin/submissions/{id}/feedback 로 피드백을 새로 단다", async () => {
    const created = { id: 9002, submissionId: 3005, adminName: "김운영", content: "좋습니다.", createdAt: "" };
    const post = vi.spyOn(client, "post").mockResolvedValue({ data: created });

    const result = await createFeedback(3005, "좋습니다.");

    expect(post).toHaveBeenCalledWith("/api/admin/submissions/3005/feedback", { content: "좋습니다." });
    expect(result).toBe(created);
  });

  it("PUT /api/admin/feedbacks/{id} 로 피드백을 고친다", async () => {
    const updated = { id: 9001, content: "고친 내용", updatedAt: "" };
    const put = vi.spyOn(client, "put").mockResolvedValue({ data: updated });

    const result = await updateFeedback(9001, "고친 내용");

    expect(put).toHaveBeenCalledWith("/api/admin/feedbacks/9001", { content: "고친 내용" });
    expect(result).toBe(updated);
  });
});

describe("navigateSubmissions", () => {
  it("lectureId는 경로로, currentSubmissionId 등은 쿼리로 보낸다", async () => {
    const nav = { current: 1, total: 2, prevSubmissionId: null, nextSubmissionId: 3006 };
    const get = vi.spyOn(client, "get").mockResolvedValue({ data: nav });

    const result = await navigateSubmissions({ lectureId: 101, currentSubmissionId: 3005, feedbackDone: false });

    expect(get).toHaveBeenCalledWith("/api/admin/lectures/101/submissions/navigate", {
      params: { currentSubmissionId: 3005, feedbackDone: false },
    });
    expect(result).toBe(nav);
  });
});
