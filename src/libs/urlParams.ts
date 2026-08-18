/** 서버가 주는 id 는 1 부터 시작하는 정수다. 그 형태의 문자열만 받아들인다. */
const NON_NEGATIVE_INTEGER = /^\d+$/;

/**
 * URL 쿼리 값을 정수로 바꾼다. 형태가 어긋나면 `null`.
 *
 * `Number()` 로 바로 바꾸면 안 된다. 빈 문자열과 공백을 **0 으로** 만들고
 * (`Number("") === 0`), 지수·16진수 표기(`1e3` → 1000, `0x10` → 16)까지 받아들인다.
 * `Number.isInteger` 도 그 값들은 통과시킨다. 그러면 `?id=` 같은 주소가
 * 없는 항목을 열거나, `?id=0x10` 이 엉뚱한 항목을 연다.
 *
 * @param min 허용하는 최솟값. id 는 1, 페이지 번호는 0 부터다.
 */
export function parseIntParam(raw: string | null, min: number): number | null {
  if (raw === null || !NON_NEGATIVE_INTEGER.test(raw)) return null;

  const parsed = Number(raw);
  // 자릿수가 아주 크면 정수 정밀도를 벗어나 다른 값이 된다.
  if (!Number.isSafeInteger(parsed) || parsed < min) return null;

  return parsed;
}
