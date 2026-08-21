import { useState } from "react";

import { exportApplicants } from "../../apis/application/applicationsApi";
import { Badge } from "../../components/ui/Badge/Badge";
import { Button } from "../../components/ui/Button/Button";
import { DataTable, type Column } from "../../components/ui/DataTable/DataTable";
import { Input } from "../../components/ui/Input/Input";
import { Pagination } from "../../components/ui/Pagination/Pagination";
import { Select } from "../../components/ui/Select/Select";
import { EmptyState, ErrorState, TableSkeleton } from "../../components/ui/states/States";
import { useApplicants, useUpdateStatus } from "../../hooks/application/useApplicants";
import { useDebouncedValue } from "../../hooks/ui/useDebouncedValue";
import { useTableParams } from "../../hooks/ui/useTableParams";
import { formatDateTime } from "../../libs/formatDate";
import { APPLICATION_STATUSES, type Applicant, type ApplicationStatus } from "../../types/application";

import styles from "./ApplicationsPage.module.scss";

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

/** 평가 여부는 3상태다. `undefined`(전체)를 값으로 표현할 수 없어 문자열로 다룬다. */
const EVALUATED_OPTIONS = [
  { value: "all", label: "평가 전체" },
  { value: "done", label: "평가 완료" },
  { value: "todo", label: "미평가" },
] as const;

type EvaluatedChoice = (typeof EVALUATED_OPTIONS)[number]["value"];

const EVALUATED_VALUE: Record<EvaluatedChoice, boolean | undefined> = {
  all: undefined,
  done: true,
  todo: false,
};

/** 와이어프레임 p7. */
export default function ApplicationsPage() {
  const { page, filter: status, setPage, setFilter: setStatus } = useTableParams("status", APPLICATION_STATUSES);
  const [evaluatedChoice, setEvaluatedChoice] = useState<EvaluatedChoice>("all");
  const [keyword, setKeyword] = useState("");

  // 입력할 때마다 조회하면 한 단어를 치는 사이에 요청이 여러 번 나간다.
  const settledKeyword = useDebouncedValue(keyword);

  const { data, isPending, isError, refetch } = useApplicants({
    status,
    evaluated: EVALUATED_VALUE[evaluatedChoice],
    keyword: settledKeyword || undefined,
    page,
    size: PAGE_SIZE,
  });

  const updateStatus = useUpdateStatus();
  const [exportError, setExportError] = useState<string | null>(null);

  async function handleExport() {
    setExportError(null);
    try {
      await exportApplicants();
    } catch (error) {
      setExportError((error as { message?: string }).message ?? "다운로드에 실패했습니다.");
    }
  }

  const columns: Column<Applicant>[] = [
    { header: "이름", render: (a) => a.applicantName, width: "6rem" },
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
    <div className={styles.page}>
      <div className={styles.toolbar}>
        <div className={styles.tabs} role="tablist" aria-label="지원 상태">
          {STATUS_TABS.map((tab) => (
            <button
              key={tab.label}
              type="button"
              role="tab"
              aria-selected={status === tab.value}
              className={status === tab.value ? styles.tabActive : styles.tab}
              onClick={() => setStatus(tab.value)}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className={styles.filters}>
          <Input value={keyword} onChange={setKeyword} placeholder="이름 검색" ariaLabel="지원자 이름 검색" />
          <Select
            ariaLabel="평가 여부"
            value={evaluatedChoice}
            options={EVALUATED_OPTIONS}
            onChange={setEvaluatedChoice}
          />
          <Button variant="secondary" onClick={() => void handleExport()}>
            엑셀 다운로드
          </Button>
        </div>
      </div>

      {exportError && <ErrorState message={exportError} onRetry={() => void handleExport()} />}

      {isPending && <TableSkeleton columns={columns.length} rows={PAGE_SIZE} />}

      {isError && <ErrorState message="지원자 목록을 불러오지 못했습니다." onRetry={() => void refetch()} />}

      {data && data.content.length === 0 && data.totalElements === 0 && (
        <EmptyState
          message={settledKeyword || status ? "조건에 맞는 지원자가 없습니다." : "접수된 지원서가 없습니다."}
        />
      )}

      {data && data.content.length === 0 && data.totalElements > 0 && (
        <EmptyState
          message={`이 페이지에는 지원자가 없습니다. 전체 ${data.totalElements}명은 ${data.totalPages}페이지까지 있습니다.`}
          action={
            <button type="button" className={styles.backToFirst} onClick={() => setPage(0)}>
              첫 페이지로
            </button>
          }
        />
      )}

      {data && data.content.length > 0 && (
        <>
          <DataTable columns={columns} rows={data.content} rowKey={(a) => a.id} caption="지원자 목록" />
          <Pagination page={data.page} totalPages={data.totalPages} onChange={setPage} />
        </>
      )}
    </div>
  );
}
