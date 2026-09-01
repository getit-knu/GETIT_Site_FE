import { useState } from "react";

import { uploadFile, uploadInvalidReason } from "../../apis/file/filesApi";
import { getMemberMaterialDownloadUrl } from "../../apis/lecture/memberLecturesApi";
import { fileErrorMessage } from "../../errors/file/errorMessages";
import { lectureErrorMessage, submissionSaveErrorMessage } from "../../errors/lecture/errorMessages";
import { useResubmitAssignment, useSubmitAssignment } from "../../hooks/lecture/useMemberLectures";
import { formatDateTime } from "../../libs/formatDate";
import type { MemberAssignmentInfo, MemberMaterial, MemberMySubmission } from "../../types/lecture";
import { Button } from "../ui/Button/Button";
import { Input } from "../ui/Input/Input";
import { Markdown } from "../ui/Markdown/Markdown";
import { TextArea } from "../ui/TextArea/TextArea";
// 강의 시청 페이지(`LectureDetailPage`)와 클래스를 공유한다 — 자료·과제 UI가 그 페이지
// 레이아웃 안에서만 쓰이고 시각적으로 한 몸이라, 분리한 뒤에도 같은 스타일 모듈을 그대로 쓴다.
import styles from "../../pages/member/LectureDetailPage.module.scss";

interface MaterialLinkProps {
  lectureId: number;
  material: MemberMaterial;
}

/**
 * 자료 링크. `material`엔 고정 url이 없다 — 비공개 저장소라 클릭할 때마다 짧게 사는
 * 다운로드 주소를 새로 받아야 한다(명세서 4.3).
 */
export function MaterialLink({ lectureId, material }: MaterialLinkProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleClick() {
    setLoading(true);
    setError(null);
    try {
      const { downloadUrl } = await getMemberMaterialDownloadUrl(lectureId, material.fileId);
      window.open(downloadUrl, "_blank", "noopener,noreferrer");
    } catch (caught) {
      setError(lectureErrorMessage(caught));
    } finally {
      setLoading(false);
    }
  }

  return (
    <li>
      <button type="button" className={styles.materialLink} onClick={() => void handleClick()} disabled={loading}>
        <span>{material.displayName}</span>
        <svg className={styles.materialIcon} viewBox="0 0 18 18" fill="none" aria-hidden="true" focusable="false">
          <path
            d="M9 2v9m0 0l-3-3m3 3l3-3M3 15h12"
            stroke="currentColor"
            strokeWidth="1.3"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>
      {error !== null && <p className={styles.uploadError}>{error}</p>}
    </li>
  );
}

interface SubmissionSummaryProps {
  submission: MemberMySubmission;
  onEdit: () => void;
}

function SubmissionSummary({ submission, onEdit }: SubmissionSummaryProps) {
  return (
    <>
      <p className={styles.assignmentDone}>
        {submission.status === "LATE" ? "지각 제출했습니다" : "제출했습니다"} · {formatDateTime(submission.submittedAt)}
      </p>
      {submission.fileUrl !== null && (
        <a className={styles.materialLink} href={submission.fileUrl} target="_blank" rel="noreferrer">
          <span>{submission.fileName}</span>
        </a>
      )}
      {submission.linkUrl !== null && (
        <a className={styles.materialLink} href={submission.linkUrl} target="_blank" rel="noreferrer">
          <span>{submission.linkUrl}</span>
        </a>
      )}
      {submission.comment !== "" && <p className={styles.assignmentDescription}>{submission.comment}</p>}

      {submission.feedbacks.length > 0 && (
        <ul className={styles.feedbackList}>
          {submission.feedbacks.map((feedback) => (
            <li key={feedback.id} className={styles.feedbackItem}>
              <p className={styles.feedbackAuthor}>{feedback.adminName}</p>
              <p className={styles.feedbackContent}>{feedback.content}</p>
              <p className={styles.feedbackDate}>{formatDateTime(feedback.createdAt)}</p>
            </li>
          ))}
        </ul>
      )}

      <div className={styles.submitRow}>
        <Button onClick={onEdit}>다시 제출하기</Button>
      </div>
    </>
  );
}

interface SubmissionFormProps {
  lectureId: number;
  assignment: MemberAssignmentInfo;
  mySubmission: MemberMySubmission | null;
  onDone: () => void;
}

