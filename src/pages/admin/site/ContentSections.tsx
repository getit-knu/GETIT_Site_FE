import type { ReactNode } from "react";

import { Input } from "../../../components/ui/Input/Input";
import { Select } from "../../../components/ui/Select/Select";
import { TextArea } from "../../../components/ui/TextArea/TextArea";
import type { Curriculum, SiteEventType, Faq, SiteEvent } from "../../../types/site";

import styles from "./ContentSections.module.scss";
import type { Draft } from "./contentDraft";
import { emptyCurriculum, emptyEvent, emptyFaq, EVENT_TYPES } from "./contentDraft";

interface ListSectionProps<T> {
  title: string;
  addLabel: string;
  emptyMessage: string;
  rows: Draft<T>[];
  onChange: (next: Draft<T>[]) => void;
  onAdd: () => Draft<T>;
  renderRow: (row: Draft<T>, patch: (patch: Partial<T>) => void) => ReactNode;
}

/**
 * 목록 한 덩어리. 세 섹션이 "행을 넣고 빼는" 같은 모양이라 껍데기만 공유한다.
 *
 * 행 안의 입력은 섹션마다 달라 `renderRow` 로 넘긴다 — 여기에 분기를 두면
 * 섹션이 늘어날 때마다 이 컴포넌트가 뒤덮인다.
 */
function ListSection<T>({ title, addLabel, emptyMessage, rows, onChange, onAdd, renderRow }: ListSectionProps<T>) {
  return (
    <section className={styles.section}>
      <h2 className={styles.sectionTitle}>{title}</h2>

      {rows.length === 0 ? (
        <p className={styles.hint}>{emptyMessage}</p>
      ) : (
        <ul className={styles.rows}>
          {rows.map((row) => (
            <li key={row.key} className={styles.row}>
              <div className={styles.fields}>
                {renderRow(row, (patch) => onChange(rows.map((r) => (r.key === row.key ? { ...r, ...patch } : r))))}
              </div>
              <button
                type="button"
                className={styles.danger}
                onClick={() => onChange(rows.filter((r) => r.key !== row.key))}
              >
                삭제
              </button>
            </li>
          ))}
        </ul>
      )}

      <button type="button" className={styles.add} onClick={() => onChange([...rows, onAdd()])}>
        {addLabel}
      </button>
    </section>
  );
}

interface ContentSectionsProps {
  curriculums: Draft<Curriculum>[];
  events: Draft<SiteEvent>[];
  faqs: Draft<Faq>[];
  onCurriculumsChange: (next: Draft<Curriculum>[]) => void;
  onEventsChange: (next: Draft<SiteEvent>[]) => void;
  onFaqsChange: (next: Draft<Faq>[]) => void;
}

/** 커리큘럼 · 행사 일정 · FAQ. 와이어프레임 p10. */
export function ContentSections({
  curriculums,
  events,
  faqs,
  onCurriculumsChange,
  onEventsChange,
  onFaqsChange,
}: ContentSectionsProps) {
  return (
    <>
      <ListSection
        title="커리큘럼"
        addLabel="+ 커리큘럼 추가"
        emptyMessage="등록된 커리큘럼이 없습니다."
        rows={curriculums}
        onChange={onCurriculumsChange}
        onAdd={emptyCurriculum}
        renderRow={(row, patch) => (
          <>
            <Input
              ariaLabel={`커리큘럼 제목 ${row.title || "(새 항목)"}`}
              value={row.title}
              onChange={(title) => patch({ title })}
            />
            <Input
              ariaLabel={`커리큘럼 부제 ${row.title || "(새 항목)"}`}
              value={row.subtitle}
              onChange={(subtitle) => patch({ subtitle })}
            />
          </>
        )}
      />

      <ListSection
        title="행사 일정"
        addLabel="+ 행사 추가"
        emptyMessage="등록된 행사가 없습니다."
        rows={events}
        onChange={onEventsChange}
        onAdd={emptyEvent}
        renderRow={(row, patch) => (
          <>
            <Input
              ariaLabel={`행사 제목 ${row.title || "(새 항목)"}`}
              value={row.title}
              onChange={(title) => patch({ title })}
            />
            {/* 날짜만 다룬다. 행사에는 시각이 없다(명세서 10.14 는 startDate·endDate). */}
            <Input
              ariaLabel={`${row.title || "새 행사"} 시작일`}
              type="date"
              value={row.startDate}
              onChange={(startDate) => patch({ startDate })}
            />
            <Input
              ariaLabel={`${row.title || "새 행사"} 종료일`}
              type="date"
              value={row.endDate}
              onChange={(endDate) => patch({ endDate })}
            />
            <Select
              ariaLabel={`${row.title || "새 행사"} 종류`}
              value={row.type}
              options={EVENT_TYPES}
              onChange={(type: SiteEventType) => patch({ type })}
            />
          </>
        )}
      />

      <ListSection
        title="FAQ"
        addLabel="+ FAQ 추가"
        emptyMessage="등록된 FAQ 가 없습니다."
        rows={faqs}
        onChange={onFaqsChange}
        onAdd={emptyFaq}
        renderRow={(row, patch) => (
          <>
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
          </>
        )}
      />
    </>
  );
}
