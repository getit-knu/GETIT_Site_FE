/**
 * 링크로 걸 수 있는 URL인지. 빈 문자열·`null`도 온다(springdoc이 nullable을 못 잡음). http(s)만 통과 —
 * 부원 제출(`ProjectSubmitRequest`)엔 BE `@HttpUrl` 검증이 없어 아무 스킴이나 내려온다(#360 리뷰).
 */
export function isLinkableUrl(url: string | null | undefined): url is string {
  return typeof url === "string" && /^https?:\/\/\S+$/i.test(url.trim());
}
