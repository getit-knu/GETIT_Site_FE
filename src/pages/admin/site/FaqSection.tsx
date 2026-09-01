import { useState } from "react";

import { Button } from "../../../components/ui/Button/Button";
import { Input } from "../../../components/ui/Input/Input";
import { TextArea } from "../../../components/ui/TextArea/TextArea";
import { ErrorState, TextSkeleton } from "../../../components/ui/states/States";
import { siteErrorMessage, siteSaveErrorMessage } from "../../../errors/site/errorMessages";
import { useDeleteFaq, useFaqs, useSaveFaq } from "../../../hooks/site/useContent";
import type { Faq, FaqPayload } from "../../../types/site";

import styles from "./StaffsSection.module.scss";

interface Draft {
  id: number | null;
  order: string;
  question: string;
  answer: string;
  isVisible: boolean;
}

function emptyDraft(nextOrder: number): Draft {
  return { id: null, order: String(nextOrder), question: "", answer: "", isVisible: true };
}

function toDraft(faq: Faq): Draft {
  return { id: faq.id, order: String(faq.order), question: faq.question, answer: faq.answer, isVisible: faq.isVisible };
}

function invalidReason(draft: Draft): string | null {
  if (draft.question.trim() === "") return "질문을 입력해 주세요.";
  // 답이 없는 FAQ 는 공개 사이트에 빈칸으로 나간다.
  if (draft.answer.trim() === "") return "답변을 입력해 주세요.";
  const order = Number(draft.order);
  if (!Number.isInteger(order) || order < 1) return "순서는 1 이상의 정수여야 합니다.";
  return null;
}

interface FormProps {
  draft: Draft;
  onClose: () => void;
}

/** 추가와 수정이 같은 폼을 쓴다. `id` 가 `null` 이면 추가다. */
function FaqForm({ draft: initial, onClose }: FormProps) {
  const [draft, setDraft] = useState(initial);
  const save = useSaveFaq();

  const reason = invalidReason(draft);
  const set = (patch: Partial<Draft>) => setDraft((prev) => ({ ...prev, ...patch }));

  function handleSave() {
    const payload: FaqPayload = {
      question: draft.question.trim(),
      answer: draft.answer.trim(),
      isVisible: draft.isVisible,
      order: Number(draft.order),
    };
    save.mutate({ id: draft.id, payload }, { onSuccess: onClose });
  }

  return (
    <div className={styles.form}>
      <div className={styles.formGrid}>
        <Input label="질문 *" value={draft.question} onChange={(question) => set({ question })} />
        {/* 별도 순서 변경 엔드포인트가 없다 — 여기서 직접 정하면 서버가 그 사이로 끼워 넣는다. */}
        <Input label="순서 *" type="number" value={draft.order} onChange={(order) => set({ order })} />
      </div>
      <TextArea label="답변 *" rows={2} value={draft.answer} onChange={(answer) => set({ answer })} />

      <label className={styles.checkbox}>
        <input type="checkbox" checked={draft.isVisible} onChange={(e) => set({ isVisible: e.target.checked })} />
        공개 사이트에 노출
      </label>

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

/** FAQ. 와이어프레임 p10. 개별 엔드포인트로 즉시 반영된다. */
export function FaqSection() {
  const { data, isPending, isError, error, refetch } = useFaqs();
  const [editing, setEditing] = useState<Draft | null>(null);
  const remove = useDeleteFaq();

  function handleDelete(faq: Faq) {
    if (!window.confirm(`"${faq.question}" FAQ를 삭제할까요?`)) return;
    remove.mutate(faq.id);
  }

  return (
    <section id="faqs" className={styles.section}>
      <h2 className={styles.sectionTitle}>FAQ</h2>

      {isPending && <TextSkeleton lines={4} label="FAQ 불러오는 중" />}
      {isError && <ErrorState message={siteErrorMessage(error)} onRetry={() => void refetch()} />}

      {data &&
        (data.length === 0 ? (
          <p className={styles.hint}>등록된 FAQ가 없습니다.</p>
        ) : (
          <ul className={styles.staffs}>
            {data.map((faq) => (
              <li key={faq.id} className={styles.staff}>
                <div className={styles.info}>
                  <strong>{faq.question}</strong>
                  <span className={styles.muted}>{faq.answer}</span>
                  {!faq.isVisible && <span className={styles.muted}>(비공개)</span>}
                </div>
                <div className={styles.actions}>
                  <button type="button" onClick={() => setEditing(toDraft(faq))}>
                    수정
                  </button>
                  <button type="button" className={styles.danger} onClick={() => handleDelete(faq)}>
                    삭제
                  </button>
                </div>
              </li>
            ))}
          </ul>
        ))}

      <button type="button" className={styles.add} onClick={() => setEditing(emptyDraft((data?.length ?? 0) + 1))}>
        + FAQ 추가
      </button>

      {remove.error !== null && <p className={styles.reason}>{siteSaveErrorMessage(remove.error)}</p>}

      {editing !== null && <FaqForm key={editing.id ?? "new"} draft={editing} onClose={() => setEditing(null)} />}
    </section>
  );
}
