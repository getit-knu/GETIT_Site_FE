import { useState } from "react";

import { exportApplicants } from "../../apis/application/applicationsApi";
import { Badge } from "../../components/ui/Badge/Badge";
import { Button } from "../../components/ui/Button/Button";
import { DataTable, type Column } from "../../components/ui/DataTable/DataTable";
import { Pagination } from "../../components/ui/Pagination/Pagination";
import { EmptyState, ErrorState, TableSkeleton } from "../../components/ui/states/States";
import { applicationErrorMessage, applicationExportErrorMessage } from "../../errors/application/errorMessages";
import { useApplicantFilters } from "../../hooks/application/useApplicantFilters";
import { useApplicants, useDecideApplicationsBulk } from "../../hooks/application/useApplicants";
import { useModalParams } from "../../hooks/ui/useModalParams";
import { formatDateTime } from "../../libs/formatDate";
import type { Applicant, ApplicantScoreSummary, ApplicationStatus } from "../../types/application";

import { ApplicationDetailModal } from "./ApplicationDetailModal";
import { DecisionButtons } from "./DecisionButtons";
import styles from "./ApplicantsTab.module.scss";

const PAGE_SIZE = 10;

/** BE `ApplicationStatus.label()`과 같은 한글 라벨(#189에서 소스로 확인함). */
const STATUS_LABEL: Record<ApplicationStatus, string> = {
  DRAFT: "임시 저장",
  SUBMITTED: "제출",
  DOC_PASS: "서류 합격",
  DOC_FAIL: "서류 불합격",
  FINAL_PASS: "최종 합격",
  FINAL_FAIL: "최종 불합격",
};

/**
 * 이 목록 필터 탭에 실제로 나타날 수 있는 상태만 — `DRAFT`는 어드민 목록에 절대 안 나오고
 * (5.1 `totalApplicants` 산출 기준), `FINAL_PASS`/`FINAL_FAIL` 필터는 이 화면 범위 밖이다.
 */
const FILTERABLE_STATUSES: ApplicationStatus[] = ["SUBMITTED", "DOC_PASS", "DOC_FAIL"];

const STATUS_TABS: { value: ApplicationStatus | undefined; label: string }[] = [
  { value: undefined, label: "전체" },
  ...FILTERABLE_STATUSES.map((s) => ({ value: s, label: STATUS_LABEL[s] })),
];

/** `SUBMITTED`→`DOC_PASS`/`DOC_FAIL`, `DOC_PASS`→`FINAL_PASS`/`FINAL_FAIL`(BE `nextDecisionStatus` 확인함). */
const BULK_TARGET: Partial<Record<ApplicationStatus, { pass: ApplicationStatus; fail: ApplicationStatus }>> = {
  SUBMITTED: { pass: "DOC_PASS", fail: "DOC_FAIL" },
  DOC_PASS: { pass: "FINAL_PASS", fail: "FINAL_FAIL" },
};

/** 와이어프레임 p7. `/admin/applications` 의 지원자 목록 탭. */
/**
 * 지원자 한 명의 평가 점수.
 *
 * 서버가 점수를 주기 전(BE#188)에는 `undefined` 라 아무 값도 못 보여준다 — 그때와
 * "아무도 평가하지 않았다"(`null`)를 구분해서, 없는 정보를 있는 것처럼 그리지 않는다.
 *
 * 평가자 수를 함께 보여준다. 한 명만 매긴 90점과 다섯 명이 매긴 90점은 다르게 읽어야 한다.
 */
function Score({ applicant }: { applicant: Applicant }) {
  if (applicant.totalScore === undefined) return <span className={styles.none}>—</span>;
  if (applicant.totalScore === null) return <span className={styles.none}>미평가</span>;

  return (
    <span>
      {applicant.totalScore.toFixed(1)}점
      {applicant.evaluatorCount != null && <span className={styles.none}> ({applicant.evaluatorCount}명)</span>}
    </span>
  );
}