function SubmissionForm({ lectureId, assignment, mySubmission, onDone }: SubmissionFormProps) {
  const [fileId, setFileId] = useState<number | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [linkUrl, setLinkUrl] = useState("");
  const [comment, setComment] = useState("");

  const submit = useSubmitAssignment(lectureId);
  const resubmit = useResubmitAssignment(lectureId);
  const saving = submit.isPending || resubmit.isPending;
  const saveError = submit.error ?? resubmit.error;

  async function handleFileChange(file: File) {
    // 서버도 막지만, 다 올린 뒤에 거절당하면 기다린 시간이 헛되다.
    const reason = uploadInvalidReason(file, "ASSIGNMENT");
    if (reason !== null) {
      setUploadError(reason);
      return;
    }

    setUploadError(null);
    setUploading(true);
    try {
      const result = await uploadFile(file, "ASSIGNMENT");
      setFileId(result.fileId);
      setFileName(result.fileName);
    } catch (caught) {
      setUploadError(fileErrorMessage(caught));
    } finally {
      setUploading(false);
    }
  }

  const canSubmit = !uploading && (fileId !== null || linkUrl.trim() !== "");

  function handleSubmit() {
    const payload = { fileId, linkUrl: linkUrl.trim() === "" ? null : linkUrl.trim(), comment };
    if (mySubmission) {
      resubmit.mutate({ submissionId: mySubmission.id, payload }, { onSuccess: onDone });
    } else {
      submit.mutate({ assignmentId: assignment.id, payload }, { onSuccess: onDone });
    }
  }

  return (
    <>
      <label className={styles.dropzone}>
        <input
          type="file"
          aria-label="과제 파일 선택"
          className={styles.visuallyHidden}
          disabled={uploading}
          onChange={(event) => {
            const file = event.target.files?.[0];
            // 같은 파일을 다시 골라도 change 가 오도록 값을 비운다.
            event.target.value = "";
            if (file) void handleFileChange(file);
          }}
        />
        <svg viewBox="0 0 28 28" fill="none" aria-hidden="true" focusable="false">
          <path
            d="M14 4v14m0 0l-5-5m5 5l5-5M6 22h16"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
        <span>{uploading ? "올리는 중…" : (fileName ?? "파일 선택하기")}</span>
      </label>
      {uploadError !== null && <p className={styles.uploadError}>{uploadError}</p>}

      <div className={styles.formRow}>
        <Input label="링크 (선택사항)" value={linkUrl} onChange={setLinkUrl} placeholder="https://..." />
      </div>

      <div className={styles.formRow}>
        <TextArea value={comment} onChange={setComment} placeholder="코멘트 (선택사항)" rows={3} />
      </div>

      <div className={styles.submitRow}>
        <Button onClick={handleSubmit} disabled={!canSubmit} isLoading={saving}>
          {mySubmission ? "다시 제출하기" : "과제 제출하기"}
        </Button>
      </div>
      {saveError !== null && <p className={styles.uploadError}>{submissionSaveErrorMessage(saveError)}</p>}
    </>
  );
}

interface AssignmentSectionProps {
  lectureId: number;
  assignment: MemberAssignmentInfo | null;
  mySubmission: MemberMySubmission | null;
}

export function AssignmentSection({ lectureId, assignment, mySubmission }: AssignmentSectionProps) {
  // 이미 제출한 게 있으면 요약부터 보여주고, "다시 제출하기"를 눌러야 폼이 나온다.
  const [editing, setEditing] = useState(mySubmission === null);

  return (
    <div className={styles.assignmentCard}>
      <h2 className={styles.materialsHeading}>과제 제출</h2>

      {!assignment ? (
        <p className={styles.noMaterials}>등록된 과제가 없습니다.</p>
      ) : (
        <>
          <div className={styles.assignmentInfo}>
            <h3 className={styles.assignmentTitle}>{assignment.title}</h3>
            <Markdown className={styles.assignmentDescription} content={assignment.description} />
            <p className={styles.assignmentDeadline}>마감: {formatDateTime(assignment.deadline)}</p>
          </div>

          {mySubmission !== null && !editing ? (
            <SubmissionSummary submission={mySubmission} onEdit={() => setEditing(true)} />
          ) : (
            <SubmissionForm
              lectureId={lectureId}
              assignment={assignment}
              mySubmission={mySubmission}
              onDone={() => setEditing(false)}
            />
          )}
        </>
      )}
    </div>
  );
}
