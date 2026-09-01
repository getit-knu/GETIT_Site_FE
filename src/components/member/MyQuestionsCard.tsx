import { Link } from "react-router";

import { useMyQuestions } from "../../hooks/qna/useMyQuestions";
import { formatDateTime } from "../../libs/formatDate";
import type { MyQuestion } from "../../types/lecture";
import { TextSkeleton } from "../ui/states/States";

import styles from "./MyQuestionsCard.module.scss";

/** 답변이 달렸는지. 답변 개수로 세지 않는다 — 그 판정은 서버 `status` 가 한다. */
function answered(question: MyQuestion): boolean {
  return question.status === "ANSWERED";
}

/**
 * 부원 대시보드 "내 질문"(#279).
 *
 * **강의를 가로지르는 조회가 서버에 아직 없다**(`getit-knu/GETIT_Site_BE#185`). 그때까지
 * 이 카드는 조회에 실패하는데, 대시보드의 나머지(학습 통계 · 제출 내역)까지 같이 무너지면
 * 안 되므로 이 카드 안에서만 실패를 알린다.
 */
export function MyQuestionsCard() {
  const { data, isPending, isError } = useMyQuestions();

  return (
    <div className={styles.card}>
      <h3 className={styles.title}>내 질문</h3>

      {isPending && <TextSkeleton lines={3} label="내 질문 불러오는 중" />}
      {isError && <p className={styles.hint}>질문을 불러오지 못했습니다.</p>}

      {data && data.content.length === 0 && <p className={styles.hint}>아직 남긴 질문이 없습니다.</p>}

      {data && data.content.length > 0 && (
        <ul className={styles.list}>
          {data.content.map((question) => (
            <li key={question.id} className={styles.item}>
              {/* 누르면 그 질문이 달린 강의로 간다. 목록만 봐선 어느 강의인지 알 수 없다. */}
              <Link viewTransition to={`/member/lectures/${question.lectureId}`} className={styles.link}>
                <span className={styles.lecture}>{question.lectureTitle}</span>
                <span className={styles.content}>{question.content}</span>
                <span className={styles.meta}>
                  <span className={answered(question) ? styles.answered : styles.waiting}>
                    {answered(question) ? "답변 완료" : "답변 대기"}
                  </span>
                  <span>{formatDateTime(question.createdAt)}</span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
