import { useEffect, useId, useRef, useState } from "react";

import { uploadFile, uploadInvalidReason } from "../../../apis/file/filesApi";
import { fileErrorMessage } from "../../../errors/file/errorMessages";
import { PURPOSE_LIMITS } from "../../../types/file";

import styles from "./StaffPhotoField.module.scss";

interface StaffPhotoFieldProps {
  /** 기존에 등록된 프로필 사진 주소. 새로 고른 파일이 있으면 그 미리보기가 이걸 덮는다. */
  currentUrl: string | null;
  onFileIdChange: (fileId: number | null) => void;
}

/** 브라우저 파일 선택 창에서도 미리 걸러 주도록 허용 확장자를 그대로 넘긴다(명세서 13.1). */
const ACCEPT = PURPOSE_LIMITS.PROFILE_IMAGE.extensions.map((it) => `.${it}`).join(",");

/**
 * 운영진 프로필 사진 업로드. `ActivityPhotoField`(활동 사진)와 같은 흐름이지만 purpose 가
 * `PROFILE_IMAGE` 로 다르고 **사진 없이도 저장할 수 있다**(BE `fileId` 선택) — 도메인이
 * 갈려 있어 공용화하는 대신 이 화면 전용으로 따로 둔다(이 프로젝트의 관례).
 */
export function StaffPhotoField({ currentUrl, onFileIdChange }: StaffPhotoFieldProps) {
  const inputId = useId();
  // `null` = 아직 손대지 않음(기존 `currentUrl` 을 보여준다). "제거" 를 누르면 `undefined` 로
  // 바꿔 currentUrl 로 되돌아가지 않게 한다.
  const [preview, setPreview] = useState<string | null | undefined>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // blob URL 은 명시적으로 해제하기 전까지 문서가 파일을 통째로 붙들고 있다. 사진을 여러 번
  // 바꾸거나 폼을 닫으면 앞서 고른 이미지들이 그대로 메모리에 쌓인다.
  const objectUrlRef = useRef<string | null>(null);

  function releaseObjectUrl() {
    if (objectUrlRef.current !== null) {
      URL.revokeObjectURL(objectUrlRef.current);
      objectUrlRef.current = null;
    }
  }

  useEffect(
    () => () => {
      if (objectUrlRef.current !== null) URL.revokeObjectURL(objectUrlRef.current);
    },
    [],
  );

  async function handleUpload(file: File) {
    // 서버도 막지만, 다 올린 뒤에 거절당하면 기다린 시간이 헛되다.
    const reason = uploadInvalidReason(file, "PROFILE_IMAGE");
    if (reason !== null) {
      setError(reason);
      return;
    }

    setError(null);
    // 업로드 완료 전에도 고른 파일을 바로 보여준다 — 응답엔 미리보기용 URL 이 없다.
    releaseObjectUrl();
    objectUrlRef.current = URL.createObjectURL(file);
    setPreview(objectUrlRef.current);
    setUploading(true);
    try {
      const result = await uploadFile(file, "PROFILE_IMAGE");
      onFileIdChange(result.fileId);
    } catch (caught) {
      // 문구는 BE ErrorCode 에서 가져온다. FE 가 코드를 새로 짓지 않는다.
      setError(fileErrorMessage(caught));
      releaseObjectUrl();
      setPreview(null);
    } finally {
      setUploading(false);
    }
  }

  function handleClear() {
    releaseObjectUrl();
    setPreview(undefined);
    onFileIdChange(null);
  }

  const displayUrl = preview === undefined ? null : (preview ?? currentUrl);

  return (
    <div className={styles.field}>
      {/* 라벨을 input 에 연결해 두면 라벨을 눌러도 파일 선택 창이 열린다. */}
      <label className={styles.label} htmlFor={inputId}>
        프로필 사진
      </label>

      {displayUrl !== null ? (
        <div className={styles.preview}>
          <img src={displayUrl} alt="프로필 사진" className={styles.avatar} />
          <button type="button" onClick={handleClear} disabled={uploading}>
            제거
          </button>
        </div>
      ) : (
        <p className={styles.hint}>등록된 사진이 없습니다. 올리지 않아도 저장할 수 있습니다.</p>
      )}

      <input
        id={inputId}
        type="file"
        accept={ACCEPT}
        disabled={uploading}
        onChange={(e) => {
          const file = e.target.files?.[0];
          // 같은 파일을 다시 골라도 change 가 오도록 값을 비운다.
          e.target.value = "";
          if (file) void handleUpload(file);
        }}
      />

      {uploading && <p className={styles.hint}>올리는 중…</p>}
      {/* 업로드는 시간이 걸려 화면을 보고 있지 않을 수 있다. 실패는 소리 내어 알린다. */}
      {error !== null && (
        <p className={styles.reason} role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
