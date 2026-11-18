import { useState } from "react";

import { formatPhoneNumber, isValidPhoneNumber, PHONE_NUMBER_FORMAT_MESSAGE } from "../../libs/phoneNumber";

/**
 * FESTA 추첨 연락처(#364). 투자(`useFestaInvestment`)와 투표(`useFestaVote`)가 같은 규칙을 쓴다.
 *
 * 처음 저장할 때는 번호와 동의가 모두 필요하다. 이미 번호를 낸 사람은 "번호 바꾸기"를 누를 때만
 * 다시 받는다 — BE 는 번호를 보낼 때만 동의를 검사한다.
 */
export function useFestaContact(maskedPhoneNumber: string | null) {
  const [editingPhone, setEditingPhone] = useState(false);
  const [phone, setPhone] = useState("");
  const [consent, setConsent] = useState(false);
  const needsPhone = maskedPhoneNumber === null || editingPhone;

  function reset() {
    setEditingPhone(false);
    setPhone("");
    setConsent(false);
  }

  const blockReason =
    needsPhone && !isValidPhoneNumber(phone)
      ? PHONE_NUMBER_FORMAT_MESSAGE
      : needsPhone && !consent
        ? "전화번호 수집·이용에 동의해 주세요."
        : null;

  return {
    maskedPhoneNumber,
    needsPhone,
    phone,
    setPhone: (value: string) => setPhone(formatPhoneNumber(value)),
    consent,
    setConsent,
    startEditing: () => setEditingPhone(true),
    cancelEditing: reset,
    /** 저장에 성공하면 입력을 비운다. */
    reset,
    blockReason,
    /** 저장 요청에 실을 번호·동의. 번호를 다시 받을 때만 보낸다. */
    payload: needsPhone ? { phoneNumber: phone.trim(), privacyConsent: consent } : {},
  };
}

export type FestaContact = ReturnType<typeof useFestaContact>;
