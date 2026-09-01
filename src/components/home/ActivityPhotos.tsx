import { useQuery } from "@tanstack/react-query";
import { useEffect, useRef } from "react";

import { getActivityPhotos } from "../../apis/public/publicApi";
import { queryKeys } from "../../apis/queryKeys";
import { useScrollReveal } from "../../hooks/ui/useScrollReveal";
import { prefersReducedMotion } from "../../libs/prefersReducedMotion";
import type { PublicActivityPhoto } from "../../types/home";

import styles from "./ActivityPhotos.module.scss";

/** 자동 흐름 속도(px/s). CSS 시절 30s 주기와 비슷한 체감으로 맞췄다. */
const AUTO_SPEED = 40;

/** 드래그를 놓는 순간 관성으로 이어갈 속도의 상한(px/s) — 홱 던져도 날아가지 않게. */
const MAX_FLING_SPEED = 1500;

/** 이보다 느려지면 멎은 것으로 보고 rAF 루프를 세운다(px/s). 1프레임에 0.01px 미만. */
const IDLE_SPEED = 0.5;

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function CardList({ photos, hidden }: { photos: PublicActivityPhoto[]; hidden?: boolean }) {
  return (
    <ul className={styles.grid} aria-hidden={hidden}>
      {photos.map((photo) => (
        <li key={photo.id} className={styles.card}>
          <img src={photo.imageUrl} alt="GET IT 활동 사진" className={styles.thumbnail} draggable={false} />
        </li>
      ))}
    </ul>
  );
}

/**
 * 어드민이 등록·노출한 활동 사진만 순서대로 흐른다(BE#146). 등록된 사진이 없으면
 * 흘려보낼 카드 자체가 없어 섹션을 통째로 숨긴다(`FAQSection`과 같은 방식).
 *
 * 카드 목록을 통째로 한 번 더 복제해 나란히 붙이고, 그 폭의 절반만큼 왼쪽으로
 * 무한 반복 이동시켜 자연스럽게 흘러가는 것처럼 보이게 한다 — 원본과 복제본의
 * 폭이 정확히 같아야 이어지는 지점이 안 보인다(`ActivityPhotos.module.scss` 참고).
 * 복제본은 화면에 두 번 읽히지 않도록 `aria-hidden`으로 접근성 트리에서 뺀다.
 *
 * 이동은 CSS 애니메이션이 아니라 rAF 루프가 직접 굴린다(UX 라운드 2) — 그래야
 * **드래그로 스크럽**할 수 있다. 커서를 올리면 서서히 멈추고, 드래그로 앞뒤를 훑고,
 * 놓으면 관성이 자동 흐름 속도로 부드럽게 수렴한다. 동작 줄이기 사용자에겐 자동
 * 흐름을 끄고 드래그만 남긴다.
 */
