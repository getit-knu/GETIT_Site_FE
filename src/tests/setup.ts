import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { afterEach } from "vitest";

// vitest globals(afterEach 등)를 켜지 않은 프로젝트라 RTL 자동 cleanup이 동작하지 않는다.
// portal로 document.body에 직접 렌더되는 컴포넌트(Modal 등)는 이게 없으면 테스트 간 DOM이 누적된다.
afterEach(() => {
  cleanup();
});

/*
 * jsdom엔 `scrollIntoView`가 아예 없다(레이아웃을 계산하지 않으므로 스크롤 개념도 없다).
 * 안 채워 두면 이걸 부르는 코드가 `is not a function`으로 던지고, 그 뒤에 오는 포커스 이동
 * 같은 동작이 통째로 사라진 채 테스트만 애매하게 실패한다 — 지원 폼의 "못 채운 칸으로
 * 데려다 놓기"가 실제로 그렇게 걸렸다.
 *
 * 진짜 스크롤은 테스트 대상이 아니므로 아무 일도 하지 않는 함수로 둔다.
 */
Element.prototype.scrollIntoView = () => {};

/*
 * 같은 이유로 글자 위치를 재는 API도 비어 있다. 블로그 에디터(ProseMirror, #385)가 명령마다 커서 위치를
 * 재서 스크롤하려다 `getClientRects is not a function`으로 던져, 뒤따르는 명령이 사라진다. 빈 값을 준다.
 */
const emptyRects = () => Object.assign([], { item: () => null }) as unknown as DOMRectList;
Range.prototype.getClientRects = emptyRects;
Range.prototype.getBoundingClientRect = () => new DOMRect();
if (!("getClientRects" in Text.prototype)) {
  Object.defineProperty(Text.prototype, "getClientRects", { value: emptyRects });
}
