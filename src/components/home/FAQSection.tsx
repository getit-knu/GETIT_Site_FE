import { useState } from "react";

import { FAQ_ITEMS } from "../../mocks/home/faq";

import styles from "./FAQSection.module.scss";

/** 실제 답변 콘텐츠가 아직 없어 임시 문구를 보여준다(mocks/home/faq.ts). 콘텐츠가 정해지면 교체한다. */
export function FAQSection() {
  const [openId, setOpenId] = useState<string | null>(null);

  function toggle(id: string) {
    setOpenId((current) => (current === id ? null : id));
  }

  return (
    <section className={styles.section}>
      <div className={styles.inner}>
        <div className={styles.heading}>
          <h2 className={styles.title}>자주 묻는 질문</h2>
          <p className={styles.subtitle}>FAQ</p>
        </div>

        <ul className={styles.list}>
          {FAQ_ITEMS.map((item) => {
            const isOpen = openId === item.id;

            return (
              <li key={item.id} className={styles.item}>
                <button
                  type="button"
                  className={styles.question}
                  aria-expanded={isOpen}
                  aria-controls={`${item.id}-answer`}
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
                  <p id={`${item.id}-answer`} className={styles.answer}>
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
