import { useState } from "react";

import { Button } from "../../components/ui/Button/Button";
import { DataTable, type Column } from "../../components/ui/DataTable/DataTable";
import { Input } from "../../components/ui/Input/Input";
import { festaAdminErrorMessage } from "../../errors/festa/errorMessages";
import { useDrawFestaWinners, useViewFestaWinners } from "../../hooks/festa/useFestaResults";
import { formatDateTime } from "../../libs/formatDate";
import type { FestaWinner, FestaWinners } from "../../types/festa";

import styles from "./FestaPage.module.scss";

const DEFAULT_COUNT = "5";
const MAX_COUNT = 50;

const WINNER_COLUMNS: Column<FestaWinner>[] = [
  { header: "순번", render: (w) => w.drawOrder, width: "4rem", align: "center" },
  { header: "이름", render: (w) => w.name },
  { header: "전화번호", render: (w) => w.phoneNumber ?? "파기됨" },
  { header: "추첨 시각", render: (w) => formatDateTime(w.drawnAt) },
];

/** 1~50 사이 정수면 그 수, 아니면 `null`. 서버도 같은 범위만 받는다. */
function parseCount(value: string): number | null {
  const count = Number(value);
  return Number.isInteger(count) && count >= 1 && count <= MAX_COUNT ? count : null;
}

/**
 * 경품 추첨(#412, BE#238). 서버가 번호를 낸 참여자 중에서 뽑고, 당첨자 번호만 보여준다 — 전체
 * 명단 파일을 내려받아 직접 뽑으면 그 파일이 PC·메신저에 남는다.
 *
 * 당첨자 번호는 볼 때마다 서버에 기록이 남는다. 그래서 페이지를 여는 것만으로는 부르지 않고,
 * "당첨자 보기"를 누르거나 추첨한 직후에만 보여준다.
 */
export function FestaDrawCard() {
  const draw = useDrawFestaWinners();
  const view = useViewFestaWinners();
  const [count, setCount] = useState(DEFAULT_COUNT);
  // 추첨 결과와 조회 결과 중 마지막에 받은 것을 보여준다.
  const [winners, setWinners] = useState<FestaWinner[] | null>(null);
  const [lastAction, setLastAction] = useState<"draw" | "view" | null>(null);

  const parsedCount = parseCount(count);
  const busy = draw.isPending || view.isPending;
  const show = (result: FestaWinners) => setWinners(result.winners);

  function handleDraw() {
    if (parsedCount === null) return;
    if (!window.confirm(`${parsedCount}명을 추첨할까요? 한 번 뽑으면 다시 뽑을 수 없습니다.`)) return;
    setLastAction("draw");
    draw.mutate({ count: parsedCount }, { onSuccess: show });
  }

  function handleDrawOneMore() {
    if (!window.confirm("이미 뽑힌 사람을 빼고 1명을 더 뽑을까요? 연락이 안 되는 당첨자 대신 뽑을 때 씁니다.")) return;
    setLastAction("draw");
    draw.mutate({ count: 1, additional: true }, { onSuccess: show });
  }

  function handleView() {
    setLastAction("view");
    view.mutate(undefined, { onSuccess: show });
  }

  const failed = lastAction === "draw" ? draw : view;

  return (
    <section className={styles.panel} aria-labelledby="festa-draw">
      <h2 id="festa-draw" className={styles.title}>
        경품 추첨
      </h2>
      <p className={styles.muted}>
        투표가 끝난 뒤, 전화번호를 낸 참여자 중에서 서버가 무작위로 뽑습니다. 한 번 뽑으면 다시 뽑을 수 없고, 연락이 안
        되는 당첨자가 있으면 <strong>1명 더 뽑기</strong>로 이어서 뽑습니다. 당첨자 번호는 볼 때마다 기록이 남습니다.
      </p>

      <div className={styles.drawRow}>
        <Input
          label="뽑을 인원"
          type="number"
          min={1}
          max={MAX_COUNT}
          value={count}
          onChange={setCount}
          error={parsedCount === null ? `1~${MAX_COUNT}명 사이로 입력해 주세요.` : undefined}
        />
        <div className={styles.actions}>
          <Button onClick={handleDraw} disabled={parsedCount === null || busy} isLoading={draw.isPending}>
            추첨하기
          </Button>
          {winners !== null && winners.length > 0 && (
            <Button variant="secondary" onClick={handleDrawOneMore} disabled={busy}>
              1명 더 뽑기
            </Button>
          )}
          {winners === null ? (
            <Button variant="secondary" onClick={handleView} disabled={busy} isLoading={view.isPending}>
              당첨자 보기
            </Button>
          ) : (
            <Button variant="secondary" onClick={() => setWinners(null)}>
              당첨자 숨기기
            </Button>
          )}
        </div>
      </div>

      {failed.isError && (
        <p role="alert" className={styles.error}>
          {festaAdminErrorMessage(
            failed.error,
            lastAction === "draw" ? "추첨하지 못했습니다." : "당첨자를 불러오지 못했습니다.",
          )}
        </p>
      )}

      {winners !== null &&
        (winners.length === 0 ? (
          <p className={styles.muted}>아직 추첨하지 않았습니다.</p>
        ) : (
          <DataTable caption="경품 당첨자" columns={WINNER_COLUMNS} rows={winners} rowKey={(w) => w.userId} />
        ))}
    </section>
  );
}
