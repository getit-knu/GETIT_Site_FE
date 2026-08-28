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
  // 섹션 스크롤 스냅(`index.css`)은 Home에만 필요하다. 전역에 걸어두면 다른 라우트로
  // 이동했을 때 <ScrollRestoration />의 스크롤-맨위-복귀가 씹혀서, Home이 떠 있는 동안만 켠다.
  useEffect(() => {
    document.documentElement.classList.add("home-scroll-snap");
    return () => document.documentElement.classList.remove("home-scroll-snap");
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
