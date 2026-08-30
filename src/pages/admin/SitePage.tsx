import { useState } from "react";

import { Button } from "../../components/ui/Button/Button";
import { Input } from "../../components/ui/Input/Input";
import { ErrorState } from "../../components/ui/states/States";
import { isSiteErrorCode, siteErrorMessage, siteSaveErrorMessage } from "../../errors/site/errorMessages";
import {
  useGeneration,
  useSaveGeneration,
  useSaveSiteSettings,
  useSaveTracks,
  useSiteSettings,
  useTracks,
} from "../../hooks/site/useSiteSettings";
import type { Generation, SiteSettings } from "../../types/site";

import { CurriculumsSection } from "./site/CurriculumsSection";
import { EventsSection } from "./site/EventsSection";
import { FaqSection } from "./site/FaqSection";
import { FeaturesSection } from "./site/FeaturesSection";
import { invalidReason, SCHEDULE_FIELDS, toDraft, toSchedule } from "./site/scheduleDraft";
import type { ScheduleDraft } from "./site/scheduleDraft";
import { StaffsSection } from "./site/StaffsSection";
import { TracksSection } from "./site/TracksSection";
import { toTrackDrafts, toTracks, tracksInvalidReason } from "./site/tracksDraft";
import type { TrackDraft } from "./site/tracksDraft";
import styles from "./SitePage.module.scss";

const SECTION_NAV_ITEMS = [
  { id: "generation", label: "진행 기수" },
  { id: "schedule", label: "모집 일정" },
  { id: "faqs", label: "FAQ" },
  { id: "tracks", label: "강의 분류" },
  { id: "curriculums", label: "커리큘럼" },
  { id: "events", label: "행사 일정" },
  { id: "staffs", label: "운영진" },
  { id: "features", label: "기능 활성화" },
] as const;

/**
 * 섹션 8개로 바로 이동하는 sticky 앵커 바.
 *
 * 페이지 내부 이동일 뿐이라 `<a href="#id">`를 그대로 쓴다 — react-router `Link`가 아니다.
 * 스크롤 위치에 따라 현재 섹션을 강조하는 기능(scroll-spy)은 범위 밖이라 넣지 않았다.
 */
function SiteSectionNav() {
  return (
    <nav className={styles.sectionNav} aria-label="사이트 관리 섹션 바로가기">
      {SECTION_NAV_ITEMS.map((item) => (
        <a key={item.id} href={`#${item.id}`} className={styles.sectionNavLink}>
          {item.label}
        </a>
      ))}
    </nav>
  );
}

/**
 * 조회한 뒤에만 마운트한다. 그래야 `useState` 초기값으로 기존 값을 넣을 수 있다.
 *
 * `generation`이 `null`이면 아직 활성 기수가 하나도 없는 상태다(배포 직후 등) — BE의
 * `PUT`은 없는 `generationNo`를 그대로 새로 만들어서 활성화하는 upsert라, 빈 폼으로
 * 시작해도 저장만 누르면 첫 기수가 만들어진다.
 */
