import { useState } from "react";

import { lectureErrorMessage, lectureSaveErrorMessage } from "../../errors/lecture/errorMessages";
import { useLectureDetail, useSaveLecture } from "../../hooks/lecture/useLectures";
import { toIso, toLocalInput } from "../../libs/datetimeLocalInput";
import type { LectureDetail, LectureFile, LecturePayload, SubmissionType, Track } from "../../types/lecture";
import { Button } from "../ui/Button/Button";
import { Input } from "../ui/Input/Input";
import { Modal, ModalBody, ModalFooter, ModalHeader } from "../ui/Modal/Modal";
import { Select } from "../ui/Select/Select";
import { ErrorState } from "../ui/states/States";
import { TextArea } from "../ui/TextArea/TextArea";

import { AttachmentsField } from "./AttachmentsField";
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
  /** 파일 · 링크 중 이 과제가 받을 제출 방식. 최소 하나는 있어야 한다. */
  allowedTypes: SubmissionType[];
  /** `LINK` 를 허용할 때만 쓴다(예: "구글 드라이브 링크"). */
  linkPlaceholder: string;
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
    allowedTypes: ["FILE"],
    linkPlaceholder: "",
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
    assignmentDeadline: detail.assignment ? toLocalInput(detail.assignment.deadline) : "",
    allowedTypes: detail.assignment?.allowedTypes ?? ["FILE"],
    linkPlaceholder: detail.assignment?.linkPlaceholder ?? "",
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
    if (draft.assignmentDescription.trim() === "") return "과제 설명을 입력해 주세요.";
    if (draft.assignmentDeadline === "") return "과제 마감 기한을 입력해 주세요.";
    // 형태가 어긋난 값(주소를 손으로 고친 경우 등)은 `toIso`가 빈 문자열을 돌려준다.
    if (toIso(draft.assignmentDeadline) === "") return "과제 마감 기한 형식이 올바르지 않습니다.";
    if (draft.allowedTypes.length === 0) return "과제 제출 방식을 하나 이상 선택해 주세요.";
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
          deadline: toIso(draft.assignmentDeadline),
          allowedTypes: draft.allowedTypes,
          linkPlaceholder: draft.allowedTypes.includes("LINK") ? draft.linkPlaceholder.trim() || null : null,
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
          <div className={styles.field}>
            <span className={styles.label}>트랙 *</span>
            <Select
              ariaLabel="트랙"
              value={draft.trackId}
              options={tracks.map((t) => ({ value: t.id, label: t.name }))}
              onChange={(trackId: number) => set({ trackId, subCategoryId: 0 })}
            />
          </div>

          <div className={styles.field}>
            <span className={styles.label}>소분류</span>
            <Select
              ariaLabel="소분류"
              value={draft.subCategoryId}
              options={[
                { value: 0, label: subCategories.length === 0 ? "없음" : "선택 안 함" },
                ...subCategories.map((s) => ({ value: s.id, label: s.name })),
              ]}
              onChange={(subCategoryId: number) => set({ subCategoryId })}
            />
          </div>

          <Input label="주차 *" type="number" value={draft.week} onChange={(week) => set({ week })} />

          <Input
            label="재생 시간(분)"
            type="number"
            value={draft.durationMinutes}
            onChange={(durationMinutes) => set({ durationMinutes })}
          />
        </div>

        <Input label="제목 *" value={draft.title} onChange={(title) => set({ title })} />

        <TextArea label="설명 (Markdown)" value={draft.description} onChange={(description) => set({ description })} />

        <div className={styles.grid}>
          <Input label="유튜브 URL" value={draft.youtubeUrl} onChange={(youtubeUrl) => set({ youtubeUrl })} />
          <Input label="강의 자료 URL" value={draft.materialUrl} onChange={(materialUrl) => set({ materialUrl })} />
        </div>

        <AttachmentsField files={files} keptIds={draft.fileIds} onKeptIdsChange={(fileIds) => set({ fileIds })} />

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
            <Input
              label="과제 제목 *"
              value={draft.assignmentTitle}
              onChange={(assignmentTitle) => set({ assignmentTitle })}
            />
            <TextArea
              label="과제 설명 (Markdown) *"
              rows={3}
              value={draft.assignmentDescription}
              onChange={(assignmentDescription) => set({ assignmentDescription })}
            />
            <Input
              label="마감 기한 *"
              type="datetime-local"
              value={draft.assignmentDeadline}
              onChange={(assignmentDeadline) => set({ assignmentDeadline })}
            />

            <div className={styles.field}>
              <span className={styles.label}>제출 방식 *</span>
              <label className={styles.checkbox}>
                <input
                  type="checkbox"
                  checked={draft.allowedTypes.includes("FILE")}
                  onChange={(e) =>
                    set({
                      allowedTypes: e.target.checked
                        ? [...draft.allowedTypes, "FILE"]
                        : draft.allowedTypes.filter((t) => t !== "FILE"),
                    })
                  }
                />
                파일
              </label>
              <label className={styles.checkbox}>
                <input
                  type="checkbox"
                  checked={draft.allowedTypes.includes("LINK")}
                  onChange={(e) =>
                    set({
                      allowedTypes: e.target.checked
                        ? [...draft.allowedTypes, "LINK"]
                        : draft.allowedTypes.filter((t) => t !== "LINK"),
                    })
                  }
                />
                링크
              </label>
            </div>

            {draft.allowedTypes.includes("LINK") && (
              <Input
                label="링크 안내 문구"
                placeholder="예) 구글 드라이브 링크"
                value={draft.linkPlaceholder}
                onChange={(linkPlaceholder) => set({ linkPlaceholder })}
              />
            )}
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
          /*
            강의가 바뀌면 폼을 새로 만든다. 캐시에 이미 있는 강의로 옮기면 `data` 가
            곧바로 채워져 폼이 언마운트되지 않고, 앞 강의에서 고치던 값이 그대로 남아
            새 강의에 저장된다.
          */
          key={lectureId ?? "new"}
          initial={data ? toDraft(data) : emptyDraft(tracks[0]?.id ?? 0)}
          files={data?.files ?? []}
          onClose={onClose}
        />
      )}
    </Modal>
  );
}
