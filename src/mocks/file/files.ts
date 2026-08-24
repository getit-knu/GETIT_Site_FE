import type { PresignedUrl, PresignedUrlRequest } from "../../types/file";
import { PURPOSE_LIMITS } from "../../types/file";

/**
 * 파일 업로드 목 (명세서 13.1 · 13.2).
 *
 * BE 에 file 도메인은 있지만 아직 붙이지 않았다. 화면을 먼저 만든다.
 */

let nextFileId = 900;

/**
 * 올려 둔 파일. 도메인(강의 등)이 `fileIds` 로 연결할 때 이름·크기를 되찾는 곳이다.
 *
 * 실제로는 서버가 파일 레코드를 들고 있다. 목에서도 같은 자리를 만들어 두지 않으면
 * 저장한 강의의 첨부가 이름 없이 사라져 화면이 거짓말을 한다.
 */
const uploads = new Map<number, { fileName: string; size: number }>();

/** 도메인 목이 `fileIds` 를 파일 정보로 되살릴 때 쓴다. */
export function lookupUpload(fileId: number): { fileName: string; size: number } | undefined {
  return uploads.get(fileId);
}
const delay = () => new Promise((r) => setTimeout(r, 300));

function extensionOf(fileName: string): string {
  const at = fileName.lastIndexOf(".");
  return at === -1 ? "" : fileName.slice(at + 1).toLowerCase();
}

export async function createPresignedUrl(request: PresignedUrlRequest): Promise<PresignedUrl> {
  await delay();

  // 화면이 거르지 않고 보내도 서버는 막는다. 화면 검증이 빠지면 여기서 걸린다.
  const limit = PURPOSE_LIMITS[request.purpose];
  if (!limit.extensions.includes(extensionOf(request.fileName))) {
    throw { code: "INVALID_FILE_EXTENSION", message: "올릴 수 없는 형식입니다." };
  }
  if (request.size > limit.maxBytes) {
    throw { code: "FILE_SIZE_EXCEEDED", message: "파일이 너무 큽니다." };
  }

  const fileId = nextFileId++;
  uploads.set(fileId, { fileName: request.fileName, size: request.size });
  return {
    fileId,
    uploadUrl: `https://s3.example.com/getit/tmp/${fileId}?X-Amz-Signature=mock`,
    method: "PUT",
    headers: { "Content-Type": request.contentType },
    expiresIn: 600,
  };
}

/** S3 로 바로 올리는 단계라 목에서는 기다리기만 한다. */
export async function putToStorage(): Promise<void> {
  await delay();
}
