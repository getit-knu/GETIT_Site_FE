import { useState } from "react";

import { Button } from "../ui/Button/Button";
import { Input } from "../ui/Input/Input";
import { Select } from "../ui/Select/Select";
import { Modal, ModalBody, ModalFooter, ModalHeader } from "../ui/Modal/Modal";
import { TextArea } from "../ui/TextArea/TextArea";
import { projectSaveErrorMessage } from "../../errors/project/errorMessages";
import { useSaveProject } from "../../hooks/project/useProjects";
import type { AdminProject, AdminProjectPayload } from "../../types/project";

import { ThumbnailField } from "./ThumbnailField";
import styles from "./AdminProjectFormModal.module.scss";

type Season = "SPRING" | "SUMMER" | "FALL" | "WINTER";

const SEASONS: { value: Season; label: string }[] = [
  { value: "SPRING", label: "봄" },
  { value: "SUMMER", label: "여름" },
  { value: "FALL", label: "가을" },
  { value: "WINTER", label: "겨울" },
];

interface Draft {
  id: number | null;
  title: string;
  teamName: string;
  year: string;
  season: Season;
  description: string;
  techStacksText: string;
  codeUrl: string;
  demoUrl: string;
  fileId: number | null;
  thumbnailUrl: string | null;
  isFeatured: boolean;
  order: string;
}

/** `semester`는 `2026-FALL` 형태 고정값이다(BE 검증). 화면은 연도 + 계절로 나눠 받는다. */
function parseSemester(semester: string): { year: string; season: Season } {
  const [year, season] = semester.split("-");
  const isSeason = (value: string | undefined): value is Season =>
    value === "SPRING" || value === "SUMMER" || value === "FALL" || value === "WINTER";
  return { year: year ?? "", season: isSeason(season) ? season : "SPRING" };
}

function emptyDraft(): Draft {
  const now = new Date();
  return {
    id: null,
    title: "",
    teamName: "",
    year: String(now.getFullYear()),
    season: "SPRING",
    description: "",
    techStacksText: "",
    codeUrl: "",
    demoUrl: "",
    fileId: null,
    thumbnailUrl: null,
    isFeatured: false,
    order: "",
  };
}

function toDraft(project: AdminProject): Draft {
  const { year, season } = parseSemester(project.semester);
  return {
    id: project.id,
    title: project.title,
    teamName: project.teamName,
    year,
    season,
    description: project.description,
    techStacksText: project.techStacks.join(", "),
    codeUrl: project.codeUrl,
    demoUrl: project.demoUrl,
    fileId: null,
    thumbnailUrl: project.thumbnailUrl === "" ? null : project.thumbnailUrl,
    isFeatured: project.isFeatured,
    order: String(project.order),
  };
}

/** 서버도 검증한다(명세서 12.2). 눌러 보고 알게 하지 않는다. */
function isBadUrl(value: string): boolean {
  if (value.trim() === "") return false;
  try {
    new URL(value);
    return false;
  } catch {
    return true;
  }
}

function techStacks(draft: Draft): string[] {
  return draft.techStacksText
    .split(",")
    .map((s) => s.trim())
    .filter((s) => s !== "");
}

function invalidReason(draft: Draft): string | null {
  if (draft.title.trim() === "") return "제목을 입력해 주세요.";
  if (draft.teamName.trim() === "") return "팀 이름을 입력해 주세요.";

  const year = Number(draft.year);
  if (!/^\d{4}$/.test(draft.year) || !Number.isInteger(year)) return "연도를 올바르게 입력해 주세요.";

  const stacks = techStacks(draft);
  if (stacks.length > 10) return "기술 스택은 최대 10개까지 입력할 수 있습니다.";
  if (stacks.some((s) => s.length > 40)) return "기술 스택은 항목당 40자 이내로 입력해 주세요.";

  if (isBadUrl(draft.codeUrl)) return "코드 저장소 URL 형식이 올바르지 않습니다.";
  if (isBadUrl(draft.demoUrl)) return "데모 URL 형식이 올바르지 않습니다.";

  if (draft.order.trim() !== "") {
    const order = Number(draft.order);
    if (!Number.isInteger(order) || order < 1) return "순서는 1 이상의 정수여야 합니다.";
  }

  return null;
}

/** 빈 문자열은 BE `@HttpUrl`(선택값, `null`은 통과하지만 `""`는 형식 위반으로 400)에 걸린다. */
function urlOrUndefined(value: string): string | undefined {
  return value.trim() === "" ? undefined : value.trim();
}

