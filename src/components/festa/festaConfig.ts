/**
 * 모의투자 FESTA(#351) 행사 일정. 행사용 한시 화면이라 어드민 설정 대신 상수로 둔다.
 *
 * `endsAt`은 참여 마감 시각이다. 마지막 날(11/29)이 끝나는 순간, 즉 11/30 0시(KST)로 둔다.
 * 쇼케이스는 이 값으로 "D-3"이나 마지막 날의 남은 시간을 보여준다(#377). 실제로 참여를 막는 건
 * 어드민의 모의투자 토글이고 이 값은 표시용이다.
 */
export const FESTA_EVENT = {
  endsAt: "2026-11-30T00:00:00+09:00",
} as const;

/**
 * 참여 방식(#373). 이번 학기는 1인 1팀 투표다. 가상 투자금을 나눠 넣는 방식(#364)도 코드와 BE API 를
 * 그대로 남겨 두었으니, 다음에 투자로 하려면 이 값만 `"investment"`로 바꾼다.
 */
export type FestaMode = "vote" | "investment";
export const FESTA_MODE: FestaMode = "vote";

/** 방식마다 바뀌는 문구. */
export const FESTA_COPY = {
  vote: {
    action: "투표",
    subtitle: "써 보고 가장 마음에 드는 팀 하나에 투표해 주세요.",
    signedOut: "구글로 로그인하면 누구나 마음에 드는 팀 하나에 투표할 수 있어요.",
    login: "구글 로그인하고 투표하기",
    ready: "카드에서 팀 하나를 골라 투표하세요. 행사 기간에는 언제든 다른 팀으로 바꿀 수 있어요.",
  },
  investment: {
    action: "투자",
    subtitle: "써 보고 마음에 드는 팀에 가상 투자금 1,000만 원을 나눠 넣어 주세요.",
    signedOut: "구글로 로그인하면 누구나 가상 투자금 1,000만 원을 받아요.",
    login: "구글 로그인하고 투자하기",
    ready: "카드마다 금액을 정해 1,000만 원을 나눠 넣고 저장하세요. 행사 기간에는 언제든 다시 바꿀 수 있어요.",
  },
} as const satisfies Record<FestaMode, Record<string, string>>;

/** 투자금 표시. 금액이 늘 10만 원 단위라 만 원으로 끊어 읽는다(`2,500,000` → `250만 원`). */
export function formatWon(amount: number): string {
  if (amount === 0) return "0원";
  if (amount % 10_000 !== 0) return `${amount.toLocaleString("ko-KR")}원`;
  return `${(amount / 10_000).toLocaleString("ko-KR")}만 원`;
}
