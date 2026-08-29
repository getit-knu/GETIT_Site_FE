import type { ApiErrorPayload } from "../client";
import { client } from "../client";
import type {
  DownloadUrl,
  FilePurpose,
  MultipartUploadResult,
  PresignedUrl,
  PresignedUrlRequest,
  UploadedFile,
} from "../../types/file";
import { PURPOSE_LIMITS } from "../../types/file";

/** `POST /api/files/presigned-url` */
async function createPresignedUrl(request: PresignedUrlRequest): Promise<PresignedUrl> {
  const { data } = await client.post<PresignedUrl>("/api/files/presigned-url", request);
  return data;
}

/**
 * `PUT {uploadUrl}` — 저장소로 직접 올린다.
 *
 * 우리 서버가 아니라 저장소(Azure Blob 등)로 바로 나가는 요청이라 `client` 를 쓰지 않는다.
 * 우리 서비스의 Authorization 헤더를 실어 보내면 안 되고, 티켓이 요구하는 헤더만 그대로 붙인다.
 */
async function putToStorage(ticket: PresignedUrl, file: File): Promise<void> {
  const response = await fetch(ticket.uploadUrl, {
    method: ticket.method,
    headers: ticket.headers,
    body: file,
  });
  if (!response.ok) {
    throw new Error(`storage upload failed: ${response.status}`);
  }
}

/** `POST /api/files`(multipart) — presigned 방식을 못 쓰는 환경(로컬 등)의 대체 경로. */
async function uploadMultipart(file: File, purpose: FilePurpose): Promise<UploadedFile> {
  const form = new FormData();
  form.append("file", file);

  const { data } = await client.post<MultipartUploadResult>(
    `/api/files?purpose=${purpose}`,
    form,
    // Content-Type 을 비워야 브라우저가 실제 폼 데이터를 보고 boundary 를 채워 넣는다.
    // "multipart/form-data" 를 직접 넣으면 boundary 가 빠져 서버가 파싱하지 못한다.
    { headers: { "Content-Type": undefined } },
  );
  return { fileId: data.fileId, fileName: data.originalName, size: data.size };
}

function isDirectUploadNotSupported(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    (error as Partial<ApiErrorPayload>).code === "DIRECT_UPLOAD_NOT_SUPPORTED"
  );
}

function extensionOf(fileName: string): string {
  const at = fileName.lastIndexOf(".");
  return at === -1 ? "" : fileName.slice(at + 1).toLowerCase();
}

/**
 * 서버가 거절할 파일을 미리 걸러낸다 (명세서 13.1 표).
 *
 * 올리기 시작한 뒤에 거절당하면 기다린 시간이 헛되고, 무엇이 문제인지도 늦게 안다.
 * 거를 이유가 없으면 `null`.
 */
export function uploadInvalidReason(file: File, purpose: FilePurpose): string | null {
  const limit = PURPOSE_LIMITS[purpose];
  const extension = extensionOf(file.name);

  if (!limit.extensions.includes(extension)) {
    return `${limit.extensions.join(", ")} 형식만 올릴 수 있습니다.`;
  }
  if (file.size > limit.maxBytes) {
    return `${Math.floor(limit.maxBytes / 1024 / 1024)}MB 이하만 올릴 수 있습니다.`;
  }
  return null;
}

/**
 * 업로드. presigned URL 방식(1. 주소 발급 → 2. 저장소로 직접 PUT)을 먼저 시도한다.
 *
 * 이 환경이 직접 업로드를 지원하지 않으면(BE 가 `DIRECT_UPLOAD_NOT_SUPPORTED` 로 알려줌 —
 * 로컬처럼 Azure 저장소가 꺼진 환경) `POST /api/files`(multipart) 로 대신한다. 주소는
 * 받았는데 저장소로의 PUT 자체가 실패해도(CORS 미설정 등) 같은 이유로 이 경로로 넘어간다.
 *
 * 도메인 연결(3단계, `fileId` 를 저장 요청에 실어 보내는 것)은 하지 않는다. 저장 버튼을
 * 눌러야 `fileId` 로 함께 나간다.
 */
export async function uploadFile(file: File, purpose: FilePurpose): Promise<UploadedFile> {
  let ticket: PresignedUrl;
  try {
    ticket = await createPresignedUrl({ fileName: file.name, contentType: file.type, size: file.size, purpose });
  } catch (error) {
    if (isDirectUploadNotSupported(error)) return uploadMultipart(file, purpose);
    throw error;
  }

  try {
    await putToStorage(ticket, file);
    return { fileId: ticket.fileId, fileName: file.name, size: file.size };
  } catch {
    return uploadMultipart(file, purpose);
  }
}

/** `GET /api/files/{id}/download-url` */
export async function getDownloadUrl(fileId: number): Promise<DownloadUrl> {
  const { data } = await client.get<DownloadUrl>(`/api/files/${fileId}/download-url`);
  return data;
}

/** `DELETE /api/files/{id}` */
export async function deleteFile(fileId: number): Promise<void> {
  await client.delete(`/api/files/${fileId}`);
}
