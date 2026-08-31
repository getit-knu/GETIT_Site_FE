import { useId, useState } from "react";

import { Button } from "../../components/ui/Button/Button";
import { Input } from "../../components/ui/Input/Input";
import { TextArea } from "../../components/ui/TextArea/TextArea";
import { ThumbnailField } from "../../components/project/ThumbnailField";
import { projectSaveErrorMessage } from "../../errors/project/errorMessages";
import { useSubmitProject } from "../../hooks/project/useMemberProjects";
import type { ProjectSubmitPayload } from "../../types/project";

import styles from "./ProjectSubmitForm.module.scss";

type Season = "SPRING" | "SUMMER" | "FALL" | "WINTER";

const SEASONS: { value: Season; label: string }[] = [
  { value: "SPRING", label: "봄" },
  { value: "SUMMER", label: "여름" },
  { value: "FALL", label: "가을" },
  { value: "WINTER", label: "겨울" },
];

interface Draft {
  title: string;
  year: string;
  season: Season;
  description: string;
  techStacksText: string;
  codeUrl: string;
  demoUrl: string;
  fileId: number | null;
}

function emptyDraft(): Draft {
  const now = new Date();
  return {
    title: "",
    year: String(now.getFullYear()),
    season: "SPRING",
    description: "",
    techStacksText: "",
    codeUrl: "",
    demoUrl: "",
    fileId: null,
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

  const year = Number(draft.year);
  if (!/^\d{4}$/.test(draft.year) || !Number.isInteger(year)) return "연도를 올바르게 입력해 주세요.";

  const stacks = techStacks(draft);
  if (stacks.length > 10) return "기술 스택은 최대 10개까지 입력할 수 있습니다.";
  if (stacks.some((s) => s.length > 40)) return "기술 스택은 항목당 40자 이내로 입력해 주세요.";

  if (isBadUrl(draft.codeUrl)) return "코드 저장소 URL 형식이 올바르지 않습니다.";
  if (isBadUrl(draft.demoUrl)) return "데모 URL 형식이 올바르지 않습니다.";

  return null;
}

function toPayload(draft: Draft): ProjectSubmitPayload {
  return {
    title: draft.title.trim(),
    semester: `${draft.year}-${draft.season}`,
    description: draft.description,
    techStacks: techStacks(draft),
    codeUrl: draft.codeUrl.trim(),
    demoUrl: draft.demoUrl.trim(),
    fileId: draft.fileId ?? undefined,
  };
}

/**
 * 조 명의 프로젝트 등록(BE#148). `teamName`·`isFeatured`·`order`는 서버가 정하므로
 * 입력칸이 없다 — 어드민 폼(`AdminProjectFormModal`)과 필드셋이 다른 이유다.
 *
 * 등록하면 `PENDING`(승인 대기)으로 시작해 어드민이 승인해야 공개된다. 등록 후
 * 상태를 다시 조회하는 화면은 없다(BE에 아직 그 조회 엔드포인트가 없음, `types/project`
 * 참고) — 등록 직후 안내 문구로 대신한다.
 */
export function ProjectSubmitForm() {
  const [draft, setDraft] = useState<Draft>(emptyDraft());
  const submit = useSubmitProject();
  const seasonSelectId = useId();

  const reason = invalidReason(draft);
  const set = (patch: Partial<Draft>) => setDraft((prev) => ({ ...prev, ...patch }));

  function handleSubmit() {
    submit.mutate(toPayload(draft), { onSuccess: () => setDraft(emptyDraft()) });
  }

  if (submit.isSuccess) {
    return (
      <div className={styles.form}>
        <p className={styles.success} role="status">
          등록했습니다. 관리자 승인 후 공개됩니다.
        </p>
        <Button variant="secondary" onClick={() => submit.reset()}>
          하나 더 등록
        </Button>
      </div>
    );
  }

  return (
    <div className={styles.form}>
      <div className={styles.grid}>
        <Input label="제목 *" value={draft.title} onChange={(title) => set({ title })} />
        <Input label="연도 *" type="number" value={draft.year} onChange={(year) => set({ year })} />
        <div className={styles.field}>
          <label htmlFor={seasonSelectId} className={styles.label}>
            학기
          </label>
          <select
            id={seasonSelectId}
            className={styles.select}
            value={draft.season}
            onChange={(e) => set({ season: e.target.value as Season })}
          >
            {SEASONS.map((season) => (
              <option key={season.value} value={season.value}>
                {season.label}
              </option>
            ))}
          </select>
        </div>
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

      <ThumbnailField currentUrl={null} onFileIdChange={(fileId) => set({ fileId })} />

      {reason !== null && <p className={styles.reason}>{reason}</p>}
      {submit.error !== null && <p className={styles.reason}>{projectSaveErrorMessage(submit.error)}</p>}

      <div className={styles.formFooter}>
        <Button disabled={reason !== null || submit.isPending} onClick={handleSubmit}>
          {submit.isPending ? "등록 중…" : "프로젝트 등록"}
        </Button>
      </div>
    </div>
  );
}
