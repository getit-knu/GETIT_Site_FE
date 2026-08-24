import { createContext, useContext } from "react";

/**
 * `Modal` 이 만든 제목 id 를 헤더에 전달하는 내부 채널.
 *
 * 쓰는 쪽은 id 를 몰라도 되고 `<Modal><ModalHeader title="…" /></Modal>` 로 쓰면 된다.
 *
 * 컴포넌트 파일(`Modal.tsx`)이 아니라 여기 둔다 — 컴포넌트 파일에서 훅까지 내보내면
 * Fast Refresh 가 깨진다(`react-refresh/only-export-components`).
 */
export const ModalTitleContext = createContext<string | undefined>(undefined);

/**
 * 헤더를 직접 그리는 쪽에서 제목에 붙일 id.
 *
 * **`Modal` 안에서 불러야 한다.** 바깥에서 부르면 `undefined` 라 `aria-labelledby` 가
 * 끊기고 보조 기술이 모달의 이름을 찾지 못한다.
 */
export function useModalTitleId(): string | undefined {
  return useContext(ModalTitleContext);
}
