import { useState } from "react";

import { lectureErrorMessage, lectureSaveErrorMessage } from "../../errors/lecture/errorMessages";
import { useLectureDetail, useSaveLecture } from "../../hooks/lecture/useLectures";
import type { LectureDetail, LectureFile, LecturePayload, Track } from "../../types/lecture";
import { Button } from "../ui/Button/Button";
import { Modal, ModalBody, ModalFooter, ModalHeader } from "../ui/Modal/Modal";
import { Select } from "../ui/Select/Select";
import { ErrorState } from "../ui/states/States";

import styles from "./LectureFormModal.module.scss";

/** 입력 중에는 빈 칸을 허용해야 지우고 다시 칠 수 있다. 숫자도 문자열로 든다. */
interface Draft {
  trackId: number;
  subCategoryId: number;
  week: string;
  title: string;
  description: string;
  youtubeUrl: string;
  materialUrl: string;
  durationMinutes: string;
  isPublished: boolean;
  fileIds: number[];
  hasAssignment: boolean;
  assignmentTitle: string;
  assignmentDescription: string;
  assignmentDeadline: string;
}

function emptyDraft(trackId: number): Draft {
  return {
    trackId,
    subCategoryId: 0,
    week: "",
    title: "",
    description: "",
    youtubeUrl: "",
    materialUrl: "",
    durationMinutes: "",
    isPublished: false,
    fileIds: [],
    hasAssignment: false,
    assignmentTitle: "",
    assignmentDescription: "",
    assignmentDeadline: "",
  };
}

function toDraft(detail: LectureDetail): Draft {
  return {
    trackId: detail.trackId,
    // 0 은 화면에서 쓰는 '없음' 값이다. 서버에는 null 로 보낸다.
    subCategoryId: detail.subCategoryId ?? 0,
    week: String(detail.week),
    title: detail.title,
    description: detail.description,
    youtubeUrl: detail.youtubeUrl,
    materialUrl: detail.materialUrl,
    durationMinutes: detail.durationMinutes === null ? "" : String(detail.durationMinutes),
    isPublished: detail.isPublished,
    fileIds: detail.files.map((f) => f.fileId),
    hasAssignment: detail.assignment !== null,
    assignmentTitle: detail.assignment?.title ?? "",
    assignmentDescription: detail.assignment?.description ?? "",
    assignmentDeadline: detail.assignment?.deadline ?? "",
  };
}

/** URL 형식은 서버도 검증한다(명세서 8.2). 눌러 보고 알게 하지 않는다. */
function isBadUrl(value: string): boolean {
  if (value.trim() === "") return false;
  try {
    new URL(value);
    return false;
  } catch {
    return true;
  }
}

function invalidReason(draft: Draft): string | null {
  if (draft.title.trim() === "") return "제목을 입력해 주세요.";

  const week = Number(draft.week);
  if (!Number.isInteger(week) || week < 1) return "주차는 1 이상의 정수여야 합니다.";

  if (isBadUrl(draft.youtubeUrl)) return "유튜브 URL 형식이 올바르지 않습니다.";
  if (isBadUrl(draft.materialUrl)) return "강의 자료 URL 형식이 올바르지 않습니다.";

  if (draft.durationMinutes !== "" && Number(draft.durationMinutes) <= 0) {
    return "재생 시간은 1분 이상이어야 합니다.";
  }

  if (draft.hasAssignment) {
    if (draft.assignmentTitle.trim() === "") return "과제 제목을 입력해 주세요.";
    if (draft.assignmentDeadline === "") return "과제 마감 기한을 입력해 주세요.";
  }
  return null;
}

