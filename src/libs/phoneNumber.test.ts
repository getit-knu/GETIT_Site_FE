import { describe, expect, it } from "vitest";

import { formatPhoneNumber, isValidPhoneNumber } from "./phoneNumber";

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

describe("isValidPhoneNumber", () => {
  it("010으로 시작하는 11자리만 받는다", () => {
    expect(isValidPhoneNumber("010-1234-5678")).toBe(true);
    // 자릿수만 보면 통과해 버리는 값들 — 형식까지 봐야 걸린다.
    expect(isValidPhoneNumber("020-1234-5678")).toBe(false);
    expect(isValidPhoneNumber("011-123-4567")).toBe(false);
  });

  it("하이픈이 빠졌거나 자리가 어긋나면 받지 않는다", () => {
    expect(isValidPhoneNumber("01012345678")).toBe(false);
    expect(isValidPhoneNumber("010-123-45678")).toBe(false);
    expect(isValidPhoneNumber("010-1234-567")).toBe(false);
    expect(isValidPhoneNumber("010-1234-56789")).toBe(false);
  });

  it("숫자가 아닌 글자가 섞이면 받지 않는다", () => {
    expect(isValidPhoneNumber("010-abcd-5678")).toBe(false);
    expect(isValidPhoneNumber("전화번호")).toBe(false);
  });

  it("빈 값은 형식 위반이 아니라 '안 적음'이라 여기서 판정하지 않는다", () => {
    // 필수 여부는 화면마다 다르다 — 지원서는 필수, 내 정보 수정은 선택이다.
    expect(isValidPhoneNumber("")).toBe(false);
    expect(isValidPhoneNumber("   ")).toBe(false);
  });

  it("앞뒤 공백은 무시한다", () => {
    expect(isValidPhoneNumber(" 010-1234-5678 ")).toBe(true);
  });
});