function GenerationSection({ generation }: { generation: Generation | null }) {
  const [generationNo, setGenerationNo] = useState(generation !== null ? String(generation.generationNo) : "");
  const [year, setYear] = useState(generation !== null ? String(generation.year) : "");
  const save = useSaveGeneration();

  const no = Number(generationNo);
  const yr = Number(year);
  const reason =
    !Number.isInteger(no) || no < 1
      ? "기수는 1 이상의 정수여야 합니다."
      : !Number.isInteger(yr) || yr < 1
        ? "연도를 올바르게 입력해 주세요."
        : null;

  function edit(apply: () => void) {
    if (save.isSuccess || save.isError) save.reset();
    apply();
  }

  return (
    <section id="generation" className={styles.section}>
      <h2 className={styles.sectionTitle}>진행 기수</h2>
      <div className={styles.grid}>
        <Input label="기수" type="number" value={generationNo} onChange={(v) => edit(() => setGenerationNo(v))} />
        <Input label="연도" type="number" value={year} onChange={(v) => edit(() => setYear(v))} />
      </div>

      {/* 새 기수를 활성화하면 기존 활성 기수가 내려간다. 되돌릴 수 없다. */}
      <p className={styles.hint}>
        {generation === null
          ? "아직 진행 중인 기수가 없습니다. 저장하면 이 기수가 새로 만들어지고 활성화됩니다."
          : "저장하면 이 기수가 활성 기수가 되고, 기존 활성 기수는 비활성화됩니다."}
      </p>

      <div className={styles.footer}>
        {reason !== null && <p className={styles.reason}>{reason}</p>}
        {save.error !== null && <p className={styles.reason}>{siteSaveErrorMessage(save.error)}</p>}
        {save.isSuccess && save.error === null && (
          <p className={styles.saved} role="status">
            저장했습니다.
          </p>
        )}
        <Button
          disabled={reason !== null || save.isPending}
          onClick={() => save.mutate({ generationNo: no, year: yr })}
        >
          {save.isPending ? "저장 중…" : "진행 기수 저장"}
        </Button>
      </div>
    </section>
  );
}

/** 조회한 뒤에만 마운트한다. 그래야 `useState` 초기값으로 기존 값을 넣을 수 있다. */
function RestSectionsForm({ settings }: { settings: SiteSettings }) {
  const [schedule, setSchedule] = useState<ScheduleDraft>(() => toDraft(settings.schedule));
  const save = useSaveSiteSettings();

  // 섹션이 늘어나면 이유도 늘어난다. 먼저 걸리는 것 하나만 보여준다.
  const reason = invalidReason(schedule);

  /**
   * 값을 고치면 지난 저장 결과를 지운다.
   *
   * 그대로 두면 저장한 뒤 한 글자만 바꿔도 "저장했습니다." 가 계속 떠 있어,
   * 아직 보내지 않은 값을 저장된 것으로 읽게 된다. 실패 문구도 마찬가지다.
   */
  function edit(apply: () => void) {
    if (save.isSuccess || save.isError) save.reset();
    apply();
  }

  function handleSave() {
    save.mutate({ schedule: toSchedule(schedule) });
  }

  return (
    <>
      <section id="schedule" className={styles.section}>
        <h2 className={styles.sectionTitle}>모집 일정</h2>
        <div className={styles.grid}>
          {SCHEDULE_FIELDS.map(({ key, label }) => (
            <Input
              key={key}
              label={label}
              type="datetime-local"
              value={schedule[key]}
              onChange={(value) => edit(() => setSchedule((prev) => ({ ...prev, [key]: value })))}
            />
          ))}
        </div>
        {/* 면접 마감은 서버가 전체 모집 마감으로 맞춘다(명세서 6.2). 입력칸을 두지 않는다. */}
        <p className={styles.hint}>면접 마감은 전체 모집 마감과 같게 저장됩니다.</p>
      </section>

      <div className={styles.footer}>
        {/* 저장을 막는 이유를 미리 보여준다. 눌러 보고 알게 하지 않는다. */}
        {reason !== null && <p className={styles.reason}>{reason}</p>}
        {save.error !== null && <p className={styles.reason}>{siteSaveErrorMessage(save.error)}</p>}
        {save.isSuccess && save.error === null && (
          <p className={styles.saved} role="status">
            저장했습니다.
          </p>
        )}
        <Button disabled={reason !== null || save.isPending} onClick={handleSave}>
          {save.isPending ? "저장 중…" : "저장하기"}
        </Button>
      </div>
    </>
  );
}