function toPayload(draft: Draft): LecturePayload {
  return {
    trackId: draft.trackId,
    subCategoryId: draft.subCategoryId === 0 ? null : draft.subCategoryId,
    week: Number(draft.week),
    title: draft.title.trim(),
    description: draft.description,
    youtubeUrl: draft.youtubeUrl.trim(),
    materialUrl: draft.materialUrl.trim(),
    durationMinutes: draft.durationMinutes === "" ? null : Number(draft.durationMinutes),
    isPublished: draft.isPublished,
    fileIds: draft.fileIds,
    // 과제가 없는 강의는 null 이다(명세서 8.2).
    assignment: draft.hasAssignment
      ? {
          title: draft.assignmentTitle.trim(),
          description: draft.assignmentDescription,
          deadline: draft.assignmentDeadline,
        }
      : null,
  };
}

interface FormProps {
  lectureId: number | null;
  tracks: Track[];
  initial: Draft;
  files: LectureFile[];
  onClose: () => void;
}

/** 상세가 도착한 뒤에만 마운트한다. 그래야 `useState` 초기값으로 기존 값을 넣을 수 있다. */
function LectureForm({ lectureId, tracks, initial, files, onClose }: FormProps) {
  const [draft, setDraft] = useState<Draft>(initial);
  const save = useSaveLecture(lectureId);

  const reason = invalidReason(draft);
  const set = (patch: Partial<Draft>) => setDraft((prev) => ({ ...prev, ...patch }));

  // 소분류는 트랙에 딸려 있다. 트랙을 바꾸면 남아 있던 소분류가 다른 트랙 것이 된다.
  const subCategories = tracks.find((t) => t.id === draft.trackId)?.subCategories ?? [];

  return (
    <>
      <ModalBody>
        <div className={styles.grid}>
          <label className={styles.field}>
            <span>트랙 *</span>
            <Select
              ariaLabel="트랙"
              value={draft.trackId}
              options={tracks.map((t) => ({ value: t.id, label: t.name }))}
              onChange={(trackId: number) => set({ trackId, subCategoryId: 0 })}
            />
          </label>

          <label className={styles.field}>
            <span>소분류</span>
            <Select
              ariaLabel="소분류"
              value={draft.subCategoryId}
              options={[
                { value: 0, label: subCategories.length === 0 ? "없음" : "선택 안 함" },
                ...subCategories.map((s) => ({ value: s.id, label: s.name })),
              ]}
              onChange={(subCategoryId: number) => set({ subCategoryId })}
            />
          </label>

          <label className={styles.field}>
            <span>주차 *</span>
            <input type="number" min={1} value={draft.week} onChange={(e) => set({ week: e.target.value })} />
          </label>

          <label className={styles.field}>
            <span>재생 시간(분)</span>
            <input
              type="number"
              min={1}
              value={draft.durationMinutes}
              onChange={(e) => set({ durationMinutes: e.target.value })}
            />
          </label>
        </div>

        <label className={styles.field}>
          <span>제목 *</span>
          <input value={draft.title} onChange={(e) => set({ title: e.target.value })} />
        </label>

        <label className={styles.field}>
          <span>설명 (Markdown)</span>
          <textarea rows={4} value={draft.description} onChange={(e) => set({ description: e.target.value })} />
        </label>

        <div className={styles.grid}>
          <label className={styles.field}>
            <span>유튜브 URL</span>
            <input value={draft.youtubeUrl} onChange={(e) => set({ youtubeUrl: e.target.value })} />
          </label>
          <label className={styles.field}>
            <span>강의 자료 URL</span>
            <input value={draft.materialUrl} onChange={(e) => set({ materialUrl: e.target.value })} />
          </label>
        </div>

        <div className={styles.field}>
          <span>첨부 파일</span>
          {files.length === 0 ? (
            <p className={styles.hint}>첨부된 파일이 없습니다.</p>
          ) : (
            <ul className={styles.files}>
              {files.map((file) => (
                <li key={file.fileId} className={draft.fileIds.includes(file.fileId) ? "" : styles.removed}>
                  <span>{file.displayName}</span>
                  <button
                    type="button"
                    onClick={() =>
                      set({
                        fileIds: draft.fileIds.includes(file.fileId)
                          ? draft.fileIds.filter((id) => id !== file.fileId)
                          : [...draft.fileIds, file.fileId],
                      })
                    }
                  >
                    {draft.fileIds.includes(file.fileId) ? "제거" : "되돌리기"}
                  </button>
                </li>
              ))}
            </ul>
          )}
          {/*
            새 파일 업로드는 명세서 13.1 · 13.2 로 먼저 올린 뒤 fileIds 를 넘기는 구조다.
            file 도메인이 아직 없어 이 화면에서는 기존 첨부를 빼는 것만 된다.
            TODO: 파일 업로드 이슈가 끝나면 업로드 버튼을 붙인다.
          */}
          <p className={styles.hint}>새 파일 업로드는 파일 업로드 기능이 붙은 뒤에 지원됩니다.</p>
        </div>

        <label className={styles.checkbox}>
          <input type="checkbox" checked={draft.isPublished} onChange={(e) => set({ isPublished: e.target.checked })} />
          부원에게 공개
        </label>

        <label className={styles.checkbox}>
          <input
            type="checkbox"
            checked={draft.hasAssignment}
            onChange={(e) => set({ hasAssignment: e.target.checked })}
          />
          과제 있음
        </label>

        {draft.hasAssignment && (
          <div className={styles.assignment}>
            <label className={styles.field}>
              <span>과제 제목 *</span>
              <input value={draft.assignmentTitle} onChange={(e) => set({ assignmentTitle: e.target.value })} />
            </label>
            <label className={styles.field}>
              <span>과제 설명 (Markdown)</span>
              <textarea
                rows={3}
                value={draft.assignmentDescription}
                onChange={(e) => set({ assignmentDescription: e.target.value })}
              />
            </label>
            <label className={styles.field}>
              <span>마감 기한 *</span>
              <input
                type="datetime-local"
                value={draft.assignmentDeadline}
                onChange={(e) => set({ assignmentDeadline: e.target.value })}
              />
            </label>
          </div>
        )}

        {/* 저장을 막는 이유를 미리 보여준다. 눌러 보고 알게 하지 않는다. */}
        {reason !== null && <p className={styles.reason}>{reason}</p>}
        {save.error !== null && <p className={styles.reason}>{lectureSaveErrorMessage(save.error)}</p>}
      </ModalBody>

      <ModalFooter>
        <Button variant="secondary" onClick={onClose} disabled={save.isPending}>
          취소
        </Button>
        <Button
          disabled={save.isPending || reason !== null}
          onClick={() => save.mutate(toPayload(draft), { onSuccess: onClose })}
        >
          {lectureId === null ? "강의 추가" : "저장"}
        </Button>
      </ModalFooter>
    </>
  );
}

