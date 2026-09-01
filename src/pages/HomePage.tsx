import { useLayoutEffect } from "react";

import { ActivityPhotos } from "../components/home/ActivityPhotos";
import { CurriculumTimeline } from "../components/home/CurriculumTimeline";
import { DdayBadge } from "../components/home/DdayBadge";
import { FAQSection } from "../components/home/FAQSection";
import { Hero } from "../components/home/Hero";
import { ProjectShowcase } from "../components/home/ProjectShowcase";
import { ScheduleCalendar } from "../components/home/ScheduleCalendar";

/** 공개 홈. Figma 와이어프레임(`1:326`) 순서대로 섹션을 배치한다. */
export default function HomePage() {
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
