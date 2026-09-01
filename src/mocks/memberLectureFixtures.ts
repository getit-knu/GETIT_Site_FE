import type { Group } from "../types/group";
import type { MemberLectureBoard, MemberTrack, MyQuestion } from "../types/lecture";
import type { MemberProject } from "../types/project";
import type { MySummary } from "../types/member";
import type { Page } from "../types/qna";

/**
 * 개발용 부원 강의 목 데이터. **dev 서버에서만 쓰인다**(`fixtures.ts` 상단 설명 참고).
 *
 * `fixtures.ts` 에서 떼어냈다 — 강의 카드는 `deadline`·`durationMinutes`·`subCategoryName`
 * 이 각각 `null` 일 수 있어 조합을 다 넣으면 목록이 길고, 트랙·소분류와 짝이 맞아야 해서
 * 한 덩어리로 같이 읽는 편이 낫다.
 */

/** `GET /api/member/tracks`. 소분류가 비어 있는 트랙도 실제로 온다(#193) — 그 경우도 섞는다. */
export const memberTracks: MemberTrack[] = [
  {
    id: 1,
    name: "웹",
    subCategories: [
      { id: 11, name: "프론트엔드" },
      { id: 12, name: "백엔드" },
    ],
  },
  { id: 2, name: "AI", subCategories: [{ id: 21, name: "머신러닝" }] },
  // 창업 빌드업·세미나처럼 소분류가 없는 트랙. 탭 줄을 그리지 않는 분기를 dev 에서도 밟게 한다.
  { id: 3, name: "창업 빌드업", subCategories: [] },
];

/**
 * `GET /api/member/lectures`.
 *
 * **제목 길이를 일부러 섞었다.** `MemberLectureCard` 의 제목은 `ProjectCard` 와 달리 줄
 * 수가 묶여 있지 않아, 긴 제목이 하나만 있어도 그 줄 카드가 전부 그만큼 커진다. 짧은
 * 제목만 넣어 두면 dev 에서 그 사실이 안 보인다.
 *
 * `deadline`·`durationMinutes`·`subCategoryName` 은 전부 `null` 일 수 있다(BE 확인, 타입
 * 주석 참고) — 그 조합도 한 장씩 넣는다.
 */
export const memberLectures: MemberLectureBoard = {
  content: [
    {
      id: 1,
      week: 1,
      title: "HTML/CSS 기초",
      subCategoryName: "프론트엔드",
      trackName: "웹",
      durationMinutes: 45,
      deadline: "2026-09-08T23:59:00",
      completed: true,
    },
    {
      id: 2,
      week: 2,
      title: "React 컴포넌트와 상태 관리 그리고 렌더링 최적화까지",
      subCategoryName: "프론트엔드",
      trackName: "웹",
      durationMinutes: 90,
      deadline: "2026-09-15T23:59:00",
      completed: false,
    },
    {
      id: 3,
      week: 3,
      title: "Spring Boot 시작하기",
      subCategoryName: "백엔드",
      trackName: "웹",
      durationMinutes: 60,
      deadline: null, // 과제가 없는 강의
      completed: false,
    },
    {
      id: 4,
      week: 4,
      title: "JPA 연관관계 매핑",
      subCategoryName: "백엔드",
      trackName: "웹",
      durationMinutes: null, // 영상 길이가 없는 강의
      deadline: "2026-09-29T23:59:00",
      completed: true,
    },
    {
      id: 5,
      week: 1,
      title: "선형회귀와 경사하강법",
      subCategoryName: "머신러닝",
      trackName: "AI",
      durationMinutes: 75,
      deadline: "2026-09-08T23:59:00",
      completed: false,
    },
    {
      id: 6,
      week: 2,
      title: "신경망 기초",
      subCategoryName: "머신러닝",
      trackName: "AI",
      durationMinutes: 80,
      deadline: "2026-09-15T23:59:00",
      completed: false,
    },
    {
      id: 7,
      week: 1,
      title: "아이디어를 검증하는 가장 빠른 방법",
      subCategoryName: null, // 소분류 없는 트랙 직속 강의
      trackName: "창업 빌드업",
      durationMinutes: 50,
      deadline: null,
      completed: false,
    },
    {
      id: 8,
      week: 2,
      title: "린 캔버스 작성",
      subCategoryName: null,
      trackName: "창업 빌드업",
      durationMinutes: 40,
      deadline: "2026-09-22T23:59:00",
      completed: false,
    },
  ],
  page: 0,
  size: 12,
  totalElements: 8,
  totalPages: 1,
  first: true,
  last: true,
};

