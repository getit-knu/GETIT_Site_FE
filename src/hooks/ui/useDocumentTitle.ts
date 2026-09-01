import { useEffect } from "react";
import { useMatches } from "react-router";

import { HOME_TITLE } from "../../libs/documentTitle";

/** 라우트가 `handle` 로 실어 보내는 제목. `routes.tsx` 가 유일한 출처다. */
interface TitleHandle {
  title: string;
}

function titleOf(handle: unknown): string | null {
  if (typeof handle !== "object" || handle === null) return null;
  const title = (handle as Partial<TitleHandle>).title;
  return typeof title === "string" ? title : null;
}

/**
 * 지금 열린 라우트의 제목을 탭에 쓴다.
 *
 * 라우트 트리 맨 위에서 **한 번만** 부른다. 페이지마다 각자 `document.title` 을 쓰면
 * 라우트를 새로 추가할 때 빠뜨리기 쉽고, 빠뜨려도 티가 나지 않는다 — 권한 검사를
 * 부모 라우트에서 한 번만 하는 것과 같은 이유다.
 *
 * 제목은 `useMatches()` 로 겹친 라우트를 훑어 **가장 안쪽에 있는 것**을 쓴다. 레이아웃
 * 라우트에 제목을 달아 두면 자식이 없는 자리(예: 로딩 중)에도 그것이 남는다.
 *
 * 어느 라우트도 제목을 주지 않으면 홈 제목으로 돌아간다. 이름 없는 탭보다는 사이트
 * 이름이라도 보이는 게 낫다.
 */
export function useDocumentTitle(): void {
  const matches = useMatches();

  useEffect(() => {
    const title = matches.map((match) => titleOf(match.handle)).findLast((found) => found !== null);

    document.title = title ?? HOME_TITLE;
  }, [matches]);
}
