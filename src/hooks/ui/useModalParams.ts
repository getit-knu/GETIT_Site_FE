import { useCallback } from "react";
import { useSearchParams } from "react-router";

import { parseIntParam } from "../../libs/urlParams";

/**
 * 모달 상태를 URL 에 둔다. `?modal={name}&id={id}`
 *
 * `useState` 로 열고 닫으면 새로고침하는 순간 닫히고, 뒤로가기는 모달이 아니라
 * 이전 화면으로 나가 버린다. 어드민은 표에서 모달을 열어 작업하는 흐름이 대부분이라
 * 링크를 공유하거나 뒤로가기로 닫는 동작이 자연스러워야 한다.
 *
 * ```tsx
 * const { modal, id, openModal, closeModal } = useModalParams();
 *
 * <button onClick={() => openModal("answer", question.id)}>답변 하기</button>
 * {modal === "answer" && <QuestionAnswerModal id={id} onClose={closeModal} />}
 * ```
 */
export function useModalParams() {
  const [searchParams, setSearchParams] = useSearchParams();

  const modal = searchParams.get("modal");
  // 서버 id 는 1 부터다. 0 과 음수는 없는 것으로 본다.
  const id = parseIntParam(searchParams.get("id"), 1);

  const openModal = useCallback(
    (name: string, targetId?: number) => {
      setSearchParams(
        (prev) => {
          const next = new URLSearchParams(prev);
          next.set("modal", name);
          if (targetId === undefined) next.delete("id");
          else next.set("id", String(targetId));
          return next;
        },
        // 모달을 여는 것은 새 기록이다. 뒤로가기로 닫히려면 replace 하면 안 된다.
        { replace: false },
      );
    },
    [setSearchParams],
  );

  const closeModal = useCallback(() => {
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        next.delete("modal");
        next.delete("id");
        return next;
      },
      // 닫기는 기록을 남기지 않는다. 남기면 뒤로가기가 모달을 다시 연다.
      { replace: true },
    );
  }, [setSearchParams]);

  return { modal, id, openModal, closeModal };
}
