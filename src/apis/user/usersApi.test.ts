import { afterEach, describe, expect, it, vi } from "vitest";

import { client } from "../client";

import { deleteUser, getUsers, promoteApplicants, updateUser } from "./usersApi";

afterEach(() => {
  vi.restoreAllMocks();
});

describe("getUsers", () => {
  it("검색·필터·페이지를 쿼리로 보낸다", async () => {
    const page = { content: [], page: 0, size: 10, totalElements: 0, totalPages: 1, first: true, last: true };
    const get = vi.spyOn(client, "get").mockResolvedValue({ data: page });

    const result = await getUsers({ role: "MEMBER", keyword: "김", page: 0, size: 10 });

    expect(get).toHaveBeenCalledWith("/api/admin/users", {
      params: { role: "MEMBER", keyword: "김", page: 0, size: 10 },
    });
    expect(result).toBe(page);
  });
});

describe("updateUser", () => {
  it("보낸 필드만 실어 PUT 한다", async () => {
    const updated = { id: 21, role: "MEMBER" };
    const put = vi.spyOn(client, "put").mockResolvedValue({ data: updated });

    const result = await updateUser(21, { role: "MEMBER" });

    expect(put).toHaveBeenCalledWith("/api/admin/users/21", { role: "MEMBER" });
    expect(result).toBe(updated);
  });
});

describe("deleteUser", () => {
  it("id로 삭제 요청을 보낸다", async () => {
    const del = vi.spyOn(client, "delete").mockResolvedValue({ data: null });

    await deleteUser(21);

    expect(del).toHaveBeenCalledWith("/api/admin/users/21");
  });
});

describe("promoteApplicants", () => {
  it("활성 기수를 먼저 조회해 그 id로 승격 요청을 보낸다", async () => {
    const result = { promotedCount: 3, skippedCount: 1, skipped: [{ applicationId: 5, reason: "ALREADY_MEMBER" }] };
    const get = vi.spyOn(client, "get").mockResolvedValue({ data: { id: 9, generationNo: 9, year: 2026 } });
    const post = vi.spyOn(client, "post").mockResolvedValue({ data: result });

    const promoted = await promoteApplicants();

    expect(get).toHaveBeenCalledWith("/api/admin/setting/generation");
    expect(post).toHaveBeenCalledWith("/api/admin/users/promote", { generationId: 9 });
    expect(promoted).toBe(result);
  });
});
