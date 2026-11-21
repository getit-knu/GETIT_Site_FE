import { FESTA_MODE, formatWon, type FestaMode } from "../../components/festa/festaConfig";
import { DashboardCard } from "../../components/dashboard/DashboardCard";
import { Button } from "../../components/ui/Button/Button";
import { DataTable, type Column } from "../../components/ui/DataTable/DataTable";
import { festaAdminErrorMessage } from "../../errors/festa/errorMessages";
import {
  useDestroyFestaPhoneNumbers,
  useDownloadFestaInvestors,
  useFestaResults,
  useFestaVoteResults,
  useResetFestaInvestments,
} from "../../hooks/festa/useFestaResults";
import type { FestaProjectResult, FestaVoteResults } from "../../types/festa";

import styles from "./FestaPage.module.scss";
import { FestaScheduleCard } from "./FestaScheduleCard";

type Ranked<T> = T & { rank: number };
type VoteResult = FestaVoteResults["projects"][number];

/** 점수가 같으면 같은 순위다(1, 1, 3). 서버가 이미 내림차순으로 준다. */
function withRank<T>(items: T[], score: (item: T) => number): Ranked<T>[] {
  return items.map((item) => ({ ...item, rank: 1 + items.filter((o) => score(o) > score(item)).length }));
}

const VOTE_COLUMNS: Column<Ranked<VoteResult>>[] = [
  { header: "순위", render: (r) => r.rank, width: "4rem", align: "center" },
  { header: "프로젝트", render: (r) => r.title },
  { header: "팀", render: (r) => r.teamName },
  { header: "득표수", render: (r) => `${r.voteCount.toLocaleString("ko-KR")}표`, align: "right" },
];

const COLUMNS: Column<Ranked<FestaProjectResult>>[] = [
  { header: "순위", render: (r) => r.rank, width: "4rem", align: "center" },
  { header: "프로젝트", render: (r) => r.title },
  { header: "팀", render: (r) => r.teamName },
  { header: "총 투자액", render: (r) => formatWon(r.totalAmount), align: "right" },
  { header: "투자자 수", render: (r) => `${r.investorCount.toLocaleString("ko-KR")}명`, align: "right" },
];

/**
 * 모의투자 FESTA 결과(#365). 행사 중에는 결과를 공개하지 않아 이 화면에서만 집계를 본다.
 * 집계는 참여 방식(`FESTA_MODE`)에 따라 득표수(#373) 또는 투자 총액으로 보여준다.
 * 추첨은 어드민이 명단 CSV 로 직접 하고, 끝나면 번호를 파기한다. 맨 위에서 투표 기간(#379)을 정한다.
 */
