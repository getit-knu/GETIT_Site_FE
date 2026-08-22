import { useEffect, useState } from "react";

/**
 * 값이 잠잠해질 때까지 기다렸다가 넘겨준다. 검색어에 쓴다.
 *
 * 입력할 때마다 조회하면 "김지원" 을 치는 동안 요청이 세 번 나가고,
 * 응답이 뒤섞여 도착하면 지운 글자에 대한 결과가 화면에 남기도 한다.
 *
 * @param delay 밀리초. 너무 짧으면 효과가 없고 너무 길면 반응이 굼뜨다.
 */
export function useDebouncedValue<T>(value: T, delay = 300): T {
  const [settled, setSettled] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setSettled(value), delay);
    // 값이 또 바뀌면 앞선 예약을 버린다. 마지막 입력만 살아남는다.
    return () => clearTimeout(timer);
  }, [value, delay]);

  return settled;
}
