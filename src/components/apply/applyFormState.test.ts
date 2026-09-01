import { describe, expect, it } from "vitest";

import type { ApplicationFormQuestion } from "../../types/application";

import type { BasicInfoState } from "./applyFormState";
import { submitBlocker, toBasicInfoPayload } from "./applyFormState";

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
    expect(submitBlocker(filled, { 1: empty }, [q])?.message).toBe("아직 답하지 않았어요: 지원 동기를 알려주세요");
  });

  it("서술문 문항도 채우라는 뜻이 살아 있다", () => {
    const q = question({ content: "개인정보 수집에 동의합니다", type: "CHECKBOX" });
    expect(submitBlocker(filled, { 1: { answerText: null, selectedOptions: [] } }, [q])?.message).toBe(
      "아직 답하지 않았어요: 개인정보 수집에 동의합니다",
    );
  });

  it("기본 정보는 빈 칸을 하나만 짚는다", () => {
    expect(submitBlocker({ ...filled, phone: "" }, {}, [])).toEqual({
      field: "phone",
      message: "전화번호를 입력해 주세요.",
    });
  });

  it("이메일 형식이 어긋나면 그 칸을 짚는다", () => {
    // BE가 받아 주더라도 오타 난 주소로는 합격 안내가 닿지 않아 지원자만 손해다.
    const wrong = submitBlocker({ ...filled, email: "hong@getit" }, {}, []);
    expect(wrong?.field).toBe("email");
    expect(wrong?.message).toContain("이메일 형식");
  });

  it("학년은 1~6만 받는다", () => {
    expect(submitBlocker({ ...filled, grade: "0" }, {}, [])?.field).toBe("grade");
    expect(submitBlocker({ ...filled, grade: "9" }, {}, [])?.field).toBe("grade");
    expect(submitBlocker({ ...filled, grade: "2.5" }, {}, [])?.field).toBe("grade");
    expect(submitBlocker({ ...filled, grade: "4" }, {}, [])).toBeNull();
  });

  it("전화번호는 010-1234-5678 형식만 받는다", () => {
    // 자릿수만 보던 때는 `020-1234-5678` 처럼 11자리이기만 한 값도 통과했다(#334).
    expect(submitBlocker({ ...filled, phone: "010-1234" }, {}, [])?.field).toBe("phone");
    expect(submitBlocker({ ...filled, phone: "020-1234-5678" }, {}, [])?.field).toBe("phone");
    expect(submitBlocker({ ...filled, phone: "010-1234-5678" }, {}, [])).toBeNull();
  });

  it("학번은 비워도 되지만 적었다면 10자리여야 한다", () => {
    // BE도 학번은 필수로 안 본다 — 다만 절반만 적힌 학번은 없느니만 못하다.
    expect(submitBlocker({ ...filled, studentId: "" }, {}, [])).toBeNull();
    expect(submitBlocker({ ...filled, studentId: "2021" }, {}, [])?.field).toBe("studentId");
    expect(submitBlocker({ ...filled, studentId: "2021123456" }, {}, [])).toBeNull();
  });
});

describe("toBasicInfoPayload", () => {
  const state: BasicInfoState = {
    name: "홍길동",
    email: "hong@getit.com",
    phone: " 010-1234-5678 ",
    collegeId: 1,
    majorId: 1,
    grade: "3",
    studentId: "",
  };

  it("전화번호의 앞뒤 공백을 털어 보낸다", () => {
    // 검증은 공백을 무시하고 통과시키므로, 저장할 때 안 털면 통과한 값과 저장되는 값이
    // 달라진다 — 공백이 섞인 채로 쌓이면 형식을 통일한 의미가 없다.
    expect(toBasicInfoPayload(state).phoneNumber).toBe("010-1234-5678");
  });

  it("공백뿐인 전화번호는 null 로 보낸다", () => {
    expect(toBasicInfoPayload({ ...state, phone: "   " }).phoneNumber).toBeNull();
  });
});
