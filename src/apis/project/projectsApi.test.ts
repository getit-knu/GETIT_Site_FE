import type { AxiosAdapter, InternalAxiosRequestConfig } from "axios";
import { describe, expect, it } from "vitest";

import { client } from "../client";
import type { AdminProjectPayload, ProjectSubmitPayload } from "../../types/project";

import { submitProject } from "./memberProjectsApi";
import { updateProject } from "./projectsApi";

/** 실제 직렬화를 거친 요청 본문을 보려고 axios adapter 만 바꾼다(#382 wire-shape). */
async function withAdapter<T>(
  data: unknown,
  run: () => Promise<T>,
): Promise<{ result: T; config: InternalAxiosRequestConfig }> {
  let seen: InternalAxiosRequestConfig | undefined;
  const adapter: AxiosAdapter = (config) => {
    seen = config;
    return Promise.resolve({
      data: { success: true, data, error: null },
      status: 200,
      statusText: "OK",
      headers: {},
      config,
    });
  };
  const original = client.defaults.adapter;
  client.defaults.adapter = adapter;
  try {
    const result = await run();
    if (seen === undefined) throw new Error("요청이 나가지 않았다");
    return { result, config: seen };
  } finally {
    client.defaults.adapter = original;
  }
}

const body = (config: InternalAxiosRequestConfig) => JSON.parse(config.data as string) as Record<string, unknown>;

describe("updateProject (#382)", () => {
  it("이미지 목록과 한 줄 소개 등을 null 까지 그대로 실어 보낸다 — 빠지면 BE가 지운다", async () => {
    // 모양은 BE `ProjectRequest.Write`·`ProjectResult.Item`(BE#227) 기준.
    const payload: AdminProjectPayload = {
      title: "폴리핏",
      teamName: "TEAM A",
      semester: "2026-FALL",
      isFeatured: false,
      fileId: 501,
      festaEntry: true,
      festaOrder: 1,
      galleryFileIds: [12, 11],
      descriptionImageFileIds: [21],
      oneLiner: null,
      progressStatus: "LIVE",
      playStoreUrl: null,
      appStoreUrl: null,
    };
    const response = {
      id: 7,
      galleryFileIds: [12, 11],
      galleryImageUrls: ["https://cdn/12.png", "https://cdn/11.png"],
    };

    const { result, config } = await withAdapter(response, () => updateProject(7, payload));

    expect(config.method).toBe("put");
    expect(config.url).toBe("/api/admin/projects/7");
    expect(body(config)).toMatchObject({
      galleryFileIds: [12, 11],
      descriptionImageFileIds: [21],
      oneLiner: null,
      progressStatus: "LIVE",
      playStoreUrl: null,
      appStoreUrl: null,
    });
    expect(result.galleryImageUrls).toEqual(["https://cdn/12.png", "https://cdn/11.png"]);
  });
});

describe("submitProject (#382)", () => {
  it("부원 등록에 galleryFileIds 를 순서대로 싣는다", async () => {
    const payload: ProjectSubmitPayload = { title: "폴리핏", semester: "2026-FALL", galleryFileIds: [31, 30] };

    const { config } = await withAdapter({ id: 9 }, () => submitProject(payload));

    expect(config.url).toBe("/api/member/projects");
    expect(body(config)).toMatchObject({ galleryFileIds: [31, 30] });
  });
});
