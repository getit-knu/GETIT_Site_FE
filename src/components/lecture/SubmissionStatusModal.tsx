import { useState } from "react";

import { lectureErrorMessage } from "../../errors/lecture/errorMessages";
import { useGroupBoard } from "../../hooks/group/useGroups";
import { useSubmissions } from "../../hooks/lecture/useLectures";
import { formatDateTime } from "../../libs/formatDate";
import type { SubmissionRow } from "../../types/lecture";
import { Badge } from "../ui/Badge/Badge";
import type { Column } from "../ui/DataTable/DataTable";
import { DataTable } from "../ui/DataTable/DataTable";
import { Modal, ModalBody, ModalHeader } from "../ui/Modal/Modal";
import { Pagination } from "../ui/Pagination/Pagination";
import { Select } from "../ui/Select/Select";
import { EmptyState, ErrorState, TableSkeleton } from "../ui/states/States";

import styles from "./SubmissionStatusModal.module.scss";

/** 예 · 아니오 · 전체 세 가지다. `<select>` 값은 언제나 문자열이라 boolean 을 직접 못 싣는다. */
type TriState = "all" | "yes" | "no";

const TRI_OPTIONS = (yes: string, no: string) =>
  [
    { value: "all" as const, label: "전체" },
    { value: "yes" as const, label: yes },
    { value: "no" as const, label: no },
  ] as const;

function toBoolean(value: TriState): boolean | undefined {
  if (value === "all") return undefined;
  return value === "yes";
}

const COLUMNS: Column<SubmissionRow>[] = [
  { header: "이름", render: (row) => row.userName, width: "6rem" },
  { header: "학과", render: (row) => row.major },
  {
    header: "제출",
    align: "center",
    width: "6rem",
    // 지각 제출을 제출과 같이 두면 마감을 지킨 사람과 구분이 사라진다.
    render: (row) => {
      if (!row.submitted) return <Badge variant="neutral">미제출</Badge>;
      return row.status === "LATE" ? <Badge variant="accent">지각</Badge> : <Badge variant="info">제출</Badge>;
    },
  },
  {
    header: "제출 일시",
    width: "11rem",
    render: (row) => (row.submittedAt === null ? "-" : formatDateTime(row.submittedAt)),
  },
  {
    header: "피드백",
    align: "center",
    width: "5rem",
    render: (row) => (row.feedbackDone ? "완료" : "-"),
  },
];

interface SubmissionStatusModalProps {
  lectureId: number;
  onClose: () => void;
}

/**
 * 과제 제출 현황 (명세서 8.6). 와이어프레임 p17.
 *
 * **필터는 모달 안의 지역 상태다.** 모달이 열려 있는 동안만 의미가 있고, 셋을 URL 에 두면
 * 페이지 쿼리와 섞여 `useModalParams` · `useTableParams` 가 서로를 덮는 문제
 * (두 훅의 주석 참고)를 필터를 바꿀 때마다 만나게 된다. 모달의 정체(`?modal=&id=`)만
 * 주소에 남기고 나머지는 여기서 든다.
 */
export function SubmissionStatusModal({ lectureId, onClose }: SubmissionStatusModalProps) {
  const [submitted, setSubmitted] = useState<TriState>("all");
  const [feedbackDone, setFeedbackDone] = useState<TriState>("all");
  const [groupId, setGroupId] = useState(0);
  const [page, setPage] = useState(0);

  const { data, isPending, isError, error, refetch } = useSubmissions({
    lectureId,
    submitted: toBoolean(submitted),
    feedbackDone: toBoolean(feedbackDone),
    // 0 은 '전체' 를 뜻하는 화면 값이다. 서버가 아는 조 id 가 아니다.
    groupId: groupId === 0 ? undefined : groupId,
    page,
  });

  // 조 목록은 필터 선택지를 그리기 위한 것이라, 못 받아도 현황 자체는 볼 수 있어야 한다.
  const { data: groupBoard } = useGroupBoard();

  /** 필터를 좁히면 보던 페이지가 사라질 수 있다. 늘 첫 페이지로 되돌린다. */
  function change<T>(set: (value: T) => void) {
    return (value: T) => {
      set(value);
      setPage(0);
    };
  }

  return (
    <Modal isOpen onClose={onClose}>
      <ModalHeader title={data ? `제출 현황 · ${data.lecture.title}` : "제출 현황"} onClose={onClose} />

      <ModalBody>
        <div className={styles.filters}>
          <Select
            label="제출 여부"
            value={submitted}
            options={TRI_OPTIONS("제출", "미제출")}
            onChange={change(setSubmitted)}
          />
          <Select
            label="피드백"
            value={feedbackDone}
            options={TRI_OPTIONS("완료", "미완료")}
            onChange={change(setFeedbackDone)}
          />
          <Select
            label="조"
            value={groupId}
            options={[
              { value: 0, label: "전체" },
              ...(groupBoard?.groups ?? []).map((group) => ({ value: group.id, label: group.name })),
            ]}
            onChange={change(setGroupId)}
          />
        </div>

        {data && (
          <p className={styles.counts} aria-live="polite">
            제출 <strong>{data.counts.submitted}</strong> · 미제출 <strong>{data.counts.notSubmitted}</strong> · 전체{" "}
            <strong>{data.counts.total}</strong>
            <span className={styles.deadline}>마감 {formatDateTime(data.lecture.deadline)}</span>
          </p>
        )}

        {isPending && <TableSkeleton columns={COLUMNS.length} />}
        {isError && <ErrorState message={lectureErrorMessage(error)} onRetry={() => void refetch()} />}

        {data &&
          (data.content.length === 0 ? (
            <EmptyState message="조건에 맞는 부원이 없습니다." />
          ) : (
            <>
              <DataTable
                columns={COLUMNS}
                rows={data.content}
                rowKey={(row) => row.userId}
                caption={`${data.lecture.title} 과제 제출 현황`}
              />
              <Pagination page={data.page} totalPages={data.totalPages} onChange={setPage} />
            </>
          ))}
      </ModalBody>
    </Modal>
  );
}
