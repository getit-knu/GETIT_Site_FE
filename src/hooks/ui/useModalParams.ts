import { useCallback } from "react";
import { useSearchParams } from "react-router";

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
  const rawId = searchParams.get("id");
  // URL 은 문자열만 담는다. `?id=abc` 처럼 손으로 고친 주소로도 들어올 수 있어
  // 숫자가 아니면 없는 것으로 본다.
  const parsedId = rawId === null ? null : Number(rawId);
  const id = parsedId !== null && Number.isInteger(parsedId) ? parsedId : null;

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
