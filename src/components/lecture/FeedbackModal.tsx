import { useState } from "react";

import { feedbackErrorMessage } from "../../errors/lecture/errorMessages";
import { useSaveFeedback, useSubmissionDetail } from "../../hooks/lecture/useFeedback";
import { formatDateTime } from "../../libs/formatDate";
import type { Feedback, SubmissionDetail } from "../../types/lecture";
import { Badge } from "../ui/Badge/Badge";
import { Button } from "../ui/Button/Button";
import { Modal, ModalBody, ModalHeader } from "../ui/Modal/Modal";
import { PaginatedModal } from "../ui/PaginatedModal/PaginatedModal";
import { TextArea } from "../ui/TextArea/TextArea";
import { ErrorState } from "../ui/states/States";

import { SubmissionFileView } from "./SubmissionFileView";
import styles from "./FeedbackModal.module.scss";

interface FormProps {
  submissionId: number;
  feedbacks: Feedback[];
  nextSubmissionId: number | null;
  onNavigate: (id: number) => void;
}

/**
 * 피드백 작성 · 수정 (8.8 · 8.9).
 *
 * **제출물마다 새로 마운트한다.** 다음 제출물로 넘어갔는데 앞사람에게 쓰던 초안이
 * 남아 있으면 엉뚱한 사람에게 그대로 저장된다.
 */
function FeedbackForm({ submissionId, feedbacks, nextSubmissionId, onNavigate }: FormProps) {
  const [content, setContent] = useState("");
  const [editingId, setEditingId] = useState<number | null>(null);
  const save = useSaveFeedback(submissionId);

  const isBlank = content.trim() === "";

  function startEdit(feedback: Feedback) {
    setEditingId(feedback.id);
    setContent(feedback.content);
  }

  function cancelEdit() {
    setEditingId(null);
    setContent("");
  }

  function submit(then?: () => void) {
    save.mutate(
      { feedbackId: editingId, content: content.trim() },
      {
        onSuccess: () => {
          cancelEdit();
          then?.();
        },
      },
    );
  }

  return (
    <>
      <div className={styles.feedbacks}>
        <h3 className={styles.sectionTitle}>피드백 {feedbacks.length > 0 && `(${feedbacks.length})`}</h3>

        {feedbacks.length === 0 ? (
          <p className={styles.hint}>아직 남긴 피드백이 없습니다.</p>
        ) : (
          <ul className={styles.feedbackList}>
            {feedbacks.map((feedback) => (
              <li key={feedback.id}>
                <div className={styles.feedbackMeta}>
                  <strong>{feedback.adminName}</strong>
                  <span>{formatDateTime(feedback.updatedAt ?? feedback.createdAt)}</span>
                  {feedback.updatedAt !== null && <span className={styles.edited}>수정됨</span>}
                  <button type="button" onClick={() => startEdit(feedback)}>
                    수정
                  </button>
                </div>
                <p className={styles.feedbackContent}>{feedback.content}</p>
              </li>
            ))}
          </ul>
        )}
      </div>

      <TextArea
        label={editingId === null ? "새 피드백" : "피드백 수정"}
        value={content}
        onChange={setContent}
        rows={4}
        disabled={save.isPending}
      />

      {editingId !== null && (
        <button type="button" className={styles.cancelEdit} onClick={cancelEdit} disabled={save.isPending}>
          수정 취소
        </button>
      )}

      {save.error !== null && <p className={styles.error}>{feedbackErrorMessage(save.error)}</p>}

      <div className={styles.actions}>
        <Button disabled={isBlank || save.isPending} onClick={() => submit()}>
          저장
        </Button>
        {/* 명세서 8.10 은 이 흐름을 위해 있다 — 한 건씩 보며 연달아 피드백을 남긴다. */}
        {nextSubmissionId !== null && (
          <Button
            variant="secondary"
            disabled={isBlank || save.isPending}
            onClick={() => submit(() => onNavigate(nextSubmissionId))}
          >
            저장 후 다음
          </Button>
        )}
      </div>
    </>
  );
}

function SubmissionBody({ detail }: { detail: SubmissionDetail }) {
  return (
    <>
      <div className={styles.who}>
        <strong>{detail.user.name}</strong>
        <span>{detail.user.major}</span>
        {/* 마감을 지킨 제출과 같이 두면 구분이 사라진다. */}
        {detail.status === "LATE" ? <Badge variant="accent">지각</Badge> : <Badge variant="info">제출</Badge>}
        <span className={styles.when}>{formatDateTime(detail.submittedAt)}</span>
      </div>

      {/* 파일·링크는 서로 배타적이다(명세서 8.7) — 제출 방식에 맞는 쪽만 온다. */}
      {detail.file !== null && <SubmissionFileView file={detail.file} />}
      {detail.linkUrl !== null && (
        <p className={styles.submissionLink}>
          <a href={detail.linkUrl} target="_blank" rel="noreferrer">
            {detail.linkUrl}
          </a>
        </p>
      )}

      {detail.comment !== "" && (
        <blockquote className={styles.comment}>
          <span className={styles.sectionTitle}>제출자 코멘트</span>
          {detail.comment}
        </blockquote>
      )}
    </>
  );
}

interface FeedbackModalProps {
  submissionId: number;
  /** 순차 탐색. 주소의 id 를 바꿔 다음 제출물을 연다. */
  onNavigate: (id: number) => void;
  onClose: () => void;
}

/** 과제 피드백 (명세서 8.7 ~ 8.10). 와이어프레임 p18 · p19. */
export function FeedbackModal({ submissionId, onNavigate, onClose }: FeedbackModalProps) {
  const { data, isPending, isError, error, refetch } = useSubmissionDetail(submissionId);

  // 아직 못 받았으면 순차 탐색 위치도 모른다. 껍데기만 먼저 그린다.
  if (isPending || isError) {
    return (
      <Modal isOpen onClose={onClose}>
        <ModalHeader title="과제 피드백" onClose={onClose} />
        <ModalBody>
          {/*
            제출물 코드(SUBMISSION_NOT_FOUND 등)는 피드백 표에 있다.
            강의 문구를 쓰면 표에 없는 코드가 되어 "강의 목록을 불러오지 못했습니다" 가 뜬다.
          */}
          {isPending ? (
            <p className={styles.hint}>불러오는 중…</p>
          ) : (
            <ErrorState message={feedbackErrorMessage(error)} onRetry={() => void refetch()} />
          )}
        </ModalBody>
      </Modal>
    );
  }

  const { navigation } = data;

  return (
    <PaginatedModal
      title={`과제 피드백 · ${data.lecture.title}`}
      onClose={onClose}
      current={navigation.current}
      total={navigation.total}
      onPrev={navigation.prevSubmissionId === null ? null : () => onNavigate(navigation.prevSubmissionId as number)}
      onNext={navigation.nextSubmissionId === null ? null : () => onNavigate(navigation.nextSubmissionId as number)}
    >
      <SubmissionBody detail={data} />
      <FeedbackForm
        // 제출물이 바뀌면 쓰던 초안을 버린다. 앞사람 것이 남으면 그대로 저장된다.
        key={data.id}
        submissionId={data.id}
        feedbacks={data.feedbacks}
        nextSubmissionId={navigation.nextSubmissionId}
        onNavigate={onNavigate}
      />
    </PaginatedModal>
  );
}