function toPayload(draft: Draft): AdminProjectPayload {
  return {
    title: draft.title.trim(),
    teamName: draft.teamName.trim(),
    semester: `${draft.year}-${draft.season}`,
    description: draft.description,
    techStacks: techStacks(draft),
    codeUrl: urlOrUndefined(draft.codeUrl),
    demoUrl: urlOrUndefined(draft.demoUrl),
    fileId: draft.fileId,
    isFeatured: draft.isFeatured,
    ...(draft.order.trim() === "" ? {} : { order: Number(draft.order) }),
  };
}

interface AdminProjectFormModalProps {
  /** `null` 이면 추가 모드다. */
  project: AdminProject | null;
  onClose: () => void;
}

/**
 * 어드민 프로젝트 관리 폼(#222). 추가와 수정이 같은 폼을 쓴다.
 *
 * 별도 상세 조회 엔드포인트가 없다 — 목록 행(`ProjectResultItem`)에 이미 편집에
 * 필요한 값이 다 있어, 목록에서 받은 값을 그대로 초기값으로 쓴다.
 */
export function AdminProjectFormModal({ project, onClose }: AdminProjectFormModalProps) {
  const [draft, setDraft] = useState<Draft>(project ? toDraft(project) : emptyDraft());
  const save = useSaveProject();

  const reason = invalidReason(draft);
  const set = (patch: Partial<Draft>) => setDraft((prev) => ({ ...prev, ...patch }));

  function handleSave() {
    save.mutate({ id: draft.id, payload: toPayload(draft) }, { onSuccess: onClose });
  }

  return (
    <Modal isOpen onClose={onClose}>
      <ModalHeader title={draft.id === null ? "프로젝트 추가" : "프로젝트 수정"} onClose={onClose} />

      <ModalBody>
        <div className={styles.grid}>
          <Input label="제목 *" value={draft.title} onChange={(title) => set({ title })} />
          <Input label="팀 이름 *" value={draft.teamName} onChange={(teamName) => set({ teamName })} />
          <Input label="연도 *" type="number" value={draft.year} onChange={(year) => set({ year })} />
          <div className={styles.field}>
            <span className={styles.label}>학기</span>
            <Select
              ariaLabel="학기"
              value={draft.season}
              options={SEASONS}
              onChange={(season: Season) => set({ season })}
            />
          </div>
          {/* 별도 순서 변경 엔드포인트가 없다 — 비우면 수정 시 기존 순서를 유지한다. */}
          <Input label="순서" type="number" value={draft.order} onChange={(order) => set({ order })} />
        </div>

        <TextArea label="설명" rows={3} value={draft.description} onChange={(description) => set({ description })} />

        <Input
          label="기술 스택 (쉼표로 구분)"
          value={draft.techStacksText}
          onChange={(techStacksText) => set({ techStacksText })}
        />

        <div className={styles.grid}>
          <Input label="코드 저장소 URL" value={draft.codeUrl} onChange={(codeUrl) => set({ codeUrl })} />
          <Input label="데모 URL" value={draft.demoUrl} onChange={(demoUrl) => set({ demoUrl })} />
        </div>

        <ThumbnailField currentUrl={draft.thumbnailUrl} onFileIdChange={(fileId) => set({ fileId })} />
        {/*
          BE 한계(getit-knu/GETIT_Site_BE#139): 수정 요청은 fileId 를 항상 통째로
          덮어써서, 목록 응답엔 없는 원본 fileId 를 화면이 다시 실어 보낼 방법이 없다.
          손대지 않아도 저장하면 지워지므로 미리 알린다.
        */}
        {draft.id !== null && draft.thumbnailUrl !== null && draft.fileId === null && (
          <p className={styles.hint}>썸네일을 다시 올리지 않고 저장하면 기존 썸네일이 사라집니다.</p>
        )}

        <label className={styles.checkbox}>
          <input type="checkbox" checked={draft.isFeatured} onChange={(e) => set({ isFeatured: e.target.checked })} />
          Home 화면에 소개
        </label>

        {reason !== null && (
          <p role="status" className={styles.reason}>
            {reason}
          </p>
        )}
        {save.error !== null && (
          <p role="alert" className={styles.reason}>
            {projectSaveErrorMessage(save.error)}
          </p>
        )}
      </ModalBody>

      <ModalFooter>
        <Button variant="secondary" onClick={onClose} disabled={save.isPending}>
          취소
        </Button>
        <Button disabled={reason !== null || save.isPending} onClick={handleSave}>
          {draft.id === null ? "추가" : "저장"}
        </Button>
      </ModalFooter>
    </Modal>
  );
}
