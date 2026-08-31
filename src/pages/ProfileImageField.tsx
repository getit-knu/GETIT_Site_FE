import { useState } from "react";

import { uploadFile, uploadInvalidReason } from "../apis/file/filesApi";
import { fileErrorMessage } from "../errors/file/errorMessages";

import styles from "./ProfileImageField.module.scss";

/** 이니셜 아바타. `Topbar`·`MyPage`와 같은 규칙(한글 이름은 성을 뺀 첫 글자). */
function initialOf(name: string): string {
  return name.trim().slice(0, 1) || "?";
}

interface ProfileImageFieldProps {
  name: string;
  /** 기존에 등록된 프로필 사진 주소. 새로 고른 파일이 있으면 그 미리보기가 이걸 덮는다. */
  currentUrl: string | null;
  onFileIdChange: (fileId: number | null) => void;
}

/**
 * 프로필 사진 업로드. `ThumbnailField`(프로젝트 썸네일)와 같은 흐름이지만 purpose가
 * `PROFILE_IMAGE`로 다르다 — 여러 도메인 화면에서 각자 전용으로 두는 이 프로젝트의
 * 관례를 따라 공용화하지 않고 `MyPage` 전용으로 둔다.
 *
 * **생략하면 기존 사진을 그대로 둔다**(#147) — "제거" 버튼이 따로 없다. 지우고
 * 싶다는 요구가 아직 없고, BE도 `profileFileId`를 `null`로 보내는 걸 "그대로 유지"로
 * 해석하지 "지워라"로 해석하지 않는다(Google 동기화 사진을 실수로 날리지 않으려는 설계).
 */
export function ProfileImageField({ name, currentUrl, onFileIdChange }: ProfileImageFieldProps) {
  const [preview, setPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleUpload(file: File) {
    // 서버도 막지만, 다 올린 뒤에 거절당하면 기다린 시간이 헛되다.
    const reason = uploadInvalidReason(file, "PROFILE_IMAGE");
    if (reason !== null) {
      setError(reason);
      return;
    }

    setError(null);
    // 업로드 완료 전에도 고른 파일을 바로 보여준다 — 응답엔 미리보기용 URL이 없다.
    setPreview(URL.createObjectURL(file));
    setUploading(true);
    try {
      const result = await uploadFile(file, "PROFILE_IMAGE");
      onFileIdChange(result.fileId);
    } catch (caught) {
      // 문구는 BE ErrorCode 에서 가져온다. FE 가 코드를 새로 짓지 않는다.
      setError(fileErrorMessage(caught));
      setPreview(null);
    } finally {
      setUploading(false);
    }
  }

  const displayUrl = preview ?? currentUrl;

  return (
    <div className={styles.field}>
      {displayUrl !== null ? (
        <img src={displayUrl} alt="프로필 사진" className={styles.avatar} />
      ) : (
        <span className={styles.avatar} aria-hidden="true">
          {initialOf(name)}
        </span>
      )}

      <div>
        <input
          type="file"
          aria-label="프로필 사진 올리기"
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
    </div>
  );
}
