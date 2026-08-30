import { afterEach, describe, expect, it, vi } from "vitest";

import { client } from "../client";

import {
  getOngoingLectures,
  getRecentQuestions,
  getSubmissionStatus,
  getSummary,
  getUpcomingEvents,
} from "./dashboardApi";

afterEach(() => {
  vi.restoreAllMocks();
});

describe("getSummary", () => {
  it("상단 카운터를 조회한다", async () => {
    const summary = {
      totalApplicants: 1,
      memberCount: 2,
      unEvaluatedAssignmentCount: 3,
      unansweredQuestionCount: 4,
    };
    const get = vi.spyOn(client, "get").mockResolvedValue({ data: summary });

    const result = await getSummary();

    expect(get).toHaveBeenCalledWith("/api/admin/dashboard/summary");
    expect(result).toBe(summary);
  });
});

describe("getRecentQuestions", () => {
  it("미확인 Q&A 목록을 조회한다", async () => {
    const get = vi.spyOn(client, "get").mockResolvedValue({ data: [] });

    await getRecentQuestions();

    expect(get).toHaveBeenCalledWith("/api/admin/dashboard/recent-questions");
  });
});

describe("getSubmissionStatus", () => {
  it("주차별 과제 제출 현황을 조회한다", async () => {
    const status = { totalMemberCount: 10, weeks: [] };
    const get = vi.spyOn(client, "get").mockResolvedValue({ data: status });

    const result = await getSubmissionStatus();

    expect(get).toHaveBeenCalledWith("/api/admin/dashboard/submission-status");
    expect(result).toBe(status);
  });
});

describe("getUpcomingEvents", () => {
  it("다가오는 행사 목록을 조회한다", async () => {
    const get = vi.spyOn(client, "get").mockResolvedValue({ data: [] });

    await getUpcomingEvents();

    expect(get).toHaveBeenCalledWith("/api/admin/dashboard/upcoming-events");
  });
});

describe("getOngoingLectures", () => {
  it("진행 중 강의 목록을 조회한다", async () => {
    const get = vi.spyOn(client, "get").mockResolvedValue({ data: [] });

    await getOngoingLectures();

    expect(get).toHaveBeenCalledWith("/api/admin/dashboard/ongoing-lectures");
  });
});
