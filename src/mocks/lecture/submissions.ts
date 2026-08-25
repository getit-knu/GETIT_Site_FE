import type { SubmissionBoard, SubmissionListParams, SubmissionRow } from "../../types/lecture";

import { lookupLecture } from "./lectures";

/**
 * 과제 제출 현황 목 데이터 (명세서 8.6).
 *
 * BE 에 admin lecture 컨트롤러가 아직 없어 화면을 먼저 만든다.
 * 강의 목록 목과 파일을 나눈 이유는 `lectures.ts` 가 이미 200줄에 가깝기 때문이다.
 *
 * **시각에는 오프셋을 붙인다.** 빼면 브라우저가 실행 환경의 시간대로 읽어 한국 밖에서는
 * 제출 시각이 밀려 보이고 지각 여부까지 다르게 읽힌다. 서버도 붙여 준다(명세서 0.3).
 */

interface Member {
  userId: number;
  userName: string;
  major: string;
  /** 조 편성 목(`mocks/group/groups.ts`)과 같은 배정이어야 조 필터를 확인할 수 있다. */
  groupId: number | null;
  /** 대상 모집단은 **강의 기수의** 활동 중인 부원이다(명세서 8.6). */
  generationId: number;
}

/*
  조 배정은 `mocks/group/groups.ts` 를 따른다 — 1조 = 21·22·23, 2조 = 24·25.
  26 번은 아직 조가 없다. 두 목이 어긋나면 조 필터로 고른 조에 엉뚱한 사람이 나온다.
*/
const MEMBERS: Member[] = [
  { userId: 21, userName: "김지원", major: "경영학과", groupId: 1, generationId: 9 },
  { userId: 22, userName: "박서연", major: "경제학과", groupId: 1, generationId: 9 },
  { userId: 23, userName: "최민준", major: "전자공학과", groupId: 1, generationId: 9 },
  { userId: 24, userName: "이재민", major: "컴퓨터공학과", groupId: 2, generationId: 9 },
  { userId: 25, userName: "정하늘", major: "통계학과", groupId: 2, generationId: 9 },
  { userId: 26, userName: "한도윤", major: "산업공학과", groupId: null, generationId: 9 },
  // 지난 기수 부원. 9기 강의의 제출 현황에 섞이면 안 된다.
  { userId: 11, userName: "오세훈", major: "경영학과", groupId: null, generationId: 8 },
  { userId: 12, userName: "임수아", major: "컴퓨터공학과", groupId: null, generationId: 8 },
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
    submittedAt: "2026-06-04T20:11:00+09:00",
    feedbackDone: true,
  },
  {
    lectureId: 101,
    userId: 22,
    submissionId: 3006,
    late: false,
    submittedAt: "2026-06-05T09:30:00+09:00",
    feedbackDone: false,
  },
  {
    lectureId: 101,
    userId: 25,
    submissionId: 3007,
    late: true,
    submittedAt: "2026-06-07T01:20:00+09:00",
    feedbackDone: false,
  },
  {
    lectureId: 102,
    userId: 21,
    submissionId: 3010,
    late: false,
    submittedAt: "2026-06-10T18:00:00+09:00",
    feedbackDone: true,
  },
];

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

  // 강의 정보는 목록 목에서 가져온다. 따로 표를 두면 새로 만든 강의를 못 찾는다.
  const lecture = lookupLecture(lectureId);
  if (lecture === undefined) throw { code: "LECTURE_NOT_FOUND", message: "강의를 찾을 수 없습니다." };

  // 대상은 그 강의 기수의 부원뿐이다(명세서 8.6).
  const all = MEMBERS.filter((m) => m.generationId === lecture.generationId).map((member) => ({
    member,
    row: toRow(member, lectureId),
  }));

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
    lecture: { id: lecture.id, title: lecture.title, deadline: lecture.deadline },
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
