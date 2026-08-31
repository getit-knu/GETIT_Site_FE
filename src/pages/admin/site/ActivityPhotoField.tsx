import { useState } from "react";

import { uploadFile, uploadInvalidReason } from "../../../apis/file/filesApi";
import { fileErrorMessage } from "../../../errors/file/errorMessages";

import styles from "./ActivityPhotoField.module.scss";

interface ActivityPhotoFieldProps {
  /** 기존에 등록된 사진 주소. 새로 고른 파일이 있으면 그 미리보기가 이걸 덮는다. */
  currentUrl: string | null;
  onFileIdChange: (fileId: number | null) => void;
}

/**
 * 활동 사진 업로드. `ThumbnailField`(프로젝트 썸네일)와 같은 흐름이지만 purpose가
 * `ACTIVITY_PHOTO`로 다르고, 새 등록은 반드시 사진이 있어야 한다(BE `fileId` 필수) —
 * 도메인이 갈려 있어 프로젝트 컴포넌트를 공용화하는 대신 이 화면 전용으로 따로 둔다.
 */
export function ActivityPhotoField({ currentUrl, onFileIdChange }: ActivityPhotoFieldProps) {
  // `null` = 아직 손대지 않음(기존 `currentUrl`을 보여준다). "제거"를 누르면 `undefined`로
  // 바꿔 currentUrl로 되돌아가지 않게 한다.
  const [preview, setPreview] = useState<string | null | undefined>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleUpload(file: File) {
    // 서버도 막지만, 다 올린 뒤에 거절당하면 기다린 시간이 헛되다.
    const reason = uploadInvalidReason(file, "ACTIVITY_PHOTO");
    if (reason !== null) {
      setError(reason);
      return;
    }

    setError(null);
    // 업로드 완료 전에도 고른 파일을 바로 보여준다 — 응답엔 미리보기용 URL이 없다.
    setPreview(URL.createObjectURL(file));
    setUploading(true);
    try {
      const result = await uploadFile(file, "ACTIVITY_PHOTO");
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
      <span className={styles.label}>사진 *</span>

      {displayUrl !== null ? (
        <div className={styles.preview}>
          <img src={displayUrl} alt="활동 사진" className={styles.image} />
          <button type="button" onClick={handleClear} disabled={uploading}>
            제거
          </button>
        </div>
      ) : (
        <p className={styles.hint}>등록된 사진이 없습니다.</p>
      )}

      <input
        type="file"
        aria-label="활동 사진 올리기"
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
