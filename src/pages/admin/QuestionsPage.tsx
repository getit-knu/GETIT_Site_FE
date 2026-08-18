import { QuestionAnswerModal } from "../../components/qna/QuestionAnswerModal";
import { Badge } from "../../components/ui/Badge/Badge";
import { DataTable, type Column } from "../../components/ui/DataTable/DataTable";
import { Pagination } from "../../components/ui/Pagination/Pagination";
import { EmptyState, ErrorState, TableSkeleton } from "../../components/ui/states/States";
import { useQuestions } from "../../hooks/qna/useQuestions";
import { useModalParams } from "../../hooks/ui/useModalParams";
import { useTableParams } from "../../hooks/ui/useTableParams";
import { formatDateTime } from "../../libs/formatDate";
import type { QuestionListItem, QuestionStatus } from "../../types/qna";

import styles from "./QuestionsPage.module.scss";

const PAGE_SIZE = 10;

const STATUS_VALUES = ["PENDING", "ANSWERED"] as const;

const STATUS_TABS: { value: QuestionStatus | undefined; label: string }[] = [
  { value: undefined, label: "전체" },
  { value: "PENDING", label: "미답변" },
  { value: "ANSWERED", label: "답변완료" },
];

/** 와이어프레임 p11. */
export default function QuestionsPage() {
  const { page, filter: status, setPage, setFilter: setStatus } = useTableParams("status", STATUS_VALUES);
  const { modal, id, openModal, closeModal } = useModalParams();

  const params = { status, page, size: PAGE_SIZE };
  const { data, isPending, isError, refetch } = useQuestions(params);

  const columns: Column<QuestionListItem>[] = [
    { header: "번호", render: (q) => q.no, width: "4rem", align: "center" },
    { header: "질문자", render: (q) => q.authorName, width: "7rem" },
    { header: "전공", render: (q) => q.major, width: "9rem" },
    {
      header: "내용",
      render: (q) => (
        <span className={styles.content} title={q.content}>
          {q.content}
        </span>
      ),
    },
    { header: "일시", render: (q) => formatDateTime(q.createdAt), width: "10rem" },
    {
      header: "상태",
      width: "6rem",
      align: "center",
      render: (q) => (
        // 표기는 서버가 준 statusLabel 을 그대로 쓴다. 색만 상태로 정한다.
        <Badge variant={q.status === "PENDING" ? "info" : "neutral"}>{q.statusLabel}</Badge>
      ),
    },
    {
      header: "답변",
      width: "5rem",
      align: "center",
      render: (q) => (
        <button
          type="button"
          className={styles.answerButton}
          onClick={() => openModal("answer", q.id)}
          aria-label={`${q.authorName}의 질문에 답변하기`}
        >
          💬
        </button>
      ),
    },
  ];

  return (
    <div className={styles.page}>
      <div className={styles.tabs} role="tablist" aria-label="답변 상태">
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

      {isPending && <TableSkeleton columns={columns.length} rows={PAGE_SIZE} />}

      {isError && <ErrorState message="질문 목록을 불러오지 못했습니다." onRetry={() => void refetch()} />}

      {/*
        비어 있는 이유가 두 가지다. 조건에 맞는 질문이 아예 없는 경우와,
        결과는 있는데 범위를 벗어난 페이지를 보고 있는 경우(`?page=99`)다.
        둘을 같은 문구로 알리면 "질문이 없다"고 잘못 읽힌다.
      */}
      {data && data.content.length === 0 && data.totalElements === 0 && (
        <EmptyState message={status ? "해당 상태의 질문이 없습니다." : "등록된 질문이 없습니다."} />
      )}

      {data && data.content.length === 0 && data.totalElements > 0 && (
        <EmptyState
          message={`이 페이지에는 질문이 없습니다. 전체 ${data.totalElements}건은 ${data.totalPages}페이지까지 있습니다.`}
          action={
            <button type="button" className={styles.backToFirst} onClick={() => setPage(0)}>
              첫 페이지로
            </button>
          }
        />
      )}

      {data && data.content.length > 0 && (
        <>
          <DataTable columns={columns} rows={data.content} rowKey={(q) => q.id} caption="Q&A 목록" />
          <Pagination page={data.page} totalPages={data.totalPages} onChange={setPage} />
        </>
      )}

      {modal === "answer" && id !== null && <QuestionAnswerModal questionId={id} onClose={closeModal} />}
    </div>
  );
}
