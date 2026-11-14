import type { AxiosAdapter } from "axios";
import { afterEach, describe, expect, it, vi } from "vitest";

import { client } from "../client";

import { getColleges, getFestaProjects, getHome, getMajors, getRecruitmentStatus, getStaffs } from "./publicApi";

afterEach(() => {
  vi.restoreAllMocks();
});

describe("getStaffs", () => {
  it("GET /api/public/staffs 를 호출한다", async () => {
    const get = vi.spyOn(client, "get").mockResolvedValue({ data: { sections: [] } });

    const result = await getStaffs();

    expect(get).toHaveBeenCalledWith("/api/public/staffs");
    expect(result).toEqual({ sections: [] });
  });
});

describe("getColleges", () => {
  it("GET /api/public/colleges 를 호출한다", async () => {
    const colleges = [{ id: 1, name: "경영대학" }];
    const get = vi.spyOn(client, "get").mockResolvedValue({ data: colleges });

    const result = await getColleges();

    expect(get).toHaveBeenCalledWith("/api/public/colleges");
    expect(result).toEqual(colleges);
  });
});

describe("getMajors", () => {
  it("GET /api/public/majors 를 호출한다", async () => {
    const majors = [{ id: 1, collegeId: 1, name: "경영학과" }];
    const get = vi.spyOn(client, "get").mockResolvedValue({ data: majors });

    const result = await getMajors();

    expect(get).toHaveBeenCalledWith("/api/public/majors");
    expect(result).toEqual(majors);
  });
});

describe("getRecruitmentStatus", () => {
  it("GET /api/public/recruitment/status 를 호출한다", async () => {
    const status = { generationNo: 9, year: 2026, phase: "DOCUMENT_OPEN", dDay: 2, message: "", applyEnabled: true };
    const get = vi.spyOn(client, "get").mockResolvedValue({ data: status });

    const result = await getRecruitmentStatus();

    expect(get).toHaveBeenCalledWith("/api/public/recruitment/status");
    expect(result).toEqual(status);
  });
});

describe("getHome", () => {
  it("BE envelope 그대로의 응답에서 features.mockInvestment 를 읽는다(#359 wire-shape)", async () => {
    // 스파이로 client.get 을 바꿔 치우면 인터셉터(envelope 벗기기)를 건너뛰어 래퍼 불일치를 못 잡는다
    // (10번째 릴리즈 장애). 어댑터만 갈아 끼워 실제 인터셉터를 태운다. 모양은 BE `HomeControllerTest` 기준.
    const adapter: AxiosAdapter = (config) =>
      Promise.resolve({
        data: {
          success: true,
          data: { curriculums: [], featuredProjects: [], features: { stockGame: false, mockInvestment: true } },
          error: null,
        },
        status: 200,
        statusText: "OK",
        headers: {},
        config,
      });
    const original = client.defaults.adapter;
    client.defaults.adapter = adapter;

    try {
      const result = await getHome();
      expect(result.features.mockInvestment).toBe(true);
    } finally {
      client.defaults.adapter = original;
    }
  });
});

describe("getFestaProjects", () => {
  it("BE envelope 안의 배열을 그대로 출전 순서로 돌려준다(#362 wire-shape)", async () => {
    // 모양은 BE `FestaProjectPublicController` 기준 — `ApiResponse<List<ProjectShowcaseResult.Item>>`.
    const item = {
      id: 7,
      title: "폴리핏",
      teamName: "TEAM A",
      semester: "2026-FALL",
      semesterLabel: "2026 Fall",
      description: "설명",
      techStacks: ["React"],
      codeUrl: "https://github.com/getit-knu",
      demoUrl: "https://polifit.example.com",
      thumbnailUrl: null,
    };
    let requestedUrl: string | undefined;
    const adapter: AxiosAdapter = (config) => {
      requestedUrl = config.url;
      return Promise.resolve({
        data: { success: true, data: [item, { ...item, id: 3 }], error: null },
        status: 200,
        statusText: "OK",
        headers: {},
        config,
      });
    };
    const original = client.defaults.adapter;
    client.defaults.adapter = adapter;

    try {
      const result = await getFestaProjects();
      expect(requestedUrl).toBe("/api/public/festa/projects");
      expect(result.map((p) => p.id)).toEqual([7, 3]);
    } finally {
      client.defaults.adapter = original;
    }
  });
});
