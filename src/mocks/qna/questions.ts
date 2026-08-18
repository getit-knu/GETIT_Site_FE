import type { Page, QuestionDetail, QuestionListItem, QuestionListParams } from "../../types/qna";

/**
 * Q&A 목 데이터.
 *
 * BE 의 qna 도메인이 아직 골격만 있어 화면을 먼저 만든다.
 * **서버가 하는 일을 여기서 흉내 낸다** — 필터 → 페이지 자르기 → `no` 부여 순서까지 같게 둬야
 * 화면이 실제 응답에서도 그대로 동작한다.
 */
const NAMES = ["김부원", "박부원", "이부원", "최부원", "정부원", "강부원", "윤부원"];
const MAJORS = ["경영학과", "컴퓨터학부", "전자공학부", "경제통상학부"];
const CONTENTS = [
  "강의 내용을 따라가기가 어렵습니다. 보충 자료가 있을까요?",
  "과제 제출 기한을 놓쳤는데 늦게라도 낼 수 있나요?",
  "스터디 조 편성은 언제 공지되나요?",
  "지원서에 적은 학과를 수정하고 싶습니다.",
  "강의 영상이 재생되지 않습니다.",
];

const answered = new Map<number, string>([[7002, "다음 차시부터 난이도를 조정하겠습니다."]]);

const ALL: QuestionListItem[] = Array.from({ length: 34 }, (_, i) => {
  const id = 7001 + i;
  const isAnswered = answered.has(id);
  return {
    no: 0, // 서버가 페이지 기준으로 계산한다. 아래에서 잘라낸 뒤 채운다.
    id,
    authorName: NAMES[i % NAMES.length],
    major: MAJORS[i % MAJORS.length],
    content: CONTENTS[i % CONTENTS.length],
    createdAt: new Date(Date.UTC(2026, 0, 1 + (i % 28), 7, 4, 22)).toISOString(),
    status: isAnswered ? "ANSWERED" : "PENDING",
    statusLabel: isAnswered ? "답변완료" : "미답변",
    lectureTitle: i % 3 === 0 ? "HTML/CSS 기초" : null,
  };
});

function delay() {
  return new Promise((resolve) => setTimeout(resolve, 200));
}

export async function fetchQuestions(params: QuestionListParams): Promise<Page<QuestionListItem>> {
  await delay();

  const { status, keyword, page = 0, size = 10 } = params;
  const keywordLower = keyword?.trim().toLowerCase();

  const filtered = ALL.filter((q) => {
    if (status && q.status !== status) return false;
    if (!keywordLower) return true;
    return q.authorName.toLowerCase().includes(keywordLower) || q.content.toLowerCase().includes(keywordLower);
  });

  const start = page * size;
  const content = filtered.slice(start, start + size).map((q, i) => ({ ...q, no: start + i + 1 }));
  const totalPages = Math.max(1, Math.ceil(filtered.length / size));

  return {
    content,
    page,
    size,
    totalElements: filtered.length,
    totalPages,
    first: page === 0,
    last: page >= totalPages - 1,
  };
}

export async function fetchQuestionDetail(id: number): Promise<QuestionDetail> {
  await delay();

  const item = ALL.find((q) => q.id === id);
  if (!item) throw { code: "QUESTION_NOT_FOUND", message: "질문을 찾을 수 없습니다." };

  const answerContent = answered.get(id);

  return {
    id: item.id,
    author: {
      id: 21,
      name: item.authorName,
      college: "경영대학",
      major: item.major,
      role: "MEMBER",
    },
    createdAt: item.createdAt,
    content: item.content,
    status: item.status,
    lecture: item.lectureTitle ? { id: 1, title: item.lectureTitle } : null,
    answer: answerContent
      ? {
          id: 8000 + id,
          adminId: 3,
          adminName: "김운영",
          content: answerContent,
          createdAt: "2026-01-02T00:00:00.000Z",
          updatedAt: null,
        }
      : null,
  };
}

/** 답변 작성·수정. 목록 상태도 함께 바꿔야 화면이 실제 서버처럼 반응한다. */
export async function saveAnswer(id: number, content: string): Promise<void> {
  await delay();

  answered.set(id, content);
  const item = ALL.find((q) => q.id === id);
  if (item) {
    item.status = "ANSWERED";
    item.statusLabel = "답변완료";
  }
}
