import { useState } from "react";
import { Link, useParams } from "react-router";

import { Button } from "../../components/ui/Button/Button";
import { TextArea } from "../../components/ui/TextArea/TextArea";
import { EmptyState } from "../../components/ui/states/States";
import {
  askQuestion,
  getMemberLectureDetail,
  submitAssignment,
  type MemberAssignment,
  type QaEntry,
} from "../../mocks/lecture/memberLectureDetail";

import styles from "./LectureDetailPage.module.scss";

/** `watch?v=` · `youtu.be/` 링크를 임베드용 iframe src로 바꾼다. 매치되지 않으면 원본을 그대로 준다. */
function toYoutubeEmbedUrl(url: string): string {
  const watchMatch = /[?&]v=([^&]+)/.exec(url);
  if (watchMatch) return `https://www.youtube.com/embed/${watchMatch[1]}`;

  const shortMatch = /youtu\.be\/([^?]+)/.exec(url);
  if (shortMatch) return `https://www.youtube.com/embed/${shortMatch[1]}`;

  return url;
}

function BackLink() {
  return (
    <Link to="/member" className={styles.backLink}>
      <svg className={styles.backIcon} viewBox="0 0 20 20" fill="none" aria-hidden="true" focusable="false">
        <path
          d="M12.5 15L7.5 10L12.5 5"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      강좌 목록으로 돌아가기
    </Link>
  );
}

interface AssignmentSectionProps {
  lectureId: number;
  assignment: MemberAssignment | null;
  /** `MemberLecture.completed` — 이 강의의 과제를 본인이 이미 제출했는지. */
  alreadySubmitted: boolean;
}