// ── 부원 대시보드 · 그룹 (명세서 4.x · 5.x) ──────────────────────────
//
// `me.role` 을 `MEMBER` 로 올리면서 `/member/dashboard` · `/member/group` 도 열렸다.
// 목이 없으면 그 화면들이 dev 에서 곧장 에러 상태로 떨어져, 열어 봐야 아무것도 알 수 없다.

export const mySummary: MySummary = {
  profile: {
    name: "개발용 부원",
    email: "dev@getit.dev",
    college: "IT대학",
    major: "컴퓨터학부",
    studentId: "2023000000",
    studentYear: 3,
    profileImageUrl: "",
  },
  stats: {
    enrolledLectureCount: 8,
    submittedAssignmentCount: 5,
    notSubmittedCount: 2,
    lateSubmittedCount: 1,
  },
  notSubmittedLectures: [
    { lectureId: 3, week: 3, title: "Spring Boot 시작하기" },
    { lectureId: 6, week: 2, title: "신경망 기초" },
  ],
  lateSubmittedLectures: [{ lectureId: 2, week: 2, title: "React 컴포넌트와 상태 관리 그리고 렌더링 최적화까지" }],
};

/** `GET /api/member/group`. 조 배정 전이면 실제로 `null` 이 온다 — 그 분기도 밟아 보려면 여기를 `null` 로. */
export const myGroup: Group = {
  id: 1,
  name: "1조",
  memberCount: 4,
  members: [
    { userId: 1, name: "개발용 부원", major: "컴퓨터학부", role: "MEMBER", roleLabel: "부원" },
    { userId: 2, name: "김하늘", major: "컴퓨터학부", role: "MEMBER", roleLabel: "부원" },
    { userId: 3, name: "이바다", major: "전자공학부", role: "MEMBER", roleLabel: "부원" },
    { userId: 4, name: "박구름", major: "컴퓨터학부", role: "ADMIN", roleLabel: "운영진" },
  ],
};

/** `GET /api/member/questions`. 답변 완료·대기가 섞여 있어야 두 배지를 다 볼 수 있다. */
export const myQuestions: Page<MyQuestion> = {
  content: [
    {
      id: 1,
      lectureId: 2,
      lectureTitle: "React 컴포넌트와 상태 관리 그리고 렌더링 최적화까지",
      authorName: "개발용 부원",
      content: "useMemo 는 언제 쓰는 게 맞나요?",
      createdAt: "2026-08-28T14:20:00",
      status: "ANSWERED",
      answers: [
        {
          id: 1,
          adminName: "박구름",
          content: "계산이 실제로 비쌀 때만 씁니다. 대부분은 없는 편이 빠릅니다.",
          createdAt: "2026-08-28T18:02:00",
        },
      ],
    },
    {
      id: 2,
      lectureId: 5,
      lectureTitle: "선형회귀와 경사하강법",
      authorName: "개발용 부원",
      content: "학습률을 어떻게 정하나요?",
      createdAt: "2026-08-30T09:10:00",
      status: "PENDING",
      answers: [],
    },
  ],
  page: 0,
  size: 10,
  totalElements: 2,
  totalPages: 1,
  first: true,
  last: true,
};

/** `GET /api/member/projects`. 승인·대기·반려 세 상태를 다 넣어야 배지 세 종류를 볼 수 있다. */
export const myProjects: MemberProject[] = [
  {
    id: 1,
    title: "GETIT Chat",
    teamName: "1조",
    semester: "2026-SPRING",
    description: "동아리 내부용 실시간 채팅.",
    techStacks: ["React", "Spring Boot"],
    codeUrl: "https://github.com/getit-knu",
    demoUrl: "https://getit.example.com",
    fileId: 1,
    thumbnailUrl: "",
    status: "APPROVED",
    statusLabel: "승인",
    rejectReason: null,
  },
  {
    id: 2,
    title: "출석 체크봇",
    teamName: "1조",
    semester: "2026-SPRING",
    description: "슬랙에서 출석을 받는 봇.",
    techStacks: ["TypeScript"],
    codeUrl: "https://github.com/getit-knu",
    demoUrl: "",
    fileId: 2,
    thumbnailUrl: "",
    status: "PENDING",
    statusLabel: "대기",
    rejectReason: null,
  },
  {
    id: 3,
    title: "스터디 매칭",
    teamName: "1조",
    semester: "2025-FALL",
    description: "관심사가 맞는 사람을 이어 준다.",
    techStacks: ["Next.js"],
    codeUrl: "https://github.com/getit-knu",
    demoUrl: "",
    fileId: 3,
    thumbnailUrl: "",
    status: "REJECTED",
    statusLabel: "반려",
    rejectReason: "데모 링크가 열리지 않습니다. 배포 후 다시 등록해 주세요.",
  },
];
