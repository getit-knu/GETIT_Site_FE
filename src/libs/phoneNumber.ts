/**
 * 전화번호 형식. 지원서와 내 정보 수정이 같은 규칙을 쓴다(#334).
 *
 * BE 는 길이(20자)만 보므로 형식은 FE 가 잡는다. 안 잡으면 `01012345678` · `010 1234 5678` ·
 * 공백이 섞인 값이 뒤섞여 저장돼, 어드민 사용자 표에서 같은 사람의 연락처가 화면마다
 * 다른 꼴로 보인다.
 */

/**
 * 전화번호를 `010-1234-5678` 꼴로 다듬는다. 숫자만 남기고 자리 수에 맞춰 하이픈을 끼운다.
 *
 * 입력하는 동안 매 글자마다 부르므로, 다 치기 전 짧은 상태(`010`, `010-123`)도 그대로
 * 성립해야 한다. 숫자 11자리에서 끊어 그보다 길게 붙는 것을 막는다.
 *
 * 하이픈 자리에서 지우면 숫자가 그대로라 화면도 그대로다 — 하이픈은 우리가 끼운 것이지
 * 사용자가 친 글자가 아니기 때문이다. 한 번 더 지우면 앞 숫자가 지워진다.
 */
export function formatPhoneNumber(value: string): string {
  const digits = value.replace(/\D/g, "").slice(0, 11);

  if (digits.length <= 3) return digits;
  if (digits.length <= 7) return `${digits.slice(0, 3)}-${digits.slice(3)}`;
  return `${digits.slice(0, 3)}-${digits.slice(3, 7)}-${digits.slice(7)}`;
}

/**
 * 휴대전화 번호 형식. `010` 으로 시작하는 11자리만 받는다.
 *
 * `011` · `016` 같은 구 식별번호는 2G 종료로 더는 신규 개통되지 않고, 유선번호는 동아리
 * 연락 수단이 아니다. 넓게 열어 두는 것보다 한 꼴로 모으는 편이 낫다고 봤다 — 넓혀야
 * 하면 이 정규식만 고치면 된다.
 */
const MOBILE_PHONE_PATTERN = /^010-\d{4}-\d{4}$/;

/** 화면에 그대로 쓰는 예시. 안내 문구와 placeholder 가 어긋나지 않게 한 곳에서 만든다. */
export const PHONE_NUMBER_EXAMPLE = "010-1234-5678";

/** 입력칸이 받는 최대 길이(`010-1234-5678` = 13자). */
export const PHONE_NUMBER_MAX_LENGTH = PHONE_NUMBER_EXAMPLE.length;

export const PHONE_NUMBER_FORMAT_MESSAGE = `전화번호를 ${PHONE_NUMBER_EXAMPLE} 형식으로 입력해 주세요.`;

/** 형식에 맞는지. **빈 값은 여기서 보지 않는다** — 필수 여부는 화면마다 다르다. */
export function isValidPhoneNumber(value: string): boolean {
  return MOBILE_PHONE_PATTERN.test(value.trim());
}
