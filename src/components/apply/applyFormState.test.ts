import { describe, expect, it } from "vitest";

import type { ApplicationFormQuestion } from "../../types/application";

import type { BasicInfoState } from "./applyFormState";
import { formatPhoneNumber, submitBlocker } from "./applyFormState";

describe("formatPhoneNumber", () => {
  it("숫자만 쭉 치면 010-1234-5678 꼴로 끊어 준다", () => {
    expect(formatPhoneNumber("01012345678")).toBe("010-1234-5678");
  });

  it("다 치기 전 짧은 상태도 그대로 성립한다", () => {
    // 입력하는 동안 매 글자마다 부르므로 중간 상태가 어색하면 안 된다.
    expect(formatPhoneNumber("0")).toBe("0");
    expect(formatPhoneNumber("010")).toBe("010");
    expect(formatPhoneNumber("0101")).toBe("010-1");
    expect(formatPhoneNumber("0101234")).toBe("010-1234");
    expect(formatPhoneNumber("01012345")).toBe("010-1234-5");
  });

  it("이미 하이픈이 든 값을 다시 넣어도 같은 결과다", () => {
    // 이어쓰기로 불러온 값이 그대로 통과해야 한다.
    expect(formatPhoneNumber("010-1234-5678")).toBe("010-1234-5678");
  });

  it("숫자가 아닌 글자는 버린다", () => {
    expect(formatPhoneNumber("010 1234 5678")).toBe("010-1234-5678");
    expect(formatPhoneNumber("가010나1234")).toBe("010-1234");
  });

  it("11자리를 넘겨 쳐도 더 붙지 않는다", () => {
    expect(formatPhoneNumber("010123456789999")).toBe("010-1234-5678");
  });
});

describe("submitBlocker 문항 안내", () => {
  const question = (over: Partial<ApplicationFormQuestion>): ApplicationFormQuestion => ({
    id: 1,
    order: 1,
    type: "TEXT",
    content: "지원 동기를 알려주세요.",
    placeholder: null,
    required: true,
    maxLength: null,
    options: null,
    ...over,
  });

  const filled: BasicInfoState = {
    name: "홍길동",
    email: "hong@getit.com",
    phone: "010-1234-5678",
    collegeId: 1,
    majorId: 1,
    grade: "3",
    studentId: "",
  };

  const empty = { answerText: "", selectedOptions: null };

  it("부탁 꼴 문항을 문장에 끼워 넣지 않는다", () => {
    // `"…알려주세요."에 답변해 주세요.` 는 같은 부탁을 두 번 하고 마침표도 두 번 찍혔다.
    const q = question({});
    expect(submitBlocker(filled, { 1: empty }, [q], true)?.message).toBe(
      "아직 답하지 않았어요: 지원 동기를 알려주세요",
    );
  });

  it("서술문 문항도 채우라는 뜻이 살아 있다", () => {
    const q = question({ content: "개인정보 수집에 동의합니다", type: "CHECKBOX" });
    expect(submitBlocker(filled, { 1: { answerText: null, selectedOptions: [] } }, [q], true)?.message).toBe(
      "아직 답하지 않았어요: 개인정보 수집에 동의합니다",
    );
  });

  it("기본 정보는 빈 칸을 하나만 짚는다", () => {
    expect(submitBlocker({ ...filled, phone: "" }, {}, [], true)).toEqual({
      field: "phone",
      message: "전화번호를 입력해 주세요.",
    });
  });

  it("이메일 형식이 어긋나면 그 칸을 짚는다", () => {
    // BE가 받아 주더라도 오타 난 주소로는 합격 안내가 닿지 않아 지원자만 손해다.
    const wrong = submitBlocker({ ...filled, email: "hong@getit" }, {}, [], true);
    expect(wrong?.field).toBe("email");
    expect(wrong?.message).toContain("이메일 형식");
  });

  it("학년은 1~6만 받는다", () => {
    expect(submitBlocker({ ...filled, grade: "0" }, {}, [], true)?.field).toBe("grade");
    expect(submitBlocker({ ...filled, grade: "9" }, {}, [], true)?.field).toBe("grade");
    expect(submitBlocker({ ...filled, grade: "2.5" }, {}, [], true)?.field).toBe("grade");
    expect(submitBlocker({ ...filled, grade: "4" }, {}, [], true)).toBeNull();
  });

  it("전화번호는 11자리를 채워야 한다", () => {
    expect(submitBlocker({ ...filled, phone: "010-1234" }, {}, [], true)?.field).toBe("phone");
    expect(submitBlocker({ ...filled, phone: "010-1234-5678" }, {}, [], true)).toBeNull();
  });

  it("학번은 비워도 되지만 적었다면 10자리여야 한다", () => {
    // BE도 학번은 필수로 안 본다 — 다만 절반만 적힌 학번은 없느니만 못하다.
    expect(submitBlocker({ ...filled, studentId: "" }, {}, [], true)).toBeNull();
    expect(submitBlocker({ ...filled, studentId: "2021" }, {}, [], true)?.field).toBe("studentId");
    expect(submitBlocker({ ...filled, studentId: "2021123456" }, {}, [], true)).toBeNull();
  });

  it("개인정보 동의를 안 하면 다른 칸을 다 채워도 막는다", () => {
    expect(submitBlocker(filled, {}, [], false)).toEqual({
      field: "privacyConsent",
      message: "개인정보 수집·이용에 동의해 주세요.",
    });
  });

  it("기본 정보·문항이 안 끝났으면 동의보다 그 칸을 먼저 짚는다", () => {
    // 동의는 맨 끝에서 본다 — 앞 칸이 비어 있으면 굳이 동의 여부까지 안 봐도 이미 막힌다.
    expect(submitBlocker({ ...filled, phone: "" }, {}, [], false)?.field).toBe("phone");
  });

  it("전부 채우고 동의까지 하면 막지 않는다", () => {
    expect(submitBlocker(filled, {}, [], true)).toBeNull();
  });
});
