import { useEffect, useState } from "react";

import { exportApplicants } from "../../apis/application/applicationsApi";
import { Badge } from "../../components/ui/Badge/Badge";
import { Button } from "../../components/ui/Button/Button";
import { DataTable, type Column } from "../../components/ui/DataTable/DataTable";
import { Input } from "../../components/ui/Input/Input";
import { Pagination } from "../../components/ui/Pagination/Pagination";
import { Select } from "../../components/ui/Select/Select";
import { EmptyState, ErrorState, TableSkeleton } from "../../components/ui/states/States";
import { applicationErrorMessage, applicationExportErrorMessage } from "../../errors/application/errorMessages";
import { useApplicants, useUpdateStatus } from "../../hooks/application/useApplicants";
import {
  EVALUATED_CHOICES,
  useApplicantFilters,
  type EvaluatedChoice,
} from "../../hooks/application/useApplicantFilters";
import { useDebouncedValue } from "../../hooks/ui/useDebouncedValue";
import { useModalParams } from "../../hooks/ui/useModalParams";
import { formatDateTime } from "../../libs/formatDate";
import { APPLICATION_STATUSES, type Applicant, type ApplicationStatus } from "../../types/application";

import { ApplicationDetailModal } from "./ApplicationDetailModal";
import styles from "./ApplicantsTab.module.scss";

const PAGE_SIZE = 10;

const STATUS_LABEL: Record<ApplicationStatus, string> = {
  SUBMITTED: "제출",
  DOC_PASS: "서류 합격",
  DOC_FAIL: "서류 불합격",
};

const STATUS_TABS: { value: ApplicationStatus | undefined; label: string }[] = [
  { value: undefined, label: "전체" },
  ...APPLICATION_STATUSES.map((s) => ({ value: s, label: STATUS_LABEL[s] })),
];

const EVALUATED_LABEL: Record<EvaluatedChoice, string> = {
  all: "평가 전체",
  done: "평가 완료",
  todo: "미평가",
};

const EVALUATED_OPTIONS = EVALUATED_CHOICES.map((value) => ({ value, label: EVALUATED_LABEL[value] }));

/** 와이어프레임 p7. `/admin/applications` 의 지원자 목록 탭. */
export function ApplicantsTab() {
  const { status, evaluatedChoice, evaluated, keyword, page, update } = useApplicantFilters();

  // 입력 중에는 URL 을 건드리지 않는다. 글자마다 주소가 바뀌면 기록이 지저분해진다.
  const [draftKeyword, setDraftKeyword] = useState(keyword);
  const settledKeyword = useDebouncedValue(draftKeyword);

  // 타이핑이 멈추면 그때 URL 에 옮긴다. 그래야 새로고침·링크 공유에도 검색어가 남는다.
  useEffect(() => {
    if (settledKeyword !== keyword) update({ keyword: settledKeyword });
  }, [settledKeyword, keyword, update]);

  const { data, isPending, isError, error, refetch } = useApplicants({
    status,
    evaluated,
    keyword: keyword || undefined,
    page,
    size: PAGE_SIZE,
  });

  const updateStatus = useUpdateStatus();
  const { modal, id: openedId, openModal, closeModal } = useModalParams();
  const [exportError, setExportError] = useState<string | null>(null);

  async function handleExport() {
    setExportError(null);
    try {
      await exportApplicants();
    } catch (caught) {
      // 문구는 BE ErrorCode 에서 가져온다. FE 가 코드를 새로 짓지 않는다.
      setExportError(applicationExportErrorMessage(caught));
    }
  }

  const columns: Column<Applicant>[] = [
    { header: "이름", width: "6rem", render: (a) => a.applicantName },
    { header: "소속", render: (a) => `${a.college} ${a.major}`, width: "14rem" },
    { header: "학년", render: (a) => `${a.grade}학년`, width: "5rem", align: "center" },
    {
      header: "총점",
      width: "5rem",
      align: "center",
      // 평가 전에는 점수가 없다. 0 점으로 보이면 안 된다.
      render: (a) => (a.totalScore === null ? <span className={styles.none}>—</span> : a.totalScore),
    },
    {
      header: "평가",
      width: "6rem",
      align: "center",
      render: (a) => <Badge variant={a.evaluated ? "neutral" : "info"}>{a.evaluated ? "완료" : "미평가"}</Badge>,
    },
    {
      header: "상태",
      width: "7rem",
      align: "center",
      render: (a) => <Badge variant={a.status === "DOC_FAIL" ? "neutral" : "accent"}>{STATUS_LABEL[a.status]}</Badge>,
    },
    { header: "제출일", render: (a) => formatDateTime(a.submittedAt), width: "10rem" },
    {
      header: "합·불",
      width: "8rem",
      align: "center",
      render: (a) => (
        <div className={styles.decision}>
          <button
            type="button"
            className={a.passed === true ? styles.passActive : styles.pass}
            aria-label={`${a.applicantName} 합격 처리`}
            aria-pressed={a.passed === true}
            disabled={updateStatus.isPending}
            onClick={() => updateStatus.mutate({ id: a.id, passed: true })}
          >
            합격
          </button>
          <button
            type="button"
            className={a.passed === false ? styles.failActive : styles.fail}
            aria-label={`${a.applicantName} 불합격 처리`}
            aria-pressed={a.passed === false}
            disabled={updateStatus.isPending}
            onClick={() => updateStatus.mutate({ id: a.id, passed: false })}
          >
            불합격
          </button>
        </div>
      ),
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
          <Input value={draftKeyword} onChange={setDraftKeyword} placeholder="이름 검색" ariaLabel="지원자 이름 검색" />
          <Select
            ariaLabel="평가 여부"
            value={evaluatedChoice}
            options={EVALUATED_OPTIONS}
            onChange={(next) => update({ evaluated: next })}
          />
          <Button variant="secondary" onClick={() => void handleExport()}>
            엑셀 다운로드
          </Button>
        </div>
      </div>

      {exportError && <ErrorState message={exportError} onRetry={() => void handleExport()} />}

      {isPending && <TableSkeleton columns={columns.length} rows={PAGE_SIZE} />}

      {isError && <ErrorState message={applicationErrorMessage(error)} onRetry={() => void refetch()} />}

      {data && data.content.length === 0 && data.totalElements === 0 && (
        <EmptyState
          message={
            keyword || status || evaluated !== undefined
              ? "조건에 맞는 지원자가 없습니다."
              : "접수된 지원서가 없습니다."
          }
        />
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
          listParams={{ status, evaluated, keyword: keyword || undefined }}
          onNavigate={(next) => openModal("application", next)}
          onClose={closeModal}
        />
      )}
    </div>
  );
}
