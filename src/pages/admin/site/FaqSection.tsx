import { Input } from "../../../components/ui/Input/Input";
import { TextArea } from "../../../components/ui/TextArea/TextArea";
import type { Faq } from "../../../types/site";

import type { Draft } from "./faqDraft";
import { emptyFaq } from "./faqDraft";
import styles from "./FaqSection.module.scss";

interface FaqSectionProps {
  faqs: Draft<Faq>[];
  onChange: (next: Draft<Faq>[]) => void;
}

/** FAQ. 와이어프레임 p10. 아직 실제 엔드포인트가 없어 사이트 설정 일괄 저장에 얹힌다. */
export function FaqSection({ faqs, onChange }: FaqSectionProps) {
  return (
    <section id="faqs" className={styles.section}>
      <h2 className={styles.sectionTitle}>FAQ</h2>

      {faqs.length === 0 ? (
        <p className={styles.hint}>등록된 FAQ 가 없습니다.</p>
      ) : (
        <ul className={styles.rows}>
          {faqs.map((row) => {
            const patch = (next: Partial<Faq>) =>
              onChange(faqs.map((r) => (r.key === row.key ? { ...r, ...next } : r)));

            return (
              <li key={row.key} className={styles.row}>
                <div className={styles.fields}>
                  <Input
                    ariaLabel={`FAQ 질문 ${row.question || "(새 항목)"}`}
                    value={row.question}
                    onChange={(question) => patch({ question })}
                  />
                  <TextArea
                    label={`"${row.question || "새 FAQ"}" 답변`}
                    rows={2}
                    value={row.answer}
                    onChange={(answer) => patch({ answer })}
                  />
                </div>
                <button
                  type="button"
                  className={styles.danger}
                  onClick={() => onChange(faqs.filter((r) => r.key !== row.key))}
                >
                  삭제
                </button>
              </li>
            );
          })}
        </ul>
      )}

      <button type="button" className={styles.add} onClick={() => onChange([...faqs, emptyFaq()])}>
        + FAQ 추가
      </button>
    </section>
  );
}
