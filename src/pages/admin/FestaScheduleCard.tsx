import { useState } from "react";

import { Button } from "../../components/ui/Button/Button";
import { Input } from "../../components/ui/Input/Input";
import { festaAdminErrorMessage } from "../../errors/festa/errorMessages";
import { useFestaSchedule, useUpdateFestaSchedule } from "../../hooks/festa/useFestaSchedule";
import { toIso, toLocalInput } from "../../libs/datetimeLocalInput";
import type { FestaSchedule, FestaScheduleSetting } from "../../types/festa";

import styles from "./FestaPage.module.scss";

/** 폼 상태. 서버는 오프셋 붙은 ISO 를 주고받지만 `datetime-local` 입력은 오프셋 없는 KST 값만 받는다. */
type ScheduleDraft = Record<keyof FestaSchedule, string>;

function toDraft(setting: FestaScheduleSetting): ScheduleDraft {
  return {
    startAt: setting.startAt === null ? "" : toLocalInput(setting.startAt),
    endAt: setting.endAt === null ? "" : toLocalInput(setting.endAt),
  };
}

/** 저장을 막는 이유. 같은 형식(`YYYY-MM-DDTHH:mm`)이라 문자열 비교가 곧 시각 비교다. */
function invalidReason(draft: ScheduleDraft): string | null {
  if (draft.startAt === "" || draft.endAt === "") return "시작과 종료 시각을 모두 정해 주세요.";
  if (toIso(draft.startAt) === "" || toIso(draft.endAt) === "") return "시각을 다시 확인해 주세요.";
  if (draft.startAt >= draft.endAt) return "종료 시각은 시작 시각보다 뒤여야 합니다.";
  return null;
}

/**
 * 투표 기간(#379). 이 기간 밖에는 모의투자 토글이 켜져 있어도 서버가 투표를 받지 않고, 쇼케이스는
 * 이 기간으로 "투표 시작 D-2", "투표 마감 D-3", 마지막 날 남은 시간을 보여준다.
 */
export function FestaScheduleCard() {
  const { data, isPending, isError, error } = useFestaSchedule();
  const save = useUpdateFestaSchedule();
  const [edited, setEdited] = useState<ScheduleDraft | null>(null);

  const draft = edited ?? (data ? toDraft(data) : { startAt: "", endAt: "" });
  const reason = invalidReason(draft);
  const unset = data !== undefined && data.startAt === null;

  function change(next: Partial<ScheduleDraft>) {
    save.reset();
    setEdited({ ...draft, ...next });
  }

  function handleSave() {
    if (reason !== null) return;
    save.mutate({ startAt: toIso(draft.startAt), endAt: toIso(draft.endAt) }, { onSuccess: () => setEdited(null) });
  }

  return (
    <section className={styles.panel} aria-labelledby="festa-schedule">
      <h2 id="festa-schedule" className={styles.title}>
        투표 기간
      </h2>
      <p className={styles.muted}>
        이 기간 밖에는 모의투자 토글이 켜져 있어도 투표를 받지 않습니다. 쇼케이스를 띄우고 내리는 건 사이트 관리의
        모의투자 토글이 정합니다. 시각은 한국 시간이고, 종료 시각부터는 받지 않습니다. 어느 날 하루 끝까지 받으려면
        종료를 다음 날 00:00(오전 12:00)으로 정해 주세요.
      </p>

      {isError ? (
        <p role="alert" className={styles.error}>
          {festaAdminErrorMessage(error, "투표 기간을 불러오지 못했습니다.")}
        </p>
      ) : isPending ? (
        <p className={styles.muted}>불러오는 중…</p>
      ) : (
        <>
          {unset && (
            <p role="note" className={styles.muted}>
              아직 정하지 않았습니다. 정하지 않으면 모의투자 토글이 켜져 있는 동안 계속 투표를 받습니다.
            </p>
          )}
          <div className={styles.fields}>
            <Input
              label="시작"
              type="datetime-local"
              value={draft.startAt}
              onChange={(startAt) => change({ startAt })}
            />
            <Input label="종료" type="datetime-local" value={draft.endAt} onChange={(endAt) => change({ endAt })} />
          </div>
          {edited !== null && reason !== null && <p className={styles.error}>{reason}</p>}
          <div className={styles.actions}>
            <Button onClick={handleSave} disabled={edited === null || reason !== null} isLoading={save.isPending}>
              투표 기간 저장
            </Button>
          </div>
          {save.isError && (
            <p role="alert" className={styles.error}>
              {festaAdminErrorMessage(save.error, "투표 기간을 저장하지 못했습니다.")}
            </p>
          )}
          {save.isSuccess && <p role="status">투표 기간을 저장했습니다.</p>}
        </>
      )}
    </section>
  );
}
