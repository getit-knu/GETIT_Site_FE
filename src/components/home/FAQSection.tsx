import { useQuery } from "@tanstack/react-query";
import { useState, type CSSProperties } from "react";

import { getFaqs } from "../../apis/public/publicApi";
import { queryKeys } from "../../apis/queryKeys";
import { useAnimatedPresence } from "../../hooks/ui/useAnimatedPresence";
import { useScrollReveal } from "../../hooks/ui/useScrollReveal";
import type { PublicFaq } from "../../types/home";

import styles from "./FAQSection.module.scss";

/**
 * FAQ 한 항목. 답변 펼침·접힘을 `grid-template-rows` 0fr↔1fr 애니메이션으로 부드럽게
 * 보여준다(UX 라운드 2). 접을 때도 애니메이션이 보이도록 `useAnimatedPresence`로 unmount를
 * 늦춘다 — Modal·Toast와 같은 패턴이라 접힘이 끝나면 DOM에서 완전히 사라진다(접근성 트리 포함).
 */
function FaqItem({
  item,
  isOpen,
  onToggle,
  revealIndex,
}: {
  item: PublicFaq;
  isOpen: boolean;
  onToggle: () => void;
  revealIndex: number;
}) {
  // 접힘 애니메이션($duration-base=250ms)이 끝나기 전에 타임아웃 폴백이 먼저 unmount하지
  // 않도록 여유를 둔다 — 정상 경로는 animationend → endExit가 먼저 온다.
  const { mounted, exiting, endExit } = useAnimatedPresence(isOpen, 300);

  return (
    <li className={styles.item} style={{ "--reveal-index": revealIndex } as CSSProperties}>
      <button
        type="button"
        className={styles.question}
        aria-expanded={isOpen}
        aria-controls={`faq-${item.id}-answer`}
        onClick={onToggle}
      >
        <span>{item.question}</span>
        <svg
          className={isOpen ? styles.iconOpen : styles.icon}
          viewBox="0 0 24 24"
          fill="none"
          aria-hidden="true"
          focusable="false"
        >
          <path d="M5 12H19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M12 5V19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      {mounted && (
        <div className={styles.answerReveal} data-exiting={exiting || undefined} onAnimationEnd={endExit}>
          <div className={styles.answerClip}>
            <p id={`faq-${item.id}-answer`} className={styles.answer}>
              {item.answer}
            </p>
          </div>
        </div>
      )}
    </li>
  );
}

/** 자주 묻는 질문(2.5, #212). 비공개 처리한 FAQ는 서버가 걸러서 안 준다. */
export function FAQSection() {
  const { data } = useQuery({ queryKey: queryKeys.public.faqs(), queryFn: getFaqs });
  const [headingRef, headingRevealed] = useScrollReveal<HTMLDivElement>();
  const [listRef, listRevealed] = useScrollReveal<HTMLUListElement>(0.1);
  const [openId, setOpenId] = useState<number | null>(null);

  function toggle(id: number) {
    setOpenId((current) => (current === id ? null : id));
  }

  if (data === undefined || data.length === 0) return null;

  return (
    <section className={styles.section}>
      <div className={styles.inner}>
        <div ref={headingRef} data-revealed={headingRevealed || undefined} className={styles.heading}>
          <h2 className={styles.title}>자주 묻는 질문</h2>
          <p className={styles.subtitle}>FAQ</p>
        </div>

        <ul ref={listRef} data-revealed={listRevealed || undefined} className={styles.list}>
          {data.map((item, index) => (
            <FaqItem
              key={item.id}
              item={item}
              isOpen={openId === item.id}
              onToggle={() => toggle(item.id)}
              revealIndex={index}
            />
          ))}
        </ul>
      </div>
    </section>
  );
}
