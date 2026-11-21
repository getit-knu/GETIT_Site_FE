import { describe, expect, it } from "vitest";

import { markdownToPlainText } from "./markdownToPlainText";

describe("markdownToPlainText (#384)", () => {
  it("제목·목록·인용 표시와 이미지·링크 문법을 걷어내고 한 줄로 잇는다", () => {
    const markdown = [
      "## 주요 기능",
      "- **일정** 공유",
      "1. 실시간 _알림_",
      "> 행사장에서 [바로 써 보기](https://a.example.com)",
      "![구조도](https://api.getit.io.kr/api/public/files/public/a.png)",
      "---",
      "`npm run dev`로 실행",
    ].join("\n\n");

    expect(markdownToPlainText(markdown)).toBe(
      "주요 기능 일정 공유 실시간 알림 행사장에서 바로 써 보기 npm run dev로 실행",
    );
  });

  it("일반 글은 줄바꿈만 띄어쓰기로 바뀐다. 단어 속 밑줄은 그대로 둔다", () => {
    expect(markdownToPlainText("첫 줄\n둘째 줄 snake_case_name")).toBe("첫 줄 둘째 줄 snake_case_name");
  });
});
