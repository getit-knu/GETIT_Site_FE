import type { ApplicationFormResult, MyApplicationResult } from "../types/application";
import type { Me } from "../types/auth";
import type { College, Major } from "../types/college";
import type { HomeResult, PublicActivityPhoto, PublicFaq } from "../types/home";
import type { PublicProjectBoard } from "../types/project";
import type { RecruitmentStatus } from "../types/recruitment";
import type { StaffDirectory } from "../types/site";

/**
 * 개발용 목 데이터. **dev 서버에서만 쓰인다** — `devApiMockPlugin`이 유일한 소비자라
 * `vite build` 산출물에 들어가지 않는다. 값은 실제 운영 데이터와 무관한 샘플이다.
 */

/**
 * dev 로그인 사용자.
 *
 * **`MEMBER` 로 둔다.** `GUEST` 면 `RequireRole` 이 `/member/*` 를 전부 막아 부원 화면을
 * 백엔드 없이 열어볼 수가 없다. 지원서 흐름은 role 이 아니라 `GET /api/applications/me`
 * 로 갈리므로(`ApplyPage` 참고) 부원으로 둬도 그대로 볼 수 있다.
 */
export const me: Me = {
  id: 1,
  email: "dev@getit.dev",
  name: "개발용 부원",
  phoneNumber: "010-0000-0000",
  college: "IT대학",
  major: "컴퓨터학부",
  studentYear: 3,
  studentNumber: "2023000000",
  profileImageUrl: null,
  role: "MEMBER",
  generationNo: 9,
  status: "ACTIVE",
};

export const recruitmentStatus: RecruitmentStatus = {
  generationNo: 9,
  year: 2026,
  phase: "DOCUMENT_OPEN",
  dDay: 5,
  message: "9기 서류 접수가 진행 중입니다.",
  applyEnabled: true,
  schedule: {
    totalStartAt: "2026-08-25T00:00:00",
    totalEndAt: "2026-09-20T23:59:59",
    documentStartAt: "2026-08-25T00:00:00",
    documentEndAt: "2026-09-05T23:59:59",
    interviewStartAt: "2026-09-10T09:00:00",
    interviewEndAt: "2026-09-20T23:59:59",
  },
};