/**
 * 목록 위에 붙는 요약 한 줄. 그릴 것이 없으면 `null`.
 *
 * **`undefined` 와 `null` 을 갈라 쓴다.** 생성된 스키마(`PageResponseApplicantSummary`)엔
 * `summary` 필드가 아직 없어(BE#188) 지금은 늘 `undefined` 다 — 그때 안내를 띄우면 모든
 * 지원자 목록에 같은 문구가 상시로 남는데, 표의 `평가 점수` 칸이 이미 전부 `—` 라 같은
 * 말을 두 번 하는 셈이다. 반대로 `summary: null` 은 서버가 필드를 주면서 값을 비운
 * 것이므로 그 자리를 조용히 비우지 않고 평균이 없다는 사실을 드러낸다.
 *
 * 어느 쪽이든 `averageTotalScore` 에 접근하기 전에 걸러야 한다. 안 그러면 목록이 통째로
 * 터진다 — 평균 한 줄 때문에 화면 전체를 잃는 것이 가장 나쁘다.
 */
function summaryText(summary: ApplicantScoreSummary | null | undefined): string | null {
  if (summary === undefined) return null;
  if (summary === null) return "지원자 전체 평균 정보가 없습니다.";
  if (summary.averageTotalScore === null) return "아직 평가를 마친 지원자가 없습니다.";

  return `지원자 전체 평균 ${summary.averageTotalScore.toFixed(1)}점 (평가 완료 ${summary.evaluatedCount}명)`;
}

