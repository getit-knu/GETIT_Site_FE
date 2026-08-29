import { afterEach, describe, expect, it, vi } from "vitest";

import { client } from "../client";

import { addMember, createGroup, deleteGroup, getGroups, removeMember, renameGroup } from "./groupsApi";

afterEach(() => {
  vi.restoreAllMocks();
});

describe("getGroups", () => {
  it("생략하면 활성 기수를 조회한다", async () => {
    const board = { generationNo: 9, groups: [], unassigned: [] };
    const get = vi.spyOn(client, "get").mockResolvedValue({ data: board });

    const result = await getGroups();

    expect(get).toHaveBeenCalledWith("/api/admin/groups");
    expect(result).toBe(board);
  });
});

describe("createGroup", () => {
  it("활성 기수를 먼저 조회해 그 id로 조를 만든다", async () => {
    const get = vi.spyOn(client, "get").mockResolvedValue({ data: { id: 9, generationNo: 9, year: 2026 } });
    const post = vi.spyOn(client, "post").mockResolvedValue({ data: null });

    await createGroup("3조");

    expect(get).toHaveBeenCalledWith("/api/admin/setting/generation");
    expect(post).toHaveBeenCalledWith("/api/admin/groups", { generationId: 9, name: "3조" });
  });
});

describe("renameGroup", () => {
  it("이름만 보낸다", async () => {
    const put = vi.spyOn(client, "put").mockResolvedValue({ data: null });

    await renameGroup(1, "새 이름");

    expect(put).toHaveBeenCalledWith("/api/admin/groups/1", { name: "새 이름" });
  });
});

describe("deleteGroup", () => {
  it("id로 삭제 요청을 보낸다", async () => {
    const del = vi.spyOn(client, "delete").mockResolvedValue({ data: null });

    await deleteGroup(1);

    expect(del).toHaveBeenCalledWith("/api/admin/groups/1");
  });
});

describe("addMember", () => {
  it("한 명이라도 userIds 배열로 감싸 보낸다", async () => {
    const post = vi.spyOn(client, "post").mockResolvedValue({ data: null });

    await addMember(1, 24);

    expect(post).toHaveBeenCalledWith("/api/admin/groups/1/members", { userIds: [24] });
  });
});

describe("removeMember", () => {
  it("조와 사용자 id로 삭제 요청을 보낸다", async () => {
    const del = vi.spyOn(client, "delete").mockResolvedValue({ data: null });

    await removeMember(1, 24);

    expect(del).toHaveBeenCalledWith("/api/admin/groups/1/members/24");
  });
});