// 썸네일 플레이스홀더. 외부 요청 없이 항상 뜨도록 인라인 SVG data URI를 쓴다.
const thumb = (label: string, bg: string) =>
  `data:image/svg+xml;utf8,${encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="640" height="360"><rect width="640" height="360" fill="${bg}"/><text x="320" y="190" font-family="sans-serif" font-size="36" fill="#fff" text-anchor="middle">${label}</text></svg>`,
  )}`;

export const home: HomeResult = {
  curriculums: [
    { id: 1, order: 1, title: "OT · 팀 빌딩", subtitle: "동아리 소개와 한 학기 로드맵 공유" },
    { id: 2, order: 2, title: "웹 기초 세션", subtitle: "HTML/CSS/JS와 Git 협업 흐름" },
    { id: 3, order: 3, title: "React 심화", subtitle: "컴포넌트 설계와 상태 관리" },
    { id: 4, order: 4, title: "백엔드 입문", subtitle: "Spring Boot로 API 만들기" },
    { id: 5, order: 5, title: "아이디어톤", subtitle: "팀별 서비스 기획 발표" },
    { id: 6, order: 6, title: "데모데이", subtitle: "한 학기 결과물 시연과 회고" },
  ],
  featuredProjects: [
    {
      id: 1,
      title: "캠퍼스 중고장터",
      description: "학내 인증 기반 중고거래 서비스",
      thumbnailUrl: thumb("Market", "%23283997"),
    },
    {
      id: 2,
      title: "강의실 예약 봇",
      description: "빈 강의실을 찾아주는 챗봇",
      thumbnailUrl: thumb("RoomBot", "%230a0a0a"),
    },
    { id: 3, title: "동아리 회계 장부", description: "회비 정산 자동화 도구", thumbnailUrl: null },
  ],
  features: { stockGame: false, mockInvestment: false },
};

export const faqs: PublicFaq[] = [
  { id: 1, order: 1, question: "비전공자도 지원할 수 있나요?", answer: "네. 기초 세션부터 함께 시작합니다." },
  {
    id: 2,
    order: 2,
    question: "활동은 얼마나 자주 하나요?",
    answer: "주 1회 정기 세션과 팀별 프로젝트 모임이 있습니다.",
  },
  { id: 3, order: 3, question: "회비가 있나요?", answer: "학기당 소정의 회비가 있으며 전액 활동에 사용됩니다." },
  {
    id: 4,
    order: 4,
    question: "면접은 어떻게 진행되나요?",
    answer: "서류 합격자 대상으로 15분 내외 대면 면접을 진행합니다.",
  },
];

export const activityPhotos: PublicActivityPhoto[] = [
  { id: 1, imageUrl: thumb("MT", "%236a7282"), order: 1 },
  { id: 2, imageUrl: thumb("Hackathon", "%23283997"), order: 2 },
  { id: 3, imageUrl: thumb("Demo Day", "%230a0a0a"), order: 3 },
  { id: 4, imageUrl: thumb("Study", "%2399a1af"), order: 4 },
];

export const colleges: College[] = [
  { id: 1, name: "IT대학" },
  { id: 2, name: "경상대학" },
];

export const majors: Major[] = [
  { id: 11, collegeId: 1, name: "컴퓨터학부" },
  { id: 12, collegeId: 1, name: "전자공학부" },
  { id: 21, collegeId: 2, name: "경영학부" },
];

/**
 * 브리프 원안은 `PublicStaff`에 없는 `role`·`generationNo`를 썼다(`types/site/index.ts`의
 * `PublicStaffResult` 재노출 확인함 — 실제 필드는 `staffRole`·`department`·`introduction`·
 * `order`이고 `generationNo`는 아예 없다). 타입 정의는 실제 BE 계약을 손으로 되돌린 것이라
 * 여기서 필드 구성을 맞췄다.
 */
export const staffs: StaffDirectory = {
  sections: [
    {
      section: "EXECUTIVE",
      sectionName: "회장단",
      staffs: [
        {
          id: 1,
          name: "김회장",
          staffRole: "회장",
          department: "컴퓨터학부",
          introduction: "9기를 이끌고 있습니다.",
          profileImageUrl: null,
          githubUrl: "https://github.com/getit-knu",
          instagramUrl: null,
          order: 1,
        },
        {
          id: 2,
          name: "박부회장",
          staffRole: "부회장",
          department: "전자공학부",
          introduction: "행사 기획을 맡고 있습니다.",
          profileImageUrl: null,
          githubUrl: null,
          instagramUrl: null,
          order: 2,
        },
      ],
    },
    {
      section: "SW",
      sectionName: "SW 운영진",
      staffs: [
        {
          id: 3,
          name: "이운영",
          staffRole: "SW 세션",
          department: "컴퓨터학부",
          introduction: "웹 세션을 진행합니다.",
          profileImageUrl: null,
          githubUrl: null,
          instagramUrl: null,
          order: 1,
        },
        {
          id: 4,
          name: "최운영",
          staffRole: "SW 세션",
          department: "컴퓨터학부",
          introduction: "백엔드 세션을 진행합니다.",
          profileImageUrl: null,
          githubUrl: null,
          instagramUrl: null,
          order: 2,
        },
      ],
    },
  ],
};

export const projects: PublicProjectBoard = {
  content: [1, 2, 3, 4, 5, 6].map((n) => ({
    id: n,
    title: `프로젝트 ${n}`,
    teamName: `팀 ${n}`,
    semester: n <= 3 ? "2026-SPRING" : "2025-FALL",
    semesterLabel: n <= 3 ? "2026 1학기" : "2025 2학기",
    description: "부원들이 한 학기 동안 만든 서비스입니다.",
    techStacks: ["React", "Spring Boot"],
    codeUrl: "https://github.com/getit-knu",
    demoUrl: "https://getit.example.com",
    thumbnailUrl: n % 3 === 0 ? null : thumb(`P${n}`, "%23283997"),
  })),
  page: 0,
  size: 12,
  totalElements: 6,
  totalPages: 1,
  first: true,
  last: true,
  semesters: ["2026-SPRING", "2025-FALL"],
};

export const applicationForm: ApplicationFormResult = {
  generationNo: 9,
  phase: "DOCUMENT_OPEN",
  deadline: "2026-09-05T23:59:59",
  basicInfoPrefill: {
    name: "개발용 지원자",
    email: "dev@getit.dev",
    phoneNumber: null,
    collegeId: null,
    majorId: null,
    grade: null,
    studentNumber: null,
  },
  questions: [
    {
      id: 101,
      order: 1,
      type: "TEXT",
      content: "지원 동기를 알려주세요.",
      placeholder: "GET IT에서 하고 싶은 것",
      required: true,
      maxLength: 500,
      options: null,
    },
    {
      id: 102,
      order: 2,
      type: "CHOICE",
      content: "관심 분야를 골라주세요.",
      placeholder: null,
      required: true,
      maxLength: null,
      options: [
        { id: "fe", label: "프론트엔드" },
        { id: "be", label: "백엔드" },
        { id: "plan", label: "기획" },
      ],
    },
    {
      id: 103,
      order: 3,
      type: "CHECKBOX",
      content: "개인정보 수집에 동의합니다.",
      placeholder: null,
      required: true,
      maxLength: null,
      options: [{ id: "agree", label: "동의" }],
    },
    {
      id: 104,
      order: 4,
      type: "TEXT",
      content: "하고 싶은 말 (선택)",
      placeholder: null,
      required: false,
      maxLength: 300,
      options: null,
    },
  ],
};

/** `PUT draft` 시 저장 상태의 초기 골격. resolver가 payload를 덮어쓴다. */
export function emptyMyApplication(): MyApplicationResult {
  return {
    id: 1,
    generationNo: 9,
    status: "DRAFT",
    basicInfo: applicationForm.basicInfoPrefill,
    answers: [],
    savedAt: new Date().toISOString(),
    submittedAt: null,
  };
}
