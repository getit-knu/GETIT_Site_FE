import * as mock from "../../mocks/file/files";
import type { FilePurpose, PresignedUrl, PresignedUrlRequest, UploadedFile } from "../../types/file";
import { PURPOSE_LIMITS } from "../../types/file";

/**
 * 파일 업로드 API. 명세서 13.1 ~ 13.3.
 *
 * **아직 목 데이터를 돌려준다.** 연동 이슈에서 `mock.*` 만 `client.*` 로 바꾸면 된다.
 */

/** `POST /api/files/presigned-url` */
export const createPresignedUrl = (request: PresignedUrlRequest): Promise<PresignedUrl> =>
  mock.createPresignedUrl(request);

/** `PUT {uploadUrl}` — S3 로 직접 올린다. 우리 서버를 거치지 않아 인증 헤더가 붙으면 안 된다. */
export const putToStorage = (): Promise<void> => mock.putToStorage();

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
 * 업로드 두 단계(13.1 → S3 PUT)를 한 번에.
 *
 * 도메인 연결(3단계)은 하지 않는다. 저장 버튼을 눌러야 `fileIds` 로 함께 나간다.
 */
export async function uploadFile(file: File, purpose: FilePurpose): Promise<UploadedFile> {
  const presigned = await createPresignedUrl({
    fileName: file.name,
    contentType: file.type,
    size: file.size,
    purpose,
  });

  await putToStorage();

  return { fileId: presigned.fileId, fileName: file.name, size: file.size };
}