export default function FestaPage({ mode = FESTA_MODE }: { mode?: FestaMode }) {
  const download = useDownloadFestaInvestors();
  const destroy = useDestroyFestaPhoneNumbers();
  const reset = useResetFestaInvestments();

  function handleDestroy() {
    if (!window.confirm("참여자 전화번호를 모두 파기할까요? 되돌릴 수 없고, 이후에는 명단이 비어 있습니다.")) return;
    destroy.mutate();
  }

  function handleReset() {
    if (!window.confirm("투표·투자 내역과 전화번호를 모두 지울까요? 집계도 0이 되고 되돌릴 수 없습니다.")) return;
    reset.mutate();
  }

  return (
    <div className={styles.page}>
      <FestaScheduleCard />

      {mode === "vote" ? <VoteResultsCard /> : <InvestResultsCard />}

      <section className={styles.panel} aria-labelledby="festa-raffle">
        <h2 id="festa-raffle" className={styles.title}>
          추첨 명단
        </h2>
        <p className={styles.muted}>
          명단 파일에는 참여자 이름과 <strong>전체 전화번호</strong>가 들어 있습니다. 추첨과 경품 발송이 끝나면 내려받은
          파일을 지우고, 서버에 남은 번호도 파기해 주세요. 늦어도 행사 종료 후 30일 안에 파기해야 합니다.
        </p>
        <div className={styles.actions}>
          <Button onClick={() => download.mutate()} isLoading={download.isPending}>
            참여자 명단 내려받기 (CSV)
          </Button>
          <Button variant="secondary" onClick={handleDestroy} isLoading={destroy.isPending}>
            전화번호 파기
          </Button>
        </div>
        {download.isError && (
          <p role="alert" className={styles.error}>
            {festaAdminErrorMessage(download.error, "명단을 내려받지 못했습니다.")}
          </p>
        )}
        {destroy.isError && (
          <p role="alert" className={styles.error}>
            {festaAdminErrorMessage(destroy.error, "전화번호를 파기하지 못했습니다.")}
          </p>
        )}
        {destroy.isSuccess && (
          <p role="status">{destroy.data.destroyedCount.toLocaleString("ko-KR")}명의 전화번호를 파기했습니다.</p>
        )}
      </section>

      <section className={styles.panel} aria-labelledby="festa-reset">
        <h2 id="festa-reset" className={styles.title}>
          리허설 데이터 초기화
        </h2>
        <p className={styles.muted}>
          투표·투자 내역과 전화번호를 모두 지웁니다. 사이트 관리의 모의투자 토글이 꺼져 있을 때만 됩니다. 행사가 끝난
          뒤에는 결과 발표 전에 누르지 마세요.
        </p>
        <div className={styles.actions}>
          <Button variant="secondary" onClick={handleReset} isLoading={reset.isPending}>
            참여 데이터 초기화
          </Button>
        </div>
        {reset.isError && (
          <p role="alert" className={styles.error}>
            {festaAdminErrorMessage(reset.error, "참여 데이터를 초기화하지 못했습니다.")}
          </p>
        )}
        {reset.isSuccess && (
          <p role="status">{reset.data.deletedInvestorCount.toLocaleString("ko-KR")}명의 참여 데이터를 지웠습니다.</p>
        )}
      </section>
    </div>
  );
}

/** 1인 1팀 투표(#373) 득표 순위. */
function VoteResultsCard() {
  const results = useFestaVoteResults();
  return (
    <DashboardCard
      title="득표 집계"
      action={
        results.data && <span className={styles.muted}>투표자 {results.data.voterCount.toLocaleString("ko-KR")}명</span>
      }
      query={results}
      isEmpty={(data) => data.projects.length === 0}
      emptyMessage="FESTA에 출전한 프로젝트가 없습니다. 프로젝트 관리에서 출전을 체크해 주세요."
    >
      {(data) => (
        <>
          {data.voterCount === 0 && <p className={styles.muted}>아직 투표한 사람이 없습니다.</p>}
          <DataTable
            caption="프로젝트별 득표수"
            columns={VOTE_COLUMNS}
            rows={withRank(data.projects, (p) => p.voteCount)}
            rowKey={(r) => r.projectId}
          />
        </>
      )}
    </DashboardCard>
  );
}

/** 가상 투자(#365) 총액 순위. `FESTA_MODE`가 `"investment"`일 때 쓴다. */
function InvestResultsCard() {
  const results = useFestaResults();
  return (
    <DashboardCard
      title="투자 집계"
      action={
        results.data && (
          <span className={styles.muted}>투자자 {results.data.investorCount.toLocaleString("ko-KR")}명</span>
        )
      }
      query={results}
      isEmpty={(data) => data.projects.length === 0}
      emptyMessage="FESTA에 출전한 프로젝트가 없습니다. 프로젝트 관리에서 출전을 체크해 주세요."
    >
      {(data) => (
        <>
          {data.investorCount === 0 && <p className={styles.muted}>아직 투자한 사람이 없습니다.</p>}
          <DataTable
            caption="프로젝트별 가상 투자 총액"
            columns={COLUMNS}
            rows={withRank(data.projects, (p) => p.totalAmount)}
            rowKey={(r) => r.projectId}
          />
        </>
      )}
    </DashboardCard>
  );
}
