/**
 * 파일 업로드 타입. API 명세서 13.1 ~ 13.3.
 *
 * 업로드는 3단계다.
 * 1. `POST /files/presigned-url` → `fileId` + `uploadUrl`
 * 2. `PUT {uploadUrl}` (본문 = 파일) → S3 직접 업로드
 * 3. 도메인 리소스에 `fileIds: [501]` 로 연결
 *
 * **2단계까지만 하고 3단계가 오지 않은 파일은 `PENDING` 으로 남는다.** 서버가 24시간 뒤
 * 정리하므로, 올려 두고 저장하지 않아도 쓰레기가 쌓이지는 않는다.
 */
export type FilePurpose = "LECTURE_MATERIAL" | "ASSIGNMENT" | "PROFILE_IMAGE" | "PROJECT_THUMBNAIL";

/** 용도별 제한 (명세서 13.1). 서버도 막지만 눌러 보고 알게 하지 않는다. */
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
};

export interface PresignedUrlRequest {
  fileName: string;
  contentType: string;
  size: number;
  purpose: FilePurpose;
}

export interface PresignedUrl {
  fileId: number;
  uploadUrl: string;
  method: string;
  headers: Record<string, string>;
  expiresIn: number;
}

/** 업로드를 마친 파일. 아직 도메인에 연결되지 않은 상태다. */
export interface UploadedFile {
  fileId: number;
  fileName: string;
  size: number;
}