export function ApplicantsTab() {
  const { status, page, update } = useApplicantFilters();
  const params = { status, page, size: PAGE_SIZE };

  const { data, isPending, isError, error, refetch } = useApplicants(params);
  const { modal, id: openedId, openModal, closeModal } = useModalParams();
  const [exportError, setExportError] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());

  /*
    필터·페이지가 바뀌면 화면에 안 보이는 행을 실수로 계속 선택해 둔 채가 되지 않게 비운다.
    useEffect 대신 렌더 중에 직접 비교해서 리셋한다(React 공식 패턴) — 커밋 이후에 도는
    effect로 하면 한 프레임 동안 낡은 선택이 그대로 보이는 캐스케이드 렌더가 생긴다.
  */
  const [prevFilterKey, setPrevFilterKey] = useState(`${status ?? ""}-${page}`);
  const filterKey = `${status ?? ""}-${page}`;
  if (filterKey !== prevFilterKey) {
    setPrevFilterKey(filterKey);
    setSelectedIds(new Set());
  }

  const decideBulk = useDecideApplicationsBulk();

  async function handleExport() {
    setExportError(null);
    try {
      await exportApplicants(params);
    } catch (caught) {
      // 문구는 BE ErrorCode 에서 가져온다. FE 가 코드를 새로 짓지 않는다.
      setExportError(applicationExportErrorMessage(caught));
    }
  }

  function toggleAll(checked: boolean) {
    setSelectedIds(checked ? new Set(data?.content.map((a) => a.id) ?? []) : new Set());
  }

  function toggleOne(id: number, checked: boolean) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (checked) next.add(id);
      else next.delete(id);
      return next;
    });
  }

  // 상태 필터를 하나로 좁혔을 때만 일괄 처리를 켠다 — 선택된 행 전부가 같은 선행 상태여야
  // BE `decideBulk`가 요구하는 "하나의 목표 상태"가 의미를 갖는다.
  const bulkTarget = status ? BULK_TARGET[status] : undefined;

  function handleBulkDecide(target: ApplicationStatus) {
    decideBulk.mutate(
      { applicationIds: [...selectedIds], status: target },
      { onSuccess: () => setSelectedIds(new Set()) },
    );
  }

  const summaryLine = summaryText(data?.summary);

  const columns: Column<Applicant>[] = [
    {
      header: "",
      width: "2.5rem",
      render: (a) => (
        <input
          type="checkbox"
          aria-label={`${a.name} 선택`}
          checked={selectedIds.has(a.id)}
          onChange={(e) => toggleOne(a.id, e.target.checked)}
          onClick={(e) => e.stopPropagation()}
        />
      ),
    },
    { header: "이름", width: "6rem", render: (a) => a.name },
    { header: "학번", width: "7rem", render: (a) => a.studentNumber ?? <span className={styles.none}>—</span> },
    { header: "소속", render: (a) => a.college ?? <span className={styles.none}>—</span>, width: "10rem" },
    { header: "학년", width: "5rem", align: "center", render: (a) => `${a.grade}학년` },
    {
      header: "상태",
      width: "7rem",
      align: "center",
      render: (a) => <Badge variant={a.status === "DOC_FAIL" ? "neutral" : "accent"}>{STATUS_LABEL[a.status]}</Badge>,
    },
    {
      header: "평가 점수",
      width: "8rem",
      align: "center",
      render: (a) => <Score applicant={a} />,
    },
    { header: "제출일", render: (a) => formatDateTime(a.submittedAt), width: "10rem" },
    {
      header: "합·불",
      width: "9rem",
      align: "center",
      render: (a) => <DecisionButtons id={a.id} name={a.name} status={a.status} />,
    },
  ];

  return (
    <div className={styles.tab}>
      <div className={styles.toolbar}>
        <div className={styles.tabs} role="tablist" aria-label="지원 상태">
          {STATUS_TABS.map((tab) => (
            <button
              key={tab.label}
              type="button"
              role="tab"
              aria-selected={status === tab.value}
              className={status === tab.value ? styles.tabActive : styles.tab}
              onClick={() => update({ status: tab.value })}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className={styles.filters}>
          {bulkTarget && selectedIds.size > 0 && (
            <>
              <span className={styles.selectedCount}>{selectedIds.size}명 선택됨</span>
              <Button
                variant="secondary"
                disabled={decideBulk.isPending}
                onClick={() => handleBulkDecide(bulkTarget.pass)}
              >
                일괄 {STATUS_LABEL[bulkTarget.pass]}
              </Button>
              <Button
                variant="secondary"
                disabled={decideBulk.isPending}
                onClick={() => handleBulkDecide(bulkTarget.fail)}
              >
                일괄 {STATUS_LABEL[bulkTarget.fail]}
              </Button>
            </>
          )}
          <Button variant="secondary" onClick={() => void handleExport()}>
            엑셀 다운로드
          </Button>
        </div>
      </div>

      {/*
        비교 기준은 서버가 준 것만 쓴다. 현재 페이지로 평균을 내면 페이지를 넘길 때마다
        기준이 달라져, 같은 점수가 높아 보였다 낮아 보였다 한다 (BE#188).
      */}
      {summaryLine !== null && <p className={styles.scoreSummary}>{summaryLine}</p>}

      {exportError && <ErrorState message={exportError} onRetry={() => void handleExport()} />}
      {decideBulk.error !== null && <ErrorState message={applicationErrorMessage(decideBulk.error)} />}

      {isPending && <TableSkeleton columns={columns.length} rows={PAGE_SIZE} />}

      {isError && <ErrorState message={applicationErrorMessage(error)} onRetry={() => void refetch()} />}

      {data && data.content.length === 0 && data.totalElements === 0 && (
        <EmptyState message={status ? "조건에 맞는 지원자가 없습니다." : "접수된 지원서가 없습니다."} />
      )}

      {data && data.content.length === 0 && data.totalElements > 0 && (
        <EmptyState
          message={`이 페이지에는 지원자가 없습니다. 전체 ${data.totalElements}명은 ${data.totalPages}페이지까지 있습니다.`}
          action={
            <button type="button" className={styles.backToFirst} onClick={() => update({ page: 0 })}>
              첫 페이지로
            </button>
          }
        />
      )}

      {data && data.content.length > 0 && (
        <>
          <div className={styles.selectAllRow}>
            <label>
              <input
                type="checkbox"
                checked={selectedIds.size > 0 && selectedIds.size === data.content.length}
                onChange={(e) => toggleAll(e.target.checked)}
              />
              이 페이지 전체 선택
            </label>
          </div>
          <DataTable
            columns={columns}
            rows={data.content}
            rowKey={(a) => a.id}
            caption="지원자 목록"
            onRowClick={(a) => openModal("application", a.id)}
          />
          <Pagination page={data.page} totalPages={data.totalPages} onChange={(next) => update({ page: next })} />
        </>
      )}

      {modal === "application" && openedId !== null && (
        <ApplicationDetailModal
          applicationId={openedId}
          // 순차 탐색이 목록과 같은 순서를 따르려면 필터를 그대로 넘겨야 한다(명세서 7.5).
          listParams={{ status }}
          onNavigate={(next) => openModal("application", next)}
          onClose={closeModal}
        />
      )}
    </div>
  );
}