export function ActivityPhotos() {
  const { data } = useQuery({ queryKey: queryKeys.public.activityPhotos(), queryFn: getActivityPhotos });
  const marqueeRef = useRef<HTMLDivElement | null>(null);
  const trackRef = useRef<HTMLDivElement | null>(null);
  const [headingRef, headingRevealed] = useScrollReveal<HTMLDivElement>();
  const hasPhotos = data !== undefined && data.length > 0;

  useEffect(() => {
    const marqueeEl = marqueeRef.current;
    const trackEl = trackRef.current;
    if (!hasPhotos || marqueeEl === null || trackEl === null) return;
    if (typeof requestAnimationFrame !== "function") return;

    // 클로저(이벤트 핸들러·rAF 루프)에서도 non-null로 쓰기 위한 좁혀진 별칭.
    const marquee: HTMLDivElement = marqueeEl;
    const track: HTMLDivElement = trackEl;

    const autoSpeed = prefersReducedMotion() ? 0 : AUTO_SPEED;

    let offset = 0; // 트랙 x 위치(px, 항상 -절반폭 ~ 0으로 되감는다)
    let velocity = -autoSpeed; // px/s
    let paused = false; // hover 중엔 자동 흐름을 세운다(드래그 준비 상태)
    let dragging = false;
    let lastX = 0;
    let lastMoveTime = 0;
    let prevFrameTime: number | null = null;
    let raf = 0;

    function frame(now: number) {
      // 탭 전환 등으로 프레임이 한참 만에 오면 dt가 튀므로 50ms로 자른다.
      const dt = prevFrameTime === null ? 0 : Math.min((now - prevFrameTime) / 1000, 0.05);
      prevFrameTime = now;

      // 관성(드래그 직후)과 자동 흐름을 하나의 속도로 다룬다 — 목표 속도로 지수 수렴.
      // 드래그 중에는 handleMove가 offset을 직접 옮기므로 적분하지 않는다.
      const target = paused ? 0 : -autoSpeed;
      if (!dragging) {
        velocity += (target - velocity) * Math.min(1, dt * 4);
        offset += velocity * dt;
      }

      const half = track.scrollWidth / 2;
      if (half > 0) {
        offset = -(((-offset % half) + half) % half);
        track.style.transform = `translate3d(${offset}px, 0, 0)`;
      }

      // 더 움직일 이유가 없으면(정지가 목표이고 이미 멎었고 드래그도 아님) 루프를 세운다.
      // 안 그러면 동작 줄이기(autoSpeed 0)나 hover 정지 상태에서 프레임 콜백이 영원히 돈다.
      if (!dragging && target === 0 && Math.abs(velocity) < IDLE_SPEED) {
        velocity = 0;
        raf = 0;
        prevFrameTime = null;
        return;
      }
      raf = requestAnimationFrame(frame);
    }

    /** 멈춰 있던 루프를 다시 돌린다. 이미 돌고 있으면 아무것도 하지 않는다. */
    function start() {
      if (raf !== 0) return;
      // 멈춘 사이의 시간이 dt로 잡히지 않게 기준 시각을 지운다(첫 프레임 dt = 0).
      prevFrameTime = null;
      raf = requestAnimationFrame(frame);
    }
    start();

    function handleDown(event: PointerEvent) {
      dragging = true;
      lastX = event.clientX;
      lastMoveTime = event.timeStamp;
      velocity = 0;
      marquee.setAttribute("data-dragging", "");
      marquee.setPointerCapture(event.pointerId);
      start();
    }

    function handleMove(event: PointerEvent) {
      if (!dragging) return;
      const dx = event.clientX - lastX;
      const dtMs = event.timeStamp - lastMoveTime;
      offset += dx;
      // 놓았을 때 이어갈 관성 속도 — 마지막 이동의 순간 속도를 쓰되 과속은 자른다.
      if (dtMs > 0) velocity = clamp((dx / dtMs) * 1000, -MAX_FLING_SPEED, MAX_FLING_SPEED);
      lastX = event.clientX;
      lastMoveTime = event.timeStamp;
    }

    function handleUp() {
      dragging = false;
      marquee.removeAttribute("data-dragging");
      // 놓는 순간의 관성을 이어 재생한다 — 드래그 중 루프가 멎는 일은 없지만 방어적으로 둔다.
      start();
    }

    function handleEnter(event: PointerEvent) {
      if (event.pointerType === "mouse") paused = true;
    }

    function handleLeave(event: PointerEvent) {
      if (event.pointerType !== "mouse") return;
      paused = false;
      // hover로 멎어 있던 동안 루프가 정지했으므로 자동 흐름을 되살리려면 반드시 다시 돌려야 한다.
      start();
    }

    marquee.addEventListener("pointerdown", handleDown);
    marquee.addEventListener("pointermove", handleMove);
    marquee.addEventListener("pointerup", handleUp);
    marquee.addEventListener("pointercancel", handleUp);
    marquee.addEventListener("pointerenter", handleEnter);
    marquee.addEventListener("pointerleave", handleLeave);

    return () => {
      cancelAnimationFrame(raf);
      marquee.removeEventListener("pointerdown", handleDown);
      marquee.removeEventListener("pointermove", handleMove);
      marquee.removeEventListener("pointerup", handleUp);
      marquee.removeEventListener("pointercancel", handleUp);
      marquee.removeEventListener("pointerenter", handleEnter);
      marquee.removeEventListener("pointerleave", handleLeave);
    };
  }, [hasPhotos]);

  if (data === undefined || data.length === 0) return null;

  return (
    <section className={styles.section}>
      <div ref={headingRef} data-revealed={headingRevealed || undefined} className={styles.heading}>
        <h2 className={styles.title}>GET IT과 함께한 순간들</h2>
        <p className={styles.subtitle}>타과생도 부담 없이, 동아리 활동 현장을 먼저 만나보세요</p>
      </div>

      <div ref={marqueeRef} className={styles.marquee}>
        <div ref={trackRef} className={styles.track}>
          <CardList photos={data} />
          <CardList photos={data} hidden />
        </div>
      </div>
    </section>
  );
}
