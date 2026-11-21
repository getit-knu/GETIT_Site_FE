import { useState } from "react";

import { uploadFile, uploadInvalidReason } from "../../apis/file/filesApi";
import { fileErrorMessage } from "../../errors/file/errorMessages";

import styles from "./GalleryField.module.scss";
import fieldStyles from "./ThumbnailField.module.scss";
import { GALLERY_MAX, type GalleryItem } from "./projectImages";

let nextKey = 0;

interface GalleryFieldProps {
  items: GalleryItem[];
  /**
   * 이전 값을 받아 다음 값을 돌려주는 함수로 바꾼다. 여러 장을 한꺼번에 올리면 끝나는 순서가 제각각이라,
   * 렌더 시점의 `items`로 덮어쓰면 먼저 끝난 장이 사라진다.
   */
  onChange: (update: (prev: GalleryItem[]) => GalleryItem[]) => void;
}

/**
 * 프로젝트 이미지(스크린샷 갤러리, #382). 최대 5장, 목록 순서가 곧 쇼케이스 노출 순서다.
 * `ThumbnailField`처럼 업로드 1·2단계만 하고, 저장을 눌러야 `galleryFileIds`로 프로젝트에 연결된다.
 */
export function GalleryField({ items, onChange }: GalleryFieldProps) {
  const [error, setError] = useState<string | null>(null);
  const remaining = GALLERY_MAX - items.length;

  async function uploadOne(file: File, key: string) {
    try {
      const result = await uploadFile(file, "PROJECT_IMAGE");
      onChange((prev) => prev.map((item) => (item.key === key ? { ...item, fileId: result.fileId } : item)));
    } catch (caught) {
      onChange((prev) => prev.filter((item) => item.key !== key));
      setError(`${file.name}: ${fileErrorMessage(caught)}`);
    }
  }

  function handleFiles(files: File[]) {
    // 서버도 막지만, 다 올린 뒤에 거절당하면 기다린 시간이 헛되다.
    const invalid = files.map((file) => ({ file, reason: uploadInvalidReason(file, "PROJECT_IMAGE") }));
    const firstInvalid = invalid.find((entry) => entry.reason !== null);
    const valid = invalid.filter((entry) => entry.reason === null).map((entry) => entry.file);
    const accepted = valid.slice(0, Math.max(remaining, 0));

    if (firstInvalid) setError(`${firstInvalid.file.name}: ${firstInvalid.reason}`);
    else if (accepted.length < valid.length)
      setError(`최대 ${GALLERY_MAX}장까지 올릴 수 있어 앞의 ${accepted.length}장만 올렸습니다.`);
    else setError(null);

    // 업로드 완료 전에도 고른 파일을 바로 보여준다 — 응답엔 미리보기용 URL이 없다.
    const added = accepted.map((file) => ({ file, key: `new-${nextKey++}`, url: URL.createObjectURL(file) }));
    if (added.length === 0) return;
    onChange((prev) => [...prev, ...added.map(({ key, url }) => ({ key, fileId: null, url }))]);
    for (const { file, key } of added) void uploadOne(file, key);
  }

  function move(index: number, offset: -1 | 1) {
    onChange((prev) => {
      const next = [...prev];
      const [item] = next.splice(index, 1);
      next.splice(index + offset, 0, item);
      return next;
    });
  }

  function remove(key: string) {
    onChange((prev) => prev.filter((item) => item.key !== key));
  }

  return (
    <div className={fieldStyles.field}>
      <span className={fieldStyles.label}>프로젝트 이미지</span>
      <p className={fieldStyles.hint}>
        서비스 화면을 최대 {GALLERY_MAX}장 올려 주세요. 가로 이미지(1600×900)를 권장하며, 앞에 둔 이미지가 먼저
        보입니다.
      </p>

      {items.length > 0 && (
        <ol className={styles.list}>
          {items.map((item, index) => {
            const order = `${index + 1}번째 이미지`;
            return (
              <li key={item.key} className={styles.item}>
                {item.url === null ? (
                  <div className={styles.image} aria-hidden="true" />
                ) : (
                  <img src={item.url} alt={`프로젝트 이미지 ${index + 1}`} className={styles.image} />
                )}
                {item.fileId === null && <span className={styles.uploading}>올리는 중…</span>}
                <div className={styles.controls}>
                  <button
                    type="button"
                    aria-label={`${order}를 앞으로`}
                    disabled={index === 0}
                    onClick={() => move(index, -1)}
                  >
                    ◀
                  </button>
                  <button
                    type="button"
                    aria-label={`${order}를 뒤로`}
                    disabled={index === items.length - 1}
                    onClick={() => move(index, 1)}
                  >
                    ▶
                  </button>
                  <button type="button" aria-label={`${order} 삭제`} onClick={() => remove(item.key)}>
                    삭제
                  </button>
                </div>
              </li>
            );
          })}
        </ol>
      )}

      <input
        type="file"
        multiple
        accept="image/png,image/jpeg,image/webp"
        aria-label="프로젝트 이미지 올리기"
        disabled={remaining <= 0}
        onChange={(e) => {
          const files = Array.from(e.target.files ?? []);
          // 같은 파일을 다시 골라도 change 가 오도록 값을 비운다.
          e.target.value = "";
          if (files.length > 0) handleFiles(files);
        }}
      />
      {remaining <= 0 && (
        <p className={fieldStyles.hint}>{GALLERY_MAX}장을 모두 채웠습니다. 바꾸려면 먼저 한 장을 삭제하세요.</p>
      )}

      {error !== null && (
        <p role="alert" className={fieldStyles.reason}>
          {error}
        </p>
      )}
    </div>
  );
}
