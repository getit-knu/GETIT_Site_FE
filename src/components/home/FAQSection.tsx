import { useQuery } from "@tanstack/react-query";
import { useState } from "react";

import { getFaqs } from "../../apis/public/publicApi";
import { queryKeys } from "../../apis/queryKeys";

import styles from "./FAQSection.module.scss";

/** 자주 묻는 질문(2.5, #212). 비공개 처리한 FAQ는 서버가 걸러서 안 준다. */
export function FAQSection() {
  const { data } = useQuery({ queryKey: queryKeys.public.faqs(), queryFn: getFaqs });
  const [openId, setOpenId] = useState<number | null>(null);

  function toggle(id: number) {
    setOpenId((current) => (current === id ? null : id));
  }

  if (data === undefined || data.length === 0) return null;

  return (
    <section className={styles.section}>
      <div className={styles.inner}>
        <div className={styles.heading}>
          <h2 className={styles.title}>자주 묻는 질문</h2>
          <p className={styles.subtitle}>FAQ</p>
        </div>

        <ul className={styles.list}>
          {data.map((item) => {
            const isOpen = openId === item.id;

            return (
              <li key={item.id} className={styles.item}>
                <button
                  type="button"
                  className={styles.question}
                  aria-expanded={isOpen}
                  aria-controls={`faq-${item.id}-answer`}
                  onClick={() => toggle(item.id)}
                >
                  <span>{item.question}</span>
                  <svg
                    className={isOpen ? styles.iconOpen : styles.icon}
                    viewBox="0 0 24 24"
                    fill="none"
                    aria-hidden="true"
                    focusable="false"
                  >
                    <path
                      d="M5 12H19"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    <path
                      d="M12 5V19"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </button>

                {isOpen && (
                  <p id={`faq-${item.id}-answer`} className={styles.answer}>
                    {item.answer}
                  </p>
                )}
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
