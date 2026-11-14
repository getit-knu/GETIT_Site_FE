/**
 * 모의투자 FESTA(#351) 행사 문구. 행사용 한시 화면이라 어드민 설정 대신 상수로 둔다 —
 * 날짜·부제가 확정되면 이 값만 바꾸면 된다.
 */
export const FESTA_EVENT = {
  dateLabel: "11.23 – 11.29",
  subtitle: "써 보고 마음에 드는 팀에 가상 투자금 1,000만 원을 나눠 넣어 주세요.",
} as const;

/** 투자금 표시. 금액이 늘 10만 원 단위라 만 원으로 끊어 읽는다(`2,500,000` → `250만 원`). */
export function formatWon(amount: number): string {
  if (amount === 0) return "0원";
  if (amount % 10_000 !== 0) return `${amount.toLocaleString("ko-KR")}원`;
  return `${(amount / 10_000).toLocaleString("ko-KR")}만 원`;
}
