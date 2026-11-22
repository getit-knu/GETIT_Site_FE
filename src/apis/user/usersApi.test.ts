import { afterEach, describe, expect, it, vi } from "vitest";

import { client } from "../client";
import { downloadFile } from "../../libs/downloadFile";

import { deleteUser, exportUsers, getUserPhone, getUsers, promoteApplicants, updateUser } from "./usersApi";

vi.mock("../../libs/downloadFile");

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

describe("getUserPhone (#411)", () => {
  it("한 사람의 전체 번호를 받아 번호만 돌려준다", async () => {
    // 실제 BE 응답(`PhoneNumberResult`) 그대로다 — 문자열이 아니라 `{ phoneNumber }` 로 감싸 온다.
    const get = vi.spyOn(client, "get").mockResolvedValue({ data: { phoneNumber: "010-1234-5678" } });

    await expect(getUserPhone(21)).resolves.toBe("010-1234-5678");
    expect(get).toHaveBeenCalledWith("/api/admin/users/21/phone");
  });
});

describe("exportUsers (#411)", () => {
  it("연락처는 includePhone 을 켤 때만 요청한다", async () => {
    await exportUsers();
    expect(downloadFile).toHaveBeenLastCalledWith("/api/admin/users/export", "getit-users.xlsx", undefined);

    await exportUsers({ includePhone: true });
    expect(downloadFile).toHaveBeenLastCalledWith("/api/admin/users/export", "getit-users.xlsx", {
      includePhone: "true",
    });
  });
});
