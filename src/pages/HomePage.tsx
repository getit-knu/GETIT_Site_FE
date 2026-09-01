import { useEffect } from "react";

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
   * (`Footer.module.scss` 참고) 새로고침을 반복하면 매번 그리로 튄다. 복원이 끝났을
   * 다음 프레임에 스냅을 켜면 이 경쟁을 피한다.
   */
  useEffect(() => {
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
