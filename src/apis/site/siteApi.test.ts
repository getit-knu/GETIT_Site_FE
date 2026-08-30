import { afterEach, describe, expect, it, vi } from "vitest";

import { client } from "../client";

import { getTracks, saveTracks } from "./siteApi";

afterEach(() => {
  vi.restoreAllMocks();
});

describe("getTracks", () => {
  it("GET /api/admin/setting/tracks 를 호출한다", async () => {
    const tree = [{ id: 1, name: "SW", order: 1, subCategories: [] }];
    const get = vi.spyOn(client, "get").mockResolvedValue({ data: tree });

    const result = await getTracks();

    expect(get).toHaveBeenCalledWith("/api/admin/setting/tracks");
    expect(result).toBe(tree);
  });
});

describe("saveTracks", () => {
  const CURRENT = [
    {
      id: 1,
      name: "SW",
      order: 1,
      subCategories: [
        { id: 1, name: "웹기초", order: 1, lectureCount: 0 },
        { id: 2, name: "React.js", order: 2, lectureCount: 3 },
      ],
    },
    { id: 3, name: "세미나", order: 2, subCategories: [] },
  ];

  it("삭제된 대분류는 DELETE, 이름이 바뀐 대분류는 PUT, 새 대분류는 POST 뒤 그 소분류를 새 id로 붙인다", async () => {
    vi.spyOn(client, "get").mockResolvedValue({ data: CURRENT });
    const del = vi.spyOn(client, "delete").mockResolvedValue({ data: undefined });
    const put = vi.spyOn(client, "put").mockResolvedValue({ data: {} });
    const post = vi
      .spyOn(client, "post")
      .mockImplementation((url: string) =>
        Promise.resolve({ data: url === "/api/admin/setting/tracks" ? { id: 99 } : {} }),
      );

    await saveTracks([
      {
        id: 1,
        name: "SW!", // 이름 변경
        subCategories: [
          { id: 1, name: "웹기초" }, // 그대로
          // id 2(React.js)는 초안에서 빠졌다 — 삭제 대상
          { id: null, name: "Vue.js" }, // 기존 대분류에 새 소분류 추가
        ],
      },
      // id 3(세미나)는 초안에서 통째로 빠졌다 — 대분류 삭제 대상(소분류는 서버가 cascade)
      { id: null, name: "창업", subCategories: [{ id: null, name: "Figma" }] }, // 새 대분류 + 새 소분류
    ]);

    expect(del).toHaveBeenCalledWith("/api/admin/setting/tracks/3");
    expect(del).toHaveBeenCalledWith("/api/admin/setting/subcategories/2");
    expect(del).toHaveBeenCalledTimes(2);

    expect(put).toHaveBeenCalledWith("/api/admin/setting/tracks/1", { name: "SW!" });
    // 이름이 그대로인 소분류(id 1)는 PUT 하지 않는다.
    expect(put).not.toHaveBeenCalledWith("/api/admin/setting/subcategories/1", expect.anything());
    expect(put).toHaveBeenCalledTimes(1);

    expect(post).toHaveBeenCalledWith("/api/admin/setting/subcategories", { trackId: 1, name: "Vue.js" });
    expect(post).toHaveBeenCalledWith("/api/admin/setting/tracks", { name: "창업" });
    // 새 대분류가 받은 id(99)로 그 밑 새 소분류를 만든다.
    expect(post).toHaveBeenCalledWith("/api/admin/setting/subcategories", { trackId: 99, name: "Figma" });
  });

  it("아무것도 바뀌지 않으면 아무 요청도 보내지 않는다", async () => {
    vi.spyOn(client, "get").mockResolvedValue({ data: CURRENT });
    const del = vi.spyOn(client, "delete");
    const put = vi.spyOn(client, "put");
    const post = vi.spyOn(client, "post");

    await saveTracks([
      {
        id: 1,
        name: "SW",
        subCategories: [
          { id: 1, name: "웹기초" },
          { id: 2, name: "React.js" },
        ],
      },
      { id: 3, name: "세미나", subCategories: [] },
    ]);

    expect(del).not.toHaveBeenCalled();
    expect(put).not.toHaveBeenCalled();
    expect(post).not.toHaveBeenCalled();
  });
});
