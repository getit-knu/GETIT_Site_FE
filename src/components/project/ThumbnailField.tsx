import { useState } from "react";

import { uploadFile, uploadInvalidReason } from "../../apis/file/filesApi";
import { fileErrorMessage } from "../../errors/file/errorMessages";

import styles from "./ThumbnailField.module.scss";

interface ThumbnailFieldProps {
  /** 기존에 등록된 썸네일 주소. 새로 고른 파일이 있으면 그 미리보기가 이걸 덮는다. */
  currentUrl: string | null;
  onFileIdChange: (fileId: number | null) => void;
}

/**
 * 프로젝트 썸네일. 명세서 13.1 업로드 흐름 1·2단계까지만 한다(`AttachmentsField`와 같은
 * 전제) — 저장을 눌러야 `fileId`로 프로젝트에 연결된다.
 *
 * **한 장만 허용한다** — 여러 장을 다루는 `AttachmentsField`와 달리 미리보기 하나만 보여준다.
 */
export function ThumbnailField({ currentUrl, onFileIdChange }: ThumbnailFieldProps) {
  // `null` = 아직 손대지 않음(기존 `currentUrl`을 보여준다). "제거"를 누르면 `undefined`로
  // 바꿔 currentUrl로 되돌아가지 않게 한다 — 이것도 없으면 지운 다음에도 displayUrl 이
  // 다시 currentUrl 로 떨어져 화면에서 안 지워진 것처럼 보인다.
  const [preview, setPreview] = useState<string | null | undefined>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleUpload(file: File) {
    // 서버도 막지만, 다 올린 뒤에 거절당하면 기다린 시간이 헛되다.
    const reason = uploadInvalidReason(file, "PROJECT_THUMBNAIL");
    if (reason !== null) {
      setError(reason);
      return;
    }

    setError(null);
    // 업로드 완료 전에도 고른 파일을 바로 보여준다 — 응답엔 미리보기용 URL이 없다.
    setPreview(URL.createObjectURL(file));
    setUploading(true);
    try {
      const result = await uploadFile(file, "PROJECT_THUMBNAIL");
      onFileIdChange(result.fileId);
    } catch (caught) {
      // 문구는 BE ErrorCode 에서 가져온다. FE 가 코드를 새로 짓지 않는다.
      setError(fileErrorMessage(caught));
      setPreview(null);
    } finally {
      setUploading(false);
    }
  }

  function handleClear() {
    setPreview(undefined);
    onFileIdChange(null);
  }

  const displayUrl = preview === undefined ? null : (preview ?? currentUrl);

  return (
    <div className={styles.field}>
      <span className={styles.label}>썸네일</span>

      {displayUrl !== null ? (
        <div className={styles.preview}>
          <img src={displayUrl} alt="프로젝트 썸네일" className={styles.image} />
          <button type="button" onClick={handleClear} disabled={uploading}>
            제거
          </button>
        </div>
      ) : (
        <p className={styles.hint}>등록된 썸네일이 없습니다.</p>
      )}

      <input
        type="file"
        aria-label="썸네일 올리기"
        disabled={uploading}
        onChange={(e) => {
          const file = e.target.files?.[0];
          // 같은 파일을 다시 골라도 change 가 오도록 값을 비운다.
          e.target.value = "";
          if (file) void handleUpload(file);
        }}
      />

      {uploading && <p className={styles.hint}>올리는 중…</p>}
      {error !== null && (
        <p role="alert" className={styles.reason}>
          {error}
        </p>
      )}
    </div>
  );
}
