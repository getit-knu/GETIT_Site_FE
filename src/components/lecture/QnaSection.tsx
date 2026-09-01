import { useState } from "react";

import { lectureErrorMessage, questionSaveErrorMessage } from "../../errors/lecture/errorMessages";
import { useCreateLectureQuestion, useMyLectureQuestions } from "../../hooks/lecture/useMemberLectures";
import { formatDateTime } from "../../libs/formatDate";
import { Button } from "../ui/Button/Button";
import { TextArea } from "../ui/TextArea/TextArea";
import { EmptyState, ErrorState, TextSkeleton } from "../ui/states/States";
// AssignmentSection과 같은 이유로 LectureDetailPage의 스타일 모듈을 그대로 쓴다.
import styles from "../../pages/member/LectureDetailPage.module.scss";

function QnaAvatar() {
  return (
    <span className={styles.qnaAvatar} aria-hidden="true">
      <svg viewBox="0 0 24 24" fill="none" focusable="false">
        <circle cx="12" cy="8" r="3.5" fill="currentColor" />
        <path d="M5 19c0-3.314 3.134-6 7-6s7 2.686 7 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    </span>
  );
}

interface QnaSectionProps {
  lectureId: number;
}

/** 강의 Q&A(4.6·4.7). **본인이 이 강의에 남긴 질문만** 보인다 — 다른 부원 질문은 안 보인다. */
export function QnaSection({ lectureId }: QnaSectionProps) {
  const { data: questions, isPending, isError, error, refetch } = useMyLectureQuestions(lectureId);
  const createQuestion = useCreateLectureQuestion(lectureId);
  const [draft, setDraft] = useState("");

  function handleAsk() {
    const content = draft.trim();
    if (content === "") return;
    createQuestion.mutate(content, { onSuccess: () => setDraft("") });
  }

  return (
    <div className={styles.qnaCard}>
      <h2 className={styles.materialsHeading}>내 질문</h2>

      {isPending ? (
        <TextSkeleton lines={4} label="질문 목록 불러오는 중" />
      ) : isError ? (
        <ErrorState message={lectureErrorMessage(error)} onRetry={() => void refetch()} />
      ) : questions.length === 0 ? (
        <div className={styles.qnaEmpty}>
          <EmptyState message="등록된 질문이 없습니다." />
        </div>
      ) : (
        <ul className={styles.qnaList}>
          {questions.map((question) => (
            <li key={question.id} className={styles.qnaItem}>
              <QnaAvatar />
              <div className={styles.qnaBody}>
                <p className={styles.qnaContent}>{question.content}</p>
                {question.answers.map((answer) => (
                  <div key={answer.id} className={styles.qnaAnswer}>
                    <p className={styles.qnaAnswerLabel}>{answer.adminName}의 답변</p>
                    <p className={styles.qnaAnswerText}>{answer.content}</p>
                  </div>
                ))}
                <p className={styles.qnaDate}>{formatDateTime(question.createdAt)}</p>
              </div>
            </li>
          ))}
        </ul>
      )}

      <div className={styles.formRow}>
        <TextArea value={draft} onChange={setDraft} placeholder="질문을 입력하세요" rows={3} />
      </div>

      <div className={styles.submitRow}>
        <Button onClick={handleAsk} disabled={draft.trim() === ""} isLoading={createQuestion.isPending}>
          질문하기
        </Button>
      </div>
      {createQuestion.error !== null && (
        <p className={styles.uploadError}>{questionSaveErrorMessage(createQuestion.error)}</p>
      )}
    </div>
  );
}
