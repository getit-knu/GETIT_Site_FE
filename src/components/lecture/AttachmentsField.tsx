import { useState } from "react";

import { uploadFile, uploadInvalidReason } from "../../apis/file/filesApi";
import { fileErrorMessage } from "../../errors/file/errorMessages";
import type { UploadedFile } from "../../types/file";
import type { LectureFile } from "../../types/lecture";

import styles from "./LectureFormModal.module.scss";

interface AttachmentsFieldProps {
  /** 이미 강의에 붙어 있는 첨부. */
  files: LectureFile[];
  /** 저장할 때 보낼 `fileIds`. 기존 것과 새로 올린 것이 함께 들어 있다. */
  keptIds: number[];
  onKeptIdsChange: (next: number[]) => void;
}

/**
 * 강의 첨부 파일. 명세서 8.2 의 `fileIds` 와 13.1 업로드 흐름.
 *
 * 업로드는 세 단계다 — 1) presigned URL 발급, 2) S3 로 직접 PUT, 3) 저장할 때 `fileIds` 로 연결.
 * **여기서는 1·2 단계까지만 한다.** 저장하지 않고 닫으면 올린 파일은 `PENDING` 으로 남고
 * 서버가 24시간 뒤 정리한다.
 */
export function AttachmentsField({ files, keptIds, onKeptIdsChange }: AttachmentsFieldProps) {
  const [uploaded, setUploaded] = useState<UploadedFile[]>([]);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleUpload(file: File) {
    // 서버도 막지만, 다 올린 뒤에 거절당하면 기다린 시간이 헛되다.
    const reason = uploadInvalidReason(file, "LECTURE_MATERIAL");
    if (reason !== null) {
      setError(reason);
      return;
    }

    setError(null);
    setUploading(true);
    try {
      const result = await uploadFile(file, "LECTURE_MATERIAL");
      setUploaded((prev) => [...prev, result]);
      onKeptIdsChange([...keptIds, result.fileId]);
    } catch (caught) {
      // 문구는 BE ErrorCode 에서 가져온다. FE 가 코드를 새로 짓지 않는다.
      setError(fileErrorMessage(caught));
    } finally {
      setUploading(false);
    }
  }

  function toggleExisting(fileId: number) {
    onKeptIdsChange(keptIds.includes(fileId) ? keptIds.filter((id) => id !== fileId) : [...keptIds, fileId]);
  }

  function removeUploaded(fileId: number) {
    setUploaded((prev) => prev.filter((f) => f.fileId !== fileId));
    onKeptIdsChange(keptIds.filter((id) => id !== fileId));
  }

  return (
    <div className={styles.field}>
      <span className={styles.label}>첨부 파일</span>

      {files.length === 0 && uploaded.length === 0 && <p className={styles.hint}>첨부된 파일이 없습니다.</p>}

      {files.length > 0 && (
        <ul className={styles.files}>
          {files.map((file) => (
            <li key={file.fileId} className={keptIds.includes(file.fileId) ? "" : styles.removed}>
              <span>{file.displayName}</span>
              <button type="button" onClick={() => toggleExisting(file.fileId)}>
                {keptIds.includes(file.fileId) ? "제거" : "되돌리기"}
              </button>
            </li>
          ))}
        </ul>
      )}

      {uploaded.length > 0 && (
        <ul className={styles.files}>
          {uploaded.map((file) => (
            <li key={file.fileId}>
              <span>{file.fileName}</span>
              <button type="button" onClick={() => removeUploaded(file.fileId)}>
                제거
              </button>
            </li>
          ))}
        </ul>
      )}

      <input
        type="file"
        aria-label="강의 자료 올리기"
        disabled={uploading}
        onChange={(e) => {
          const file = e.target.files?.[0];
          // 같은 파일을 다시 골라도 change 가 오도록 값을 비운다.
          e.target.value = "";
          if (file) void handleUpload(file);
        }}
      />

      {uploading && <p className={styles.hint}>올리는 중…</p>}
      {error !== null && <p className={styles.reason}>{error}</p>}
    </div>
  );
}
