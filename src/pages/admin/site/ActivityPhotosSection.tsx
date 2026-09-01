import { useState } from "react";

import { Button } from "../../../components/ui/Button/Button";
import { Input } from "../../../components/ui/Input/Input";
import { ErrorState, TextSkeleton } from "../../../components/ui/states/States";
import { siteErrorMessage, siteSaveErrorMessage } from "../../../errors/site/errorMessages";
import { useActivityPhotos, useDeleteActivityPhoto, useSaveActivityPhoto } from "../../../hooks/site/useContent";
import type { ActivityPhoto, ActivityPhotoPayload } from "../../../types/site";

import { ActivityPhotoField } from "./ActivityPhotoField";
import styles from "./StaffsSection.module.scss";

interface Draft {
  id: number | null;
  fileId: number | null;
  imageUrl: string | null;
  order: string;
  isVisible: boolean;
}

function emptyDraft(nextOrder: number): Draft {
  return { id: null, fileId: null, imageUrl: null, order: String(nextOrder), isVisible: true };
}

function toDraft(photo: ActivityPhoto): Draft {
  return {
    id: photo.id,
    fileId: photo.fileId,
    imageUrl: photo.imageUrl,
    order: String(photo.order),
    isVisible: photo.isVisible,
  };
}

function invalidReason(draft: Draft): string | null {
  if (draft.fileId === null) return "사진을 올려 주세요.";
  const order = Number(draft.order);
  if (!Number.isInteger(order) || order < 1) return "순서는 1 이상의 정수여야 합니다.";
  return null;
}

interface FormProps {
  draft: Draft;
  onClose: () => void;
}

/** 추가와 수정이 같은 폼을 쓴다. `id` 가 `null` 이면 추가다. */
function ActivityPhotoForm({ draft: initial, onClose }: FormProps) {
  const [draft, setDraft] = useState(initial);
  const save = useSaveActivityPhoto();

  const reason = invalidReason(draft);
  const set = (patch: Partial<Draft>) => setDraft((prev) => ({ ...prev, ...patch }));

  function handleSave() {
    if (draft.fileId === null) return;
    const payload: ActivityPhotoPayload = {
      fileId: draft.fileId,
      isVisible: draft.isVisible,
      order: Number(draft.order),
    };
    save.mutate({ id: draft.id, payload }, { onSuccess: onClose });
  }

  return (
    <div className={styles.form}>
      <ActivityPhotoField currentUrl={draft.imageUrl} onFileIdChange={(fileId) => set({ fileId })} />

      <div className={styles.formGrid}>
        {/* 별도 순서 변경 엔드포인트가 없다 — 여기서 직접 정하면 서버가 그 사이로 끼워 넣는다. */}
        <Input label="순서 *" type="number" value={draft.order} onChange={(order) => set({ order })} />
      </div>

      <label className={styles.checkbox}>
        <input type="checkbox" checked={draft.isVisible} onChange={(e) => set({ isVisible: e.target.checked })} />
        공개 사이트에 노출
      </label>

      <div className={styles.formFooter}>
        {/* 저장을 막는 이유를 미리 보여준다. 눌러 보고 알게 하지 않는다. */}
        {reason !== null && (
          <p role="status" className={styles.reason}>
            {reason}
          </p>
        )}
        {save.error !== null && (
          <p role="alert" className={styles.reason}>
            {siteSaveErrorMessage(save.error)}
          </p>
        )}
        <Button variant="secondary" onClick={onClose} disabled={save.isPending}>
          취소
        </Button>
        <Button disabled={reason !== null || save.isPending} onClick={handleSave}>
          {draft.id === null ? "추가" : "저장"}
        </Button>
      </div>
    </div>
  );
}

/** 홈 "GETIT과 함께한 순간들" 마퀴에 쓰이는 활동 사진. 개별 엔드포인트로 즉시 반영된다(BE#146). */
export function ActivityPhotosSection() {
  const { data, isPending, isError, error, refetch } = useActivityPhotos();
  const [editing, setEditing] = useState<Draft | null>(null);
  const remove = useDeleteActivityPhoto();

  function handleDelete(photo: ActivityPhoto) {
    if (!window.confirm(`이 활동 사진을 삭제할까요? 공개 사이트에서도 사라집니다.`)) return;
    remove.mutate(photo.id);
  }

  return (
    <section id="activity-photos" className={styles.section}>
      <h2 className={styles.sectionTitle}>활동 사진</h2>

      {isPending && <TextSkeleton lines={3} label="활동 사진 불러오는 중" />}
      {isError && <ErrorState message={siteErrorMessage(error)} onRetry={() => void refetch()} />}

      {data &&
        (data.length === 0 ? (
          <p className={styles.hint}>등록된 활동 사진이 없습니다.</p>
        ) : (
          <ul className={styles.staffs}>
            {data.map((photo) => (
              <li key={photo.id} className={styles.staff}>
                <div className={styles.info}>
                  <img src={photo.imageUrl} alt="" className={styles.thumbnail} />
                  <span className={styles.muted}>{photo.order}번째</span>
                  {!photo.isVisible && <span className={styles.muted}>(비공개)</span>}
                </div>
                <div className={styles.actions}>
                  <button type="button" onClick={() => setEditing(toDraft(photo))}>
                    수정
                  </button>
                  <button type="button" className={styles.danger} onClick={() => handleDelete(photo)}>
                    삭제
                  </button>
                </div>
              </li>
            ))}
          </ul>
        ))}

      <button type="button" className={styles.add} onClick={() => setEditing(emptyDraft((data?.length ?? 0) + 1))}>
        + 활동 사진 추가
      </button>

      {remove.error !== null && (
        <p role="alert" className={styles.reason}>
          {siteSaveErrorMessage(remove.error)}
        </p>
      )}

      {editing !== null && (
        <ActivityPhotoForm key={editing.id ?? "new"} draft={editing} onClose={() => setEditing(null)} />
      )}
    </section>
  );
}
