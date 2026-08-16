import { useState } from "react";

import { useQuestion, useSaveAnswer } from "../../hooks/qna/useQuestions";
import { formatDateTime } from "../../libs/formatDate";
import type { QuestionDetail } from "../../types/qna";
import { Button } from "../ui/Button/Button";
import { Modal, ModalBody, ModalFooter, ModalHeader } from "../ui/Modal/Modal";
import { ErrorState } from "../ui/states/States";
import { TextArea } from "../ui/TextArea/TextArea";

import styles from "./QuestionAnswerModal.module.scss";

const MAX_LENGTH = 1000;

/**
 * 답변 입력 폼.
 *
 * **상세가 도착한 뒤에만 마운트한다.** 그래야 `useState` 초기값으로 기존 답변을 넣을 수 있다.
 * 바깥에서 `useEffect` 로 채우면 사용자가 입력하는 도중에 값이 덮일 수 있고,
 * effect 안에서 상태를 바꾸는 만큼 렌더가 한 번 더 돈다.
 */
function AnswerForm({ question, onClose }: { question: QuestionDetail; onClose: () => void }) {
  const [content, setContent] = useState(question.answer?.content ?? "");
  const { mutate, isPending: isSaving } = useSaveAnswer(question.id);

  const isEdit = question.answer !== null;
  const trimmed = content.trim();

  function handleSubmit() {
    if (!trimmed) return;
    mutate({ content: trimmed, isEdit }, { onSuccess: onClose });
  }

  return (
    <>
      <ModalBody>
        <dl className={styles.meta}>
          <div>
            <dt>이름</dt>
            <dd>{question.author.name}</dd>
          </div>
          <div>
            <dt>전공</dt>
            <dd>{question.author.major}</dd>
          </div>
          <div>
            <dt>작성일</dt>
            <dd>{formatDateTime(question.createdAt)}</dd>
          </div>
          {question.lecture && (
            <div>
              <dt>강의</dt>
              <dd>{question.lecture.title}</dd>
            </div>
          )}
        </dl>

        <p className={styles.question}>{question.content}</p>

        <TextArea
          label="답변"
          value={content}
          onChange={setContent}
          placeholder="답변을 입력하세요."
          rows={6}
          maxLength={MAX_LENGTH}
          disabled={isSaving}
        />
      </ModalBody>

      <ModalFooter>
        <Button variant="secondary" onClick={onClose} disabled={isSaving}>
          취소
        </Button>
        <Button onClick={handleSubmit} disabled={isSaving || !trimmed}>
          {isEdit ? "답변 수정 완료!" : "답변 작성 완료!"}
        </Button>
      </ModalFooter>
    </>
  );
}

interface QuestionAnswerModalProps {
  questionId: number;
  onClose: () => void;
}

/**
 * 와이어프레임 p16. 질문자 정보 → 질문 내용 → 답변 작성.
 *
 * 이미 답변한 질문이면 기존 답변을 채워 수정 모드로 연다.
 */
export function QuestionAnswerModal({ questionId, onClose }: QuestionAnswerModalProps) {
  const { data: question, isPending, isError, refetch } = useQuestion(questionId);

  return (
    <Modal isOpen onClose={onClose}>
      <ModalHeader title={question?.answer ? "답변 수정" : "답변 작성"} onClose={onClose} />

      {isPending && (
        <ModalBody>
          <p className={styles.loading}>불러오는 중…</p>
        </ModalBody>
      )}

      {isError && (
        <ModalBody>
          <ErrorState message="질문을 불러오지 못했습니다." onRetry={() => void refetch()} />
        </ModalBody>
      )}

      {question && <AnswerForm question={question} onClose={onClose} />}
    </Modal>
  );
}
