import type { components } from "../../apis/generated";

/**
 * 파일 업로드 타입. `apis/generated.ts`(BE OpenAPI 스펙)에서 재노출한다.
 *
 * 업로드는 3단계다.
 * 1. `POST /files/presigned-url` → `fileId` + `uploadUrl`
 * 2. `PUT {uploadUrl}` (본문 = 파일) → 저장소(Azure Blob)로 직접 업로드
 * 3. 도메인 리소스에 `fileId` 로 연결
 *
 * **2단계까지만 하고 3단계가 오지 않은 파일은 `PENDING` 으로 남는다.** 서버가 24시간 뒤
 * 정리하므로, 올려 두고 저장하지 않아도 쓰레기가 쌓이지는 않는다.
 *
 * **1단계가 이 환경에서 막혀 있으면(BE가 `DIRECT_UPLOAD_NOT_SUPPORTED` 로 알려줌 —
 * 로컬처럼 Azure 저장소가 꺼진 환경) `POST /files`(multipart) 로 대신한다.** 2단계(저장소
 * 직접 PUT) 자체가 실패해도(CORS 미설정 등) 같은 이유로 이 경로로 넘어간다.
 */
export type FilePurpose = components["schemas"]["PresignedUploadRequest"]["purpose"];

/** 용도별 제한 (명세서 13.1). BE `FilePurpose` enum 내부 값이라 스펙에 안 실려 손으로 유지한다. */
export interface PurposeLimit {
  maxBytes: number;
  extensions: string[];
}

export const PURPOSE_LIMITS: Record<FilePurpose, PurposeLimit> = {
  LECTURE_MATERIAL: {
    maxBytes: 50 * 1024 * 1024,
    extensions: ["pdf", "zip", "pptx", "docx", "hwp", "png", "jpg"],
  },
  ASSIGNMENT: {
    maxBytes: 50 * 1024 * 1024,
    extensions: ["zip", "pdf", "png", "jpg", "ipynb", "txt"],
  },
  PROFILE_IMAGE: { maxBytes: 5 * 1024 * 1024, extensions: ["png", "jpg", "jpeg", "webp"] },
  PROJECT_THUMBNAIL: { maxBytes: 5 * 1024 * 1024, extensions: ["png", "jpg", "jpeg", "webp"] },
  ACTIVITY_PHOTO: { maxBytes: 5 * 1024 * 1024, extensions: ["png", "jpg", "jpeg", "webp"] },
};

export type PresignedUrlRequest = components["schemas"]["PresignedUploadRequest"];

// 생성된 스키마는 응답 필드를 전부 `?`(optional)로 잡는다 — springdoc이 실제로 항상
// 채워주는 필드도 required 로 안 걷어준다. BE가 항상 채워 보내는 값이라 `Required` 로 다잡는다.
export type PresignedUrl = Required<components["schemas"]["PresignedUploadResponse"]>;

/** 업로드를 마친 파일. 아직 도메인에 연결되지 않은 상태다. */
export interface UploadedFile {
  fileId: number;
  fileName: string;
  size: number;
}

/** `POST /files`(multipart) 응답. presigned 방식을 못 쓰는 환경의 대체 경로. */
export type MultipartUploadResult = Required<components["schemas"]["FileUploadResponse"]>;

/** `GET /files/{id}/download-url` 응답. 비공개 저장소라 요청마다 짧게 사는 주소를 새로 받는다. */
export type DownloadUrl = Required<components["schemas"]["DownloadUrlResponse"]>;
