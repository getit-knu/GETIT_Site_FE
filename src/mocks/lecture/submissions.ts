import type { SubmissionBoard, SubmissionListParams, SubmissionRow } from "../../types/lecture";

/**
 * 과제 제출 현황 목 (명세서 8.6).
 *
 * BE 에 admin lecture 컨트롤러가 아직 없어 화면을 먼저 만든다.
 * 강의 목록 목과 파일을 나눈 이유는 `lectures.ts` 가 이미 200줄에 가깝기 때문이다.
 */

interface Member {
  userId: number;
  userName: string;
  major: string;
  groupId: number;
}

/** 대상 모집단은 기수의 활동 중인 부원 전체다. 미제출자도 이 명단에서 나온다. */
const MEMBERS: Member[] = [
  { userId: 21, userName: "김지원", major: "경영학과", groupId: 1 },
  { userId: 22, userName: "박서연", major: "경제학과", groupId: 1 },
  { userId: 23, userName: "최민준", major: "전자공학과", groupId: 2 },
  { userId: 24, userName: "이재민", major: "컴퓨터공학과", groupId: 2 },
  { userId: 25, userName: "정하늘", major: "통계학과", groupId: 3 },
  { userId: 26, userName: "한도윤", major: "산업공학과", groupId: 3 },
];

interface StoredSubmission {
  lectureId: number;
  userId: number;
  submissionId: number;
  /** 마감을 넘겨 낸 것은 LATE 다. 낸 것과 같이 볼 수 없다. */
  late: boolean;
  submittedAt: string;
  feedbackDone: boolean;
}

const SUBMISSIONS: StoredSubmission[] = [
  {
    lectureId: 101,
    userId: 24,
    submissionId: 3005,
    late: false,
    submittedAt: "2026-06-04T20:11:00",
    feedbackDone: true,
  },
  {
    lectureId: 101,
    userId: 22,
    submissionId: 3006,
    late: false,
    submittedAt: "2026-06-05T09:30:00",
    feedbackDone: false,
  },
  {
    lectureId: 101,
    userId: 25,
    submissionId: 3007,
    late: true,
    submittedAt: "2026-06-07T01:20:00",
    feedbackDone: false,
  },
  {
    lectureId: 102,
    userId: 21,
    submissionId: 3010,
    late: false,
    submittedAt: "2026-06-10T18:00:00",
    feedbackDone: true,
  },
];

const LECTURES: Record<number, { id: number; title: string; deadline: string }> = {
  101: { id: 101, title: "HTML/CSS 기초", deadline: "2026-06-05T23:59:59" },
  102: { id: 102, title: "Express 라우팅", deadline: "2026-06-12T23:59:59" },
  103: { id: 103, title: "React 상태 관리", deadline: "2026-06-19T23:59:59" },
  210: { id: 210, title: "창업 빌드업 4차시", deadline: "2026-09-01T23:59:59" },
  310: { id: 310, title: "금융 IT 세미나", deadline: "2026-07-01T23:59:59" },
};

const PAGE_SIZE = 50;
const delay = () => new Promise((r) => setTimeout(r, 200));

function toRow(member: Member, lectureId: number): SubmissionRow {
  const found = SUBMISSIONS.find((s) => s.lectureId === lectureId && s.userId === member.userId);

  if (found === undefined) {
    return {
      userId: member.userId,
      userName: member.userName,
      major: member.major,
      submissionId: null,
      submitted: false,
      status: null,
      submittedAt: null,
      feedbackDone: false,
    };
  }

  return {
    userId: member.userId,
    userName: member.userName,
    major: member.major,
    submissionId: found.submissionId,
    submitted: true,
    status: found.late ? "LATE" : "SUBMITTED",
    submittedAt: found.submittedAt,
    feedbackDone: found.feedbackDone,
  };
}

export async function fetchSubmissions(params: SubmissionListParams): Promise<SubmissionBoard> {
  await delay();
  const { lectureId, submitted, feedbackDone, groupId, page = 0 } = params;

  const lecture = LECTURES[lectureId];
  if (lecture === undefined) throw { code: "LECTURE_NOT_FOUND", message: "강의를 찾을 수 없습니다." };

  const all = MEMBERS.map((m) => ({ member: m, row: toRow(m, lectureId) }));

  // 집계는 필터와 무관하게 전체 기준이다 — 필터를 걸었다고 모집단이 줄지 않는다.
  const submittedCount = all.filter(({ row }) => row.submitted).length;
  const counts = {
    submitted: submittedCount,
    notSubmitted: all.length - submittedCount,
    total: all.length,
  };

  const filtered = all
    .filter(({ member, row }) => {
      if (submitted !== undefined && row.submitted !== submitted) return false;
      if (feedbackDone !== undefined && row.feedbackDone !== feedbackDone) return false;
      if (groupId !== undefined && member.groupId !== groupId) return false;
      return true;
    })
    .map(({ row }) => row);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const content = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  return {
    lecture,
    counts,
    content,
    page,
    size: PAGE_SIZE,
    totalElements: filtered.length,
    totalPages,
    first: page === 0,
    last: page >= totalPages - 1,
  };
}