/**
 * 강의 분류. 트랙은 기수에 안 묶인다 — 개별 엔드포인트로 즉시 반영되지만(#195),
 * 트리 편집 UX는 여러 항목을 한 번에 고치는 게 자연스러워 초안 하나로 모아 두고
 * `저장하기`에서 diff 를 계산한다.
 *
 * 저장 뒤에는 `drafts` 를 비워 서버가 새로 매긴 id 로 다시 채운다 — 비우지 않으면
 * 방금 만든 항목이 계속 `id: null` 로 남아 다음 저장에서 또 새로 생성돼 버린다
 * (부분 실패 시에도 마찬가지로 비운다 — 어디까지 반영됐는지 서버 상태를 다시 봐야 한다).
 *
 * `<section id="tracks">`를 조회 중 · 실패 상태에서도 유지한다(Curriculum·Events와 같은
 * 모양) — 그래야 섹션 네비게이션 앵커가 로딩 중에도 항상 존재한다.
 */
function TracksFormSection() {
  const { data, isPending, isError, error, refetch } = useTracks();
  const save = useSaveTracks();
  const [drafts, setDrafts] = useState<TrackDraft[] | null>(null);

  const tracks = drafts ?? (data ? toTrackDrafts(data) : []);
  const reason = tracksInvalidReason(tracks);

  function edit(apply: () => void) {
    if (save.isSuccess || save.isError) save.reset();
    apply();
  }

  function handleSave() {
    save.mutate(toTracks(tracks), { onSettled: () => setDrafts(null) });
  }

  return (
    <section id="tracks" className={styles.section}>
      <h2 className={styles.sectionTitle}>강의 분류</h2>

      {isPending && <p className={styles.hint}>불러오는 중…</p>}
      {isError && <ErrorState message={siteErrorMessage(error)} onRetry={() => void refetch()} />}

      {data && (
        <TracksSection
          tracks={tracks}
          onChange={(next) => edit(() => setDrafts(next))}
          onSave={handleSave}
          saving={save.isPending}
          reason={reason}
          saveError={save.error !== null ? siteSaveErrorMessage(save.error) : null}
          saved={save.isSuccess}
        />
      )}
    </section>
  );
}

/**
 * 사이트 관리. 와이어프레임 p9.
 *
 * **진행 기수 · 운영진 · 행사 · 커리큘럼 · 강의 분류 · FAQ는 각자 실제 CRUD 로 즉시
 * 반영된다(#194 · #195 · #212).** 모집 일정만 아직 실제 엔드포인트가 없어 폼에서
 * 저장한다.
 */
export default function SitePage() {
  const generationQuery = useGeneration();
  const settingsQuery = useSiteSettings();

  // 활성 기수가 아직 없는 것도 정상 상태다(배포 직후 등) — 페이지 전체를 막지 않는다.
  const generationMissing = isSiteErrorCode(generationQuery.error, "ACTIVE_GENERATION_NOT_FOUND");

  const isPending = generationQuery.isPending || settingsQuery.isPending;
  const errorQuery =
    generationQuery.isError && !generationMissing ? generationQuery : settingsQuery.isError ? settingsQuery : null;

  if (isPending) return <p className={styles.loading}>불러오는 중…</p>;
  if (errorQuery) {
    return <ErrorState message={siteErrorMessage(errorQuery.error)} onRetry={() => void errorQuery.refetch()} />;
  }

  const generation = generationMissing ? null : (generationQuery.data as Generation);

  return (
    <div className={styles.page}>
      <SiteSectionNav />
      <GenerationSection generation={generation} />
      <RestSectionsForm settings={settingsQuery.data as SiteSettings} />
      <FaqSection />
      <TracksFormSection />

      {/*
        커리큘럼 · 행사 · 운영진은 활성 기수에 딸린 데이터라 기수부터 있어야 의미가 있다.
      */}
      {generation !== null && (
        <>
          <CurriculumsSection generationId={generation.id} />
          <EventsSection generationId={generation.id} />
          <StaffsSection generationNo={generation.generationNo} />
        </>
      )}
      <FeaturesSection />
    </div>
  );
}
