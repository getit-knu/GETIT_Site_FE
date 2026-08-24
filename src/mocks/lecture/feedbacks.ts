import type { Feedback, NavigateParams, SubmissionDetail, SubmissionNavigation } from "../../types/lecture";

/**
 * 과제 피드백 목 (명세서 8.7 ~ 8.10).
 *
 * BE 에 admin lecture 컨트롤러가 아직 없어 화면을 먼저 만든다.
 *
 * **시각에는 오프셋을 붙인다.** 빼면 브라우저가 실행 환경의 시간대로 읽어
 * 한국 밖에서는 다른 시각이 표시된다. 서버도 오프셋을 붙여 준다(명세서 0.3).
 */

interface StoredSubmission {
  detail: Omit<SubmissionDetail, "feedbacks" | "navigation">;
  /** 순차 탐색 순서. 목록 필터를 흉내 내지 않고 강의별 고정 순서만 둔다. */
  lectureId: number;
}

const SUBMISSIONS: StoredSubmission[] = [
  {
    lectureId: 101,
    detail: {
      id: 3005,
      lecture: { id: 101, title: "HTML/CSS 기초" },
      user: { id: 24, name: "이재민", major: "컴퓨터공학과" },
      file: {
        fileId: 601,
        fileName: "week1.zip",
        url: "https://cdn.getit.com/submissions/3005.zip",
        // zip 은 인라인으로 못 본다. 내려받기만 된다.
        previewUrl: null,
        contentType: "application/zip",
        size: 512000,
        previewable: false,
      },
      comment: "부족한 부분이 있으면 알려주세요.",
      submittedAt: "2026-06-04T20:11:00+09:00",
      status: "SUBMITTED",
    },
  },
  {
    lectureId: 101,
    detail: {
      id: 3006,
      lecture: { id: 101, title: "HTML/CSS 기초" },
      user: { id: 22, name: "박서연", major: "경제학과" },
      file: {
        fileId: 602,
        fileName: "intro.pdf",
        url: "https://cdn.getit.com/submissions/3006.pdf",
        previewUrl: "https://cdn.getit.com/preview/3006.pdf",
        contentType: "application/pdf",
        size: 240000,
        previewable: true,
      },
      comment: "",
      submittedAt: "2026-06-05T09:30:00+09:00",
      status: "SUBMITTED",
    },
  },
  {
    lectureId: 101,
    detail: {
      id: 3007,
      lecture: { id: 101, title: "HTML/CSS 기초" },
      user: { id: 25, name: "정하늘", major: "통계학과" },
      file: {
        fileId: 603,
        fileName: "late.png",
        url: "https://cdn.getit.com/submissions/3007.png",
        previewUrl: "https://cdn.getit.com/preview/3007.png",
        contentType: "image/png",
        size: 88000,
        previewable: true,
      },
      comment: "늦어서 죄송합니다.",
      submittedAt: "2026-06-07T01:20:00+09:00",
      status: "LATE",
    },
  },
];

const FEEDBACKS: Feedback[] = [
  {
    id: 9001,
    adminId: 3,
    adminName: "김운영",
    content: "구조가 깔끔합니다.",
    createdAt: "2026-06-06T10:00:00+09:00",
    updatedAt: null,
  },
];

/** 어느 제출물의 피드백인지. 응답에는 들어가지 않아 따로 든다. */
const FEEDBACK_OWNER = new Map<number, number>([[9001, 3005]]);

let nextFeedbackId = 9002;
const delay = () => new Promise((r) => setTimeout(r, 200));

function orderOf(lectureId: number): StoredSubmission[] {
  return SUBMISSIONS.filter((s) => s.lectureId === lectureId);
}

function navigationOf(submissionId: number): SubmissionNavigation {
  const found = SUBMISSIONS.find((s) => s.detail.id === submissionId);
  if (found === undefined) return { current: 0, total: 0, prevSubmissionId: null, nextSubmissionId: null };

  const order = orderOf(found.lectureId);
  const at = order.findIndex((s) => s.detail.id === submissionId);

  return {
    current: at + 1,
    total: order.length,
    prevSubmissionId: at > 0 ? order[at - 1].detail.id : null,
    nextSubmissionId: at < order.length - 1 ? order[at + 1].detail.id : null,
  };
}

export async function fetchSubmissionDetail(id: number): Promise<SubmissionDetail> {
  await delay();
  const found = SUBMISSIONS.find((s) => s.detail.id === id);
  if (found === undefined) throw { code: "SUBMISSION_NOT_FOUND", message: "제출물을 찾을 수 없습니다." };

  const feedbacks = FEEDBACKS.filter((f) => FEEDBACK_OWNER.get(f.id) === id);
  return { ...structuredClone(found.detail), feedbacks: structuredClone(feedbacks), navigation: navigationOf(id) };
}

export async function createFeedback(submissionId: number, content: string): Promise<Feedback> {
  await delay();
  if (SUBMISSIONS.every((s) => s.detail.id !== submissionId)) {
    throw { code: "SUBMISSION_NOT_FOUND", message: "제출물을 찾을 수 없습니다." };
  }

  const feedback: Feedback = {
    id: nextFeedbackId++,
    adminId: 3,
    adminName: "김운영",
    content,
    createdAt: new Date().toISOString(),
    updatedAt: null,
  };
  FEEDBACKS.push(feedback);
  FEEDBACK_OWNER.set(feedback.id, submissionId);
  return structuredClone(feedback);
}

export async function updateFeedback(feedbackId: number, content: string): Promise<Feedback> {
  await delay();
  const found = FEEDBACKS.find((f) => f.id === feedbackId);
  if (found === undefined) throw { code: "FEEDBACK_NOT_FOUND", message: "피드백을 찾을 수 없습니다." };

  found.content = content;
  found.updatedAt = new Date().toISOString();
  return structuredClone(found);
}

export async function navigate(params: NavigateParams): Promise<SubmissionNavigation> {
  await delay();
  return navigationOf(params.currentSubmissionId);
}