interface LectureFormModalProps {
  /** `null` 이면 추가 모드다. */
  lectureId: number | null;
  tracks: Track[];
  onClose: () => void;
}

/** 와이어프레임 p13(추가) · p24(수정). 두 화면이 같은 폼을 쓴다. */
export function LectureFormModal({ lectureId, tracks, onClose }: LectureFormModalProps) {
  const { data, isPending, isError, error, refetch } = useLectureDetail(lectureId);
  const isEdit = lectureId !== null;

  return (
    <Modal isOpen onClose={onClose}>
      <ModalHeader title={isEdit ? "강의 수정" : "강의 추가"} onClose={onClose} />

      {isEdit && isPending && (
        <ModalBody>
          <p className={styles.hint}>불러오는 중…</p>
        </ModalBody>
      )}

      {isEdit && isError && (
        <ModalBody>
          <ErrorState message={lectureErrorMessage(error)} onRetry={() => void refetch()} />
        </ModalBody>
      )}

      {(!isEdit || data) && (
        <LectureForm
          lectureId={lectureId}
          tracks={tracks}
          initial={data ? toDraft(data) : emptyDraft(tracks[0]?.id ?? 0)}
          files={data?.files ?? []}
          onClose={onClose}
        />
      )}
    </Modal>
  );
}
