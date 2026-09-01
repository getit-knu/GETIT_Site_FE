import { useState } from "react";

import { Button } from "../../../components/ui/Button/Button";
import { Input } from "../../../components/ui/Input/Input";
import { Select } from "../../../components/ui/Select/Select";
import { ErrorState, TextSkeleton } from "../../../components/ui/states/States";
import { siteErrorMessage, siteSaveErrorMessage } from "../../../errors/site/errorMessages";
import { useDeleteEvent, useEvents, useSaveEvent } from "../../../hooks/site/useContent";
import type { SiteEvent, SiteEventPayload, SiteEventType } from "../../../types/site";

import styles from "./StaffsSection.module.scss";

const EVENT_TYPES: { value: SiteEventType; label: string }[] = [
  { value: "COMPETITION", label: "대회" },
  { value: "WORKSHOP", label: "워크숍" },
  { value: "EVENT", label: "행사" },
];

interface Draft {
  id: number | null;
  title: string;
  place: string;
  startDate: string;
  endDate: string;
  type: SiteEventType;
  isVisible: boolean;
}

function emptyDraft(): Draft {
  return { id: null, title: "", place: "", startDate: "", endDate: "", type: "EVENT", isVisible: true };
}

function toDraft(event: SiteEvent): Draft {
  return {
    id: event.id,
    title: event.title,
    place: event.place,
    startDate: event.startDate,
    endDate: event.endDate,
    type: event.type,
    isVisible: event.isVisible,
  };
}

function invalidReason(draft: Draft): string | null {
  if (draft.title.trim() === "") return "제목을 입력해 주세요.";
  if (draft.place.trim() === "") return "장소를 입력해 주세요.";
  if (draft.startDate === "" || draft.endDate === "") return "행사 기간을 입력해 주세요.";
  // 하루짜리 행사는 시작과 종료가 같다. 같은 것은 막지 않는다.
  if (draft.endDate < draft.startDate) return "종료일이 시작일보다 빠릅니다.";
  return null;
}

interface FormProps {
  draft: Draft;
  generationId: number;
  onClose: () => void;
}

/** 추가와 수정이 같은 폼을 쓴다. `id` 가 `null` 이면 추가다. */
function EventForm({ draft: initial, generationId, onClose }: FormProps) {
  const [draft, setDraft] = useState(initial);
  const save = useSaveEvent();

  const reason = invalidReason(draft);
  const set = (patch: Partial<Draft>) => setDraft((prev) => ({ ...prev, ...patch }));

  function handleSave() {
    const payload: SiteEventPayload = {
      generationId,
      title: draft.title.trim(),
      place: draft.place.trim(),
      startDate: draft.startDate,
      endDate: draft.endDate,
      type: draft.type,
      isVisible: draft.isVisible,
    };
    save.mutate({ id: draft.id, payload }, { onSuccess: onClose });
  }

  return (
    <div className={styles.form}>
      <div className={styles.formGrid}>
        <Input label="제목 *" value={draft.title} onChange={(title) => set({ title })} />
        <Input label="장소 *" value={draft.place} onChange={(place) => set({ place })} />
        <Input label="시작일 *" type="date" value={draft.startDate} onChange={(startDate) => set({ startDate })} />
        <Input label="종료일 *" type="date" value={draft.endDate} onChange={(endDate) => set({ endDate })} />
        <div className={styles.field}>
          <span className={styles.label}>종류</span>
          <Select
            ariaLabel="행사 종류"
            value={draft.type}
            options={EVENT_TYPES}
            onChange={(type: SiteEventType) => set({ type })}
          />
        </div>
      </div>

      <label className={styles.checkbox}>
        <input type="checkbox" checked={draft.isVisible} onChange={(e) => set({ isVisible: e.target.checked })} />
        공개 캘린더에 노출
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

/** 행사 일정. 개별 엔드포인트로 즉시 반영된다. `isVisible` 이 꺼지면 공개 캘린더에서 빠진다. */
export function EventsSection({ generationId }: { generationId: number }) {
  const { data, isPending, isError, error, refetch } = useEvents();
  const [editing, setEditing] = useState<Draft | null>(null);
  const remove = useDeleteEvent();

  function handleDelete(event: SiteEvent) {
    if (!window.confirm(`"${event.title}" 행사를 삭제할까요?`)) return;
    remove.mutate(event.id);
  }

  return (
    <section id="events" className={styles.section}>
      <h2 className={styles.sectionTitle}>행사 일정</h2>

      {isPending && <TextSkeleton lines={4} label="행사 일정 불러오는 중" />}
      {isError && <ErrorState message={siteErrorMessage(error)} onRetry={() => void refetch()} />}

      {data &&
        (data.length === 0 ? (
          <p className={styles.hint}>등록된 행사가 없습니다.</p>
        ) : (
          <ul className={styles.staffs}>
            {data.map((event) => (
              <li key={event.id} className={styles.staff}>
                <div className={styles.info}>
                  <strong>{event.title}</strong>
                  <span>
                    {event.startDate} ~ {event.endDate}
                  </span>
                  <span className={styles.muted}>{event.place}</span>
                  {!event.isVisible && <span className={styles.muted}>(비공개)</span>}
                </div>
                <div className={styles.actions}>
                  <button type="button" onClick={() => setEditing(toDraft(event))}>
                    수정
                  </button>
                  <button type="button" className={styles.danger} onClick={() => handleDelete(event)}>
                    삭제
                  </button>
                </div>
              </li>
            ))}
          </ul>
        ))}

      <button type="button" className={styles.add} onClick={() => setEditing(emptyDraft())}>
        + 행사 추가
      </button>

      {remove.error !== null && <p className={styles.reason}>{siteSaveErrorMessage(remove.error)}</p>}

      {editing !== null && (
        <EventForm
          key={editing.id ?? "new"}
          draft={editing}
          generationId={generationId}
          onClose={() => setEditing(null)}
        />
      )}
    </section>
  );
}
