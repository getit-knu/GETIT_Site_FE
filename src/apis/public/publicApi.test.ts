import { afterEach, describe, expect, it, vi } from "vitest";

import { client } from "../client";

import { getColleges, getMajors, getRecruitmentStatus, getStaffs } from "./publicApi";

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