/** 과제 제출. mock이라 실제로 서버에 남지 않고, 페이지를 벗어나면 제출 상태가 사라진다. */
function AssignmentSection({ lectureId, assignment, alreadySubmitted }: AssignmentSectionProps) {
  const [file, setFile] = useState<File | null>(null);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  async function handleSubmit() {
    if (!file) return;
    setSubmitting(true);
    await submitAssignment(lectureId, file, comment);
    setSubmitting(false);
    setSubmitted(true);
  }

  return (
    <div className={styles.assignmentCard}>
      <h2 className={styles.materialsHeading}>과제 제출</h2>

      {!assignment ? (
        <p className={styles.noMaterials}>등록된 과제가 없습니다.</p>
      ) : (
        <>
          <div className={styles.assignmentInfo}>
            <h3 className={styles.assignmentTitle}>{assignment.title}</h3>
            <p className={styles.assignmentDescription}>{assignment.description}</p>
            <p className={styles.assignmentDeadline}>마감: {assignment.deadline}</p>
          </div>

          {alreadySubmitted || submitted ? (
            <p className={styles.assignmentDone}>{submitted ? "과제를 제출했습니다." : "이미 제출한 과제입니다."}</p>
          ) : (
            <>
              <label className={styles.dropzone}>
                <input
                  type="file"
                  aria-label="과제 파일 선택"
                  className={styles.visuallyHidden}
                  onChange={(event) => setFile(event.target.files?.[0] ?? null)}
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
                <span>{file ? file.name : "파일 선택하기"}</span>
              </label>

              <div className={styles.formRow}>
                <TextArea value={comment} onChange={setComment} placeholder="코멘트 (선택사항)" rows={3} />
              </div>

              <div className={styles.submitRow}>
                <Button onClick={handleSubmit} disabled={!file} isLoading={submitting}>
                  과제 제출하기
                </Button>
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
}

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
  initialQuestions: QaEntry[];
}

/** Q&A. mock이라 새로고침하면 새로 쓴 질문은 사라진다. */
function QnaSection({ lectureId, initialQuestions }: QnaSectionProps) {
  const [questions, setQuestions] = useState(initialQuestions);
  const [draft, setDraft] = useState("");
  const [asking, setAsking] = useState(false);

  async function handleAsk() {
    if (!draft.trim()) return;
    setAsking(true);
    const created = await askQuestion(lectureId, draft.trim());
    setQuestions((prev) => [...prev, created]);
    setDraft("");
    setAsking(false);
  }

  return (
    <div className={styles.qnaCard}>
      <h2 className={styles.materialsHeading}>Q&A</h2>

      {questions.length === 0 ? (
        <div className={styles.qnaEmpty}>
          <EmptyState message="등록된 질문이 없습니다." />
        </div>
      ) : (
        <ul className={styles.qnaList}>
          {questions.map((question) => (
            <li key={question.id} className={styles.qnaItem}>
              <QnaAvatar />
              <div className={styles.qnaBody}>
                <p className={styles.qnaAuthor}>{question.authorName}</p>
                <p className={styles.qnaContent}>{question.content}</p>
                {question.answer && (
                  <div className={styles.qnaAnswer}>
                    <p className={styles.qnaAnswerLabel}>답변</p>
                    <p className={styles.qnaAnswerText}>{question.answer}</p>
                  </div>
                )}
                <p className={styles.qnaDate}>{question.createdAt}</p>
              </div>
            </li>
          ))}
        </ul>
      )}

      <div className={styles.formRow}>
        <TextArea value={draft} onChange={setDraft} placeholder="질문을 입력하세요" rows={3} />
      </div>

      <div className={styles.submitRow}>
        <Button onClick={handleAsk} disabled={!draft.trim()} isLoading={asking}>
          질문하기
        </Button>
      </div>
    </div>
  );
}

/** 강의 시청. Figma 와이어프레임(`6:6528`) 기준. */
export default function LectureDetailPage() {
  const { id } = useParams();
  const lecture = getMemberLectureDetail(Number(id));

  if (!lecture) {
    return (
      <div className={styles.page}>
        <div className={styles.inner}>
          <p className={styles.notFound}>강의를 찾을 수 없습니다.</p>
          <BackLink />
        </div>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <div className={styles.headerBar}>
        <div className={styles.inner}>
          <BackLink />
        </div>
      </div>

      <div className={styles.inner}>
        <div className={styles.layout}>
          <div className={styles.main}>
            <div className={styles.videoWrapper}>
              <iframe
                className={styles.video}
                src={toYoutubeEmbedUrl(lecture.youtubeUrl)}
                title={lecture.title}
                allowFullScreen
              />
            </div>

            <div className={styles.infoCard}>
              <div className={styles.instructor}>
                <span className={styles.avatar} aria-hidden="true">
                  <svg viewBox="0 0 24 24" fill="none" focusable="false">
                    <circle cx="12" cy="8" r="3.5" fill="currentColor" />
                    <path
                      d="M5 19c0-3.314 3.134-6 7-6s7 2.686 7 6"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                    />
                  </svg>
                </span>
                <div>
                  <p className={styles.instructorName}>{lecture.instructorName}</p>
                  <p className={styles.postedDate}>{lecture.postedDate}</p>
                </div>
              </div>

              <h1 className={styles.title}>{lecture.title}</h1>

              <section>
                <h2 className={styles.sectionTitle}>학습 구성</h2>
                <p className={styles.description}>{lecture.description}</p>
              </section>
            </div>
          </div>

          <aside className={styles.sidebar}>
            <div className={styles.materialsCard}>
              <h2 className={styles.materialsHeading}>강의 자료</h2>

              {lecture.materials.length === 0 ? (
                <p className={styles.noMaterials}>등록된 자료가 없습니다.</p>
              ) : (
                <ul className={styles.materialsList}>
                  {lecture.materials.map((file) => (
                    <li key={file.fileId}>
                      <a className={styles.materialLink} href={file.url} target="_blank" rel="noreferrer">
                        <span>{file.displayName}</span>
                        <svg
                          className={styles.materialIcon}
                          viewBox="0 0 18 18"
                          fill="none"
                          aria-hidden="true"
                          focusable="false"
                        >
                          <path
                            d="M9 2v9m0 0l-3-3m3 3l3-3M3 15h12"
                            stroke="currentColor"
                            strokeWidth="1.3"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                      </a>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <AssignmentSection
              lectureId={lecture.id}
              assignment={lecture.assignment}
              alreadySubmitted={lecture.completed}
            />

            <QnaSection lectureId={lecture.id} initialQuestions={lecture.questions} />
          </aside>
        </div>
      </div>
    </div>
  );
}
