const KST_OFFSET_MINUTES = 9 * 60;

/** `datetime-local` 값의 형태. `2026-09-01T00:00`. */
const LOCAL_INPUT = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/;

/**
 * ISO → `<input type="datetime-local">` 값.
 *
 * 그 입력은 `2026-09-01T00:00` 형태(오프셋 없음)만 값으로 받는다. 서버가 주는
 * 오프셋 붙은 ISO 8601을 그대로 넣으면 브라우저가 형식 불일치로 빈 칸을 보여준다.
 * 문자열을 그대로 잘라도 안 된다(서버 오프셋이 `+09:00`이 아닐 수도 있다) — 시각으로
 * 바꾼 뒤 한국 시간으로 다시 그린다. 화면 표기는 KST로 고정한다.
 */
export function toLocalInput(iso: string): string {
  const at = new Date(iso);
  if (Number.isNaN(at.getTime())) return "";

  const kst = new Date(at.getTime() + KST_OFFSET_MINUTES * 60_000);
  return kst.toISOString().slice(0, 16);
}

/**
 * `<input type="datetime-local">` 값 → ISO. 입력은 KST로 읽는다.
 *
 * `Date` 파싱만 믿으면 안 된다 — V8은 `"아무거나:00Z"`를 2000-01-01로 읽어 준다.
 * 형태가 어긋난 값이 들어오면 빈 문자열을 돌려준다 — 호출부가 이를 저장 금지
 * 사유로 다뤄야 한다.
 */
export function toIso(local: string): string {
  if (!LOCAL_INPUT.test(local)) return "";

  const asUtc = new Date(`${local}:00Z`);
  if (Number.isNaN(asUtc.getTime())) return "";

  return new Date(asUtc.getTime() - KST_OFFSET_MINUTES * 60_000).toISOString();
}
