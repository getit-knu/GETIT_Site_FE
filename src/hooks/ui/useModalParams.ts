import { useCallback } from "react";
import { useSearchParams } from "react-router";

/** 서버가 주는 id 는 1 부터 시작하는 정수다. 그 형태의 문자열만 받아들인다. */
const POSITIVE_INTEGER = /^\d+$/;

/**
 * URL 의 `id` 를 숫자로 바꾼다. 형태가 어긋나면 `null`.
 *
 * `Number()` 로 바로 바꾸면 안 된다. 빈 문자열과 공백을 **0 으로** 만들고
 * (`Number("") === 0`), 지수·16진수 표기(`1e3` → 1000, `0x10` → 16)까지 받아들인다.
 * `Number.isInteger` 도 그 값들은 통과시킨다. 그러면 `?id=` 같은 주소가
 * 없는 항목을 열거나, `?id=0x10` 이 엉뚱한 항목을 연다.
 */
function parseId(raw: string | null): number | null {
  if (raw === null || !POSITIVE_INTEGER.test(raw)) return null;

  const parsed = Number(raw);
  // 자릿수가 아주 크면 정수 정밀도를 벗어나 다른 값이 된다.
  if (parsed === 0 || !Number.isSafeInteger(parsed)) return null;

  return parsed;
}

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
  const id = parseId(searchParams.get("id"));

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
