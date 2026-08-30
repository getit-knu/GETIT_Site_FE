import { useState } from "react";

import { answerSaveErrorMessage, questionErrorMessage } from "../../errors/qna/errorMessages";
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
  const { mutate, isPending: isSaving, error: saveError } = useSaveAnswer(question.id);

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

        {saveError !== null && <p className={styles.reason}>{answerSaveErrorMessage(saveError)}</p>}
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
  const { data: question, isPending, isError, error, refetch } = useQuestion(questionId);

  // 상세가 오기 전에는 답변이 있는지 알 수 없다. 그때 `답변 작성` 으로 단정하면
  // 이미 답변한 질문을 열었을 때 제목이 `작성` → `수정` 으로 바뀌어 깜빡인다.
  // 모르는 동안에는 양쪽 다 맞는 말만 한다.
  const title = question === undefined ? "답변" : question.answer ? "답변 수정" : "답변 작성";

  return (
    <Modal isOpen onClose={onClose}>
      <ModalHeader title={title} onClose={onClose} />

      {isPending && (
        <ModalBody>
          <p className={styles.loading}>불러오는 중…</p>
        </ModalBody>
      )}

      {isError && (
        <ModalBody>
          <ErrorState message={questionErrorMessage(error)} onRetry={() => void refetch()} />
        </ModalBody>
      )}

      {question && <AnswerForm question={question} onClose={onClose} />}
    </Modal>
  );
}
