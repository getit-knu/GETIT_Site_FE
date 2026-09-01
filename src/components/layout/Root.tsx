import { Outlet, ScrollRestoration } from "react-router";

import { useDocumentTitle } from "../../hooks/ui/useDocumentTitle";

/**
 * 라우트 트리 맨 위. 경로가 없어서 모든 화면이 이 아래에 들어온다.
 *
 * **탭 제목은 여기서만 쓴다**(`useDocumentTitle` 주석 참고). 페이지마다 각자 쓰면
 * 새 라우트를 추가할 때 빠뜨리기 쉽고, 빠뜨려도 티가 나지 않는다.
 *
 * `createBrowserRouter` 는 페이지 전환 시 스크롤을 알아서 맨 위로 돌려주지 않는다 —
 * `<ScrollRestoration />` 을 라우터 트리 **안에** 직접 그려야 동작한다.
 */
export function Root() {
  useDocumentTitle();

  return (
    <>
      <ScrollRestoration />
      <Outlet />
    </>
  );
}
