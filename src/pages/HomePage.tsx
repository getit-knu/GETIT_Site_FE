import { useQuery } from "@tanstack/react-query";
import { useEffect, useLayoutEffect, useState } from "react";

import { getHome } from "../apis/public/publicApi";
import { queryKeys } from "../apis/queryKeys";
import { FestaShowcase } from "../components/festa/FestaShowcase";
import { ActivityPhotos } from "../components/home/ActivityPhotos";
import { CurriculumTimeline } from "../components/home/CurriculumTimeline";
import { DdayBadge } from "../components/home/DdayBadge";
import { FAQSection } from "../components/home/FAQSection";
import { Hero } from "../components/home/Hero";
import { ProjectShowcase } from "../components/home/ProjectShowcase";
import { ScheduleCalendar } from "../components/home/ScheduleCalendar";

/** 홈 응답을 기다리며 첫 화면을 비워 두는 최대 시간. 행사 중이면 평소 홈이 번쩍하는 걸 막는 용도라 짧게. */
const HOME_GATE_MS = 1500;

/** 평소 공개 홈. Figma 와이어프레임(`1:326`) 순서대로 섹션을 배치한다. */
function RegularHome() {
  /*
   * 섹션 스크롤 스냅(`index.css`)은 Home에만 필요하다. 전역에 걸어두면 다른 라우트로
   * 이동했을 때 <ScrollRestoration />의 스크롤-맨위-복귀가 씹혀서, Home이 떠 있는 동안만 켠다.
   *
   * **마운트 직후 한 틱을 미룬다(#297).** 새로고침으로 Home에 처음 들어오면
   * <ScrollRestoration />(또는 브라우저 자체)이 이전 스크롤 위치를 복원하려 하는데, 그
   * 시도가 끝나기 전에 scroll-snap-type: mandatory가 이미 걸려 있으면 브라우저가 복원
   * 위치를 무시하고 "가장 가까운 스냅 지점"으로 되돌린다 — Footer도 실제 스냅 지점이라
   * (`Footer.module.scss` 참고) 새로고침을 반복하면 매번 그리로 튄다. 복원이 끄트머리에
   * 닿았을 다음 프레임에 스냅을 켜면 이 경쟁을 피한다.
   *
   * **다만 이 한 프레임만으로는 부족했다.** 스냅이 켜지는 시점을 재 보면 `readyState`는 이미
   * `complete`인데 `scrollHeight`는 최종 6300 중 1874(약 30%)뿐이다 — SPA라 문서 자체는 일찍
   * 끝나고 React가 뒤늦게 채우기 때문에 `load`도 신호가 되지 못한다. 그래서 새로고침 복원이
   * 그 짧은 문서에 이전 위치를 되살리면 Footer에 붙어 버렸다. 지금은 새로고침 시 복원을 아예
   * 하지 않아(`main.tsx`) 이 경쟁 자체가 없다. 그래도 이 한 틱은 남겨 둔다 — 브라우저 자체의
   * 복원 등 우리가 안 부른 스크롤까지 막아 주지는 못하기 때문이다.
   *
   * **끄는 쪽은 반대로 최대한 이르게 — `useLayoutEffect`여야 한다.** 떠날 때도 같은 경쟁이
   * 있는데 방향이 반대다. `<ScrollRestoration />`은 라우트가 바뀌면 레이아웃 이펙트에서
   * `window.scrollTo(0, 0)`을 부른다(react-router `useScrollRestoration`). 이걸 passive
   * cleanup(`useEffect`)에서 떼면 React가 페인트 뒤로 미루므로, 스크롤 복귀가 도는 시점엔
   * 스냅이 아직 켜져 있다. 그 페이지에는 홈의 섹션이 없어 남은 스냅 지점이 Footer 하나뿐이라,
   * mandatory 스냅이 `scrollTo(0, 0)`을 가로채 문서 맨 아래로 끌고 간다 — 다른 페이지로
   * 넘어갔는데 푸터가 보이던 증상의 정체다.
   *
   * 레이아웃 이펙트의 정리는 커밋의 mutation 단계에서 돌고, 형제의 레이아웃 이펙트는 그
   * 다음 layout 단계에서 돈다. 그래서 이 순서는 우연이 아니라 React가 보장한다.
   */
  useLayoutEffect(() => {
    const frame = requestAnimationFrame(() => {
      document.documentElement.classList.add("home-scroll-snap");
    });
    return () => {
      cancelAnimationFrame(frame);
      document.documentElement.classList.remove("home-scroll-snap");
    };
  }, []);

  return (
    <>
      <DdayBadge />
      <Hero />
      <ScheduleCalendar />
      <ActivityPhotos />
      <CurriculumTimeline />
      <ProjectShowcase />
      <FAQSection />
    </>
  );
}

/**
 * 공개 홈(`/`). 모의투자 FESTA 기간(어드민 기능 설정 `MOCK_INVESTMENT` 토글, `features.mockInvestment`)
 * 에는 평소 홈 대신 FESTA 쇼케이스를 그린다(#359). 토글 기본값은 꺼짐이다(BE V21 시드).
 *
 * **응답이 오기 전에는 평소 홈도 그리지 않는다** — 먼저 그려 두면 행사 기간에 홈이 번쩍 보였다가
 * 쇼케이스로 바뀐다. `ProjectShowcase`가 같은 쿼리 키로 이미 부르던 요청이라 추가 호출은 없다.
 * 실패하면 평소 홈으로 돌아간다 — 홈 데이터 하나 때문에 첫 화면이 통째로 비면 안 된다.
 */
export default function HomePage() {
  // 탭으로 돌아올 때 다시 읽는다 — 행사장 화면처럼 계속 켜 둔 탭에도 토글 변경이 닿게(#361 리뷰).
  const { data, isPending, failureCount } = useQuery({
    queryKey: queryKeys.public.home(),
    queryFn: getHome,
    refetchOnWindowFocus: true,
  });

  /*
   * **빈 화면은 첫 결론 전까지만, 그것도 짧게.** 응답이 오거나, 첫 시도가 실패하거나,
   * `HOME_GATE_MS`가 지나면 결론을 낸다 — 재시도(2회)·타임아웃(10초)까지 기다리면 실패 시
   * 첫 화면이 최대 30초 넘게 비었다(#361 리뷰). 늦게 온 응답이 행사 중이면 그때 쇼케이스로 바뀐다.
   *
   * 한 번 결론이 나면 다시 빈 화면으로 돌아가지 않는다. 실패 후 평소 홈의 `ProjectShowcase`가 같은
   * 쿼리를 다시 부르면(retryOnMount) 데이터 없는 쿼리는 `pending`으로 되돌아가는데, 그걸 빈 화면으로
   * 받으면 언마운트·재실패·재마운트가 끝없이 반복된다.
   */
  const [timedOut, setTimedOut] = useState(false);
  useEffect(() => {
    const timer = setTimeout(() => setTimedOut(true), HOME_GATE_MS);
    return () => clearTimeout(timer);
  }, []);
  const [settled, setSettled] = useState(false);
  if (!settled && (!isPending || failureCount > 0 || timedOut)) setSettled(true);

  if (!settled) return <div style={{ minHeight: "calc(100vh - 4rem)" }} aria-busy="true" />;
  if (data?.features.mockInvestment === true) return <FestaShowcase />;
  return <RegularHome />;
}
