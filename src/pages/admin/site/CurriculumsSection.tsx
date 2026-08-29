import { useState } from "react";

import { Button } from "../../../components/ui/Button/Button";
import { Input } from "../../../components/ui/Input/Input";
import { ErrorState } from "../../../components/ui/states/States";
import { siteErrorMessage, siteSaveErrorMessage } from "../../../errors/site/errorMessages";
import { useCurriculums, useDeleteCurriculum, useSaveCurriculum } from "../../../hooks/site/useContent";
import type { Curriculum, CurriculumPayload } from "../../../types/site";

import styles from "./StaffsSection.module.scss";

interface Draft {
  id: number | null;
  order: string;
  title: string;
  subtitle: string;
}

function emptyDraft(nextOrder: number): Draft {
  return { id: null, order: String(nextOrder), title: "", subtitle: "" };
}

function toDraft(curriculum: Curriculum): Draft {
  return { id: curriculum.id, order: String(curriculum.order), title: curriculum.title, subtitle: curriculum.subtitle };
}

function invalidReason(draft: Draft): string | null {
  if (draft.title.trim() === "") return "제목을 입력해 주세요.";
  if (draft.subtitle.trim() === "") return "부제를 입력해 주세요.";
  const order = Number(draft.order);
  if (!Number.isInteger(order) || order < 1) return "순서는 1 이상의 정수여야 합니다.";
  return null;
}

interface FormProps {
  draft: Draft;
  generationId: number;
  onClose: () => void;
}

/** 추가와 수정이 같은 폼을 쓴다. `id` 가 `null` 이면 추가다. */
function CurriculumForm({ draft: initial, generationId, onClose }: FormProps) {
  const [draft, setDraft] = useState(initial);
  const save = useSaveCurriculum();

  const reason = invalidReason(draft);
  const set = (patch: Partial<Draft>) => setDraft((prev) => ({ ...prev, ...patch }));

  function handleSave() {
    const payload: CurriculumPayload = {
      generationId,
      title: draft.title.trim(),
      subtitle: draft.subtitle.trim(),
      order: Number(draft.order),
    };
    save.mutate({ id: draft.id, payload }, { onSuccess: onClose });
  }

  return (
    <div className={styles.form}>
      <div className={styles.formGrid}>
        <Input label="제목 *" value={draft.title} onChange={(title) => set({ title })} />
        <Input label="부제 *" value={draft.subtitle} onChange={(subtitle) => set({ subtitle })} />
        {/* 별도 순서 변경 엔드포인트가 없다 — 여기서 직접 정하면 서버가 그 사이로 끼워 넣는다. */}
        <Input label="순서 *" type="number" value={draft.order} onChange={(order) => set({ order })} />
      </div>

      <div className={styles.formFooter}>
        {reason !== null && <p className={styles.reason}>{reason}</p>}
        {save.error !== null && <p className={styles.reason}>{siteSaveErrorMessage(save.error)}</p>}
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

/** 커리큘럼. 개별 엔드포인트로 즉시 반영된다. */
export function CurriculumsSection({ generationId }: { generationId: number }) {
  const { data, isPending, isError, error, refetch } = useCurriculums();
  const [editing, setEditing] = useState<Draft | null>(null);
  const remove = useDeleteCurriculum();

  function handleDelete(curriculum: Curriculum) {
    if (!window.confirm(`"${curriculum.title}" 커리큘럼을 삭제할까요?`)) return;
    remove.mutate(curriculum.id);
  }

  return (
    <section id="curriculums" className={styles.section}>
      <h2 className={styles.sectionTitle}>커리큘럼</h2>

      {isPending && <p className={styles.hint}>불러오는 중…</p>}
      {isError && <ErrorState message={siteErrorMessage(error)} onRetry={() => void refetch()} />}

      {data &&
        (data.length === 0 ? (
          <p className={styles.hint}>등록된 커리큘럼이 없습니다.</p>
        ) : (
          <ul className={styles.staffs}>
            {data.map((curriculum) => (
              <li key={curriculum.id} className={styles.staff}>
                <div className={styles.info}>
                  <strong>{curriculum.title}</strong>
                  <span className={styles.muted}>{curriculum.subtitle}</span>
                </div>
                <div className={styles.actions}>
                  <button type="button" onClick={() => setEditing(toDraft(curriculum))}>
                    수정
                  </button>
                  <button type="button" className={styles.danger} onClick={() => handleDelete(curriculum)}>
                    삭제
                  </button>
                </div>
              </li>
            ))}
          </ul>
        ))}

      {data && (
        <button type="button" className={styles.add} onClick={() => setEditing(emptyDraft(data.length + 1))}>
          + 커리큘럼 추가
        </button>
      )}

      {remove.error !== null && <p className={styles.reason}>{siteSaveErrorMessage(remove.error)}</p>}

      {editing !== null && (
        <CurriculumForm
          key={editing.id ?? "new"}
          draft={editing}
          generationId={generationId}
          onClose={() => setEditing(null)}
        />
      )}
    </section>
  );
}
