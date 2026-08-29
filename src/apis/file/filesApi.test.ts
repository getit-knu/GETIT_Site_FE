import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { client } from "../client";

import { deleteFile, getDownloadUrl, uploadFile, uploadInvalidReason } from "./filesApi";

function file(name: string, bytes = 1024, type = "application/pdf"): File {
  const f = new File(["x"], name, { type });
  Object.defineProperty(f, "size", { value: bytes });
  return f;
}

const TICKET = {
  fileId: 501,
  uploadUrl: "https://storage.example/blob/abc?sig=xyz",
  method: "PUT",
  headers: { "x-ms-blob-type": "BlockBlob", "Content-Type": "application/pdf" },
  expiresIn: 600,
};

describe("uploadFile", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn());
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it("presigned URL 발급 → 저장소 PUT이 둘 다 성공하면 그 결과를 돌려준다", async () => {
    vi.spyOn(client, "post").mockResolvedValue({ data: TICKET });
    vi.mocked(fetch).mockResolvedValue({ ok: true } as Response);

    const result = await uploadFile(file("강의자료.pdf"), "LECTURE_MATERIAL");

    expect(result).toEqual({ fileId: 501, fileName: "강의자료.pdf", size: 1024 });
    expect(fetch).toHaveBeenCalledWith(TICKET.uploadUrl, {
      method: "PUT",
      headers: TICKET.headers,
      body: expect.any(File),
    });
  });

  it("이 환경이 직접 업로드를 지원하지 않으면(DIRECT_UPLOAD_NOT_SUPPORTED) multipart로 대신한다", async () => {
    const post = vi
      .spyOn(client, "post")
      .mockRejectedValueOnce({ code: "DIRECT_UPLOAD_NOT_SUPPORTED", message: "multipart 업로드를 사용하세요." })
      .mockResolvedValueOnce({
        data: {
          fileId: 502,
          originalName: "강의자료.pdf",
          url: "https://cdn/502",
          size: 1024,
          contentType: "application/pdf",
        },
      });

    const result = await uploadFile(file("강의자료.pdf"), "LECTURE_MATERIAL");

    expect(result).toEqual({ fileId: 502, fileName: "강의자료.pdf", size: 1024 });
    expect(post).toHaveBeenNthCalledWith(2, "/api/files?purpose=LECTURE_MATERIAL", expect.any(FormData), {
      headers: { "Content-Type": undefined },
    });
    expect(fetch).not.toHaveBeenCalled();
  });

  it("주소 발급은 됐는데 저장소 PUT 자체가 실패하면(CORS 등) multipart로 대신한다", async () => {
    vi.spyOn(client, "post")
      .mockResolvedValueOnce({ data: TICKET })
      .mockResolvedValueOnce({
        data: {
          fileId: 503,
          originalName: "강의자료.pdf",
          url: "https://cdn/503",
          size: 1024,
          contentType: "application/pdf",
        },
      });
    vi.mocked(fetch).mockRejectedValue(new TypeError("Failed to fetch"));

    const result = await uploadFile(file("강의자료.pdf"), "LECTURE_MATERIAL");

    expect(result).toEqual({ fileId: 503, fileName: "강의자료.pdf", size: 1024 });
  });

  it("확장자·용량이 아닌 다른 이유로 발급이 거절되면 그대로 실패한다(재시도하지 않는다)", async () => {
    vi.spyOn(client, "post").mockRejectedValue({
      code: "INVALID_FILE_EXTENSION",
      message: "허용되지 않은 확장자입니다.",
    });

    await expect(uploadFile(file("강의자료.exe"), "LECTURE_MATERIAL")).rejects.toEqual({
      code: "INVALID_FILE_EXTENSION",
      message: "허용되지 않은 확장자입니다.",
    });
    expect(fetch).not.toHaveBeenCalled();
  });
});

describe("uploadInvalidReason", () => {
  it("허용 확장자가 아니면 이유를 돌려준다", () => {
    expect(uploadInvalidReason(file("강의자료.exe"), "LECTURE_MATERIAL")).toContain("형식만 올릴 수 있습니다");
  });

  it("용량 제한을 넘으면 이유를 돌려준다", () => {
    expect(uploadInvalidReason(file("강의자료.pdf", 60 * 1024 * 1024), "LECTURE_MATERIAL")).toContain(
      "이하만 올릴 수 있습니다",
    );
  });

  it("문제 없으면 null이다", () => {
    expect(uploadInvalidReason(file("강의자료.pdf"), "LECTURE_MATERIAL")).toBeNull();
  });
});

describe("getDownloadUrl", () => {
  it("GET /api/files/{id}/download-url 을 호출한다", async () => {
    const get = vi.spyOn(client, "get").mockResolvedValue({
      data: {
        downloadUrl: "https://storage.example/blob/abc?sig=read",
        fileName: "강의자료.pdf",
        contentType: "application/pdf",
        expiresIn: 300,
      },
    });

    const result = await getDownloadUrl(501);

    expect(get).toHaveBeenCalledWith("/api/files/501/download-url");
    expect(result.downloadUrl).toBe("https://storage.example/blob/abc?sig=read");
  });
});

describe("deleteFile", () => {
  it("DELETE /api/files/{id} 을 호출한다", async () => {
    const del = vi.spyOn(client, "delete").mockResolvedValue({ data: undefined });

    await deleteFile(501);

    expect(del).toHaveBeenCalledWith("/api/files/501");
  });
});
