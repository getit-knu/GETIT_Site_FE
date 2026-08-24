import { ActivityPhotos } from "../components/home/ActivityPhotos";
import { CurriculumTimeline } from "../components/home/CurriculumTimeline";
import { FAQSection } from "../components/home/FAQSection";
import { Hero } from "../components/home/Hero";
import { ProjectShowcase } from "../components/home/ProjectShowcase";
import { ScheduleCalendar } from "../components/home/ScheduleCalendar";

/** 공개 홈. Figma 와이어프레임(`1:326`) 순서대로 섹션을 배치한다. */
export default function HomePage() {
  return (
    <>
      <Hero />
      <ScheduleCalendar />
      <ActivityPhotos />
      <CurriculumTimeline />
      <ProjectShowcase />
      <FAQSection />
    </>
  );
}
