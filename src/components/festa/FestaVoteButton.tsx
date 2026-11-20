import clsx from "clsx";

import styles from "./FestaVoteButton.module.scss";

interface FestaVoteButtonProps {
  title: string;
  /** 지금 고른 팀(아직 투표 전일 수 있다). */
  isChosen: boolean;
  /** 우리 조 프로젝트면 버튼 대신 안내만 보여준다. */
  isOwn: boolean;
  onChoose: () => void;
}

/** 카드 아래 "이 팀에 투표"(#373). 고르기만 하고, 실제 투표는 아래 바의 버튼으로 한다. */
export function FestaVoteButton({ title, isChosen, isOwn, onChoose }: FestaVoteButtonProps) {
  if (isOwn) {
    return <p className={styles.own}>우리 팀 프로젝트라 투표할 수 없어요</p>;
  }

  return (
    <button
      type="button"
      className={clsx(styles.choose, isChosen && styles.chosen)}
      aria-pressed={isChosen}
      aria-label={`${title}에 투표`}
      onClick={onChoose}
    >
      {isChosen ? "✓ 선택함" : "이 팀에 투표"}
    </button>
  );
}
