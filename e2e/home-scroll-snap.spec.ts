import { expect, test } from "@playwright/test";

/*
 * 홈의 스크롤 스냅이 다른 화면으로 새어 나가지 않는지 본다.
 *
 * **이 파일이 e2e에 있는 이유.** 증상이 브라우저의 실제 레이아웃과 스냅 정착에서만 나타난다.
 * jsdom은 레이아웃을 계산하지 않으니 `scrollY`가 어디로 가는지 알 수 없고, 기껏해야
 * "이펙트 순서"라는 대리 지표까지만 볼 수 있다(`src/pages/HomePage.test.tsx`).
 *
 * **계측이 결과를 바꾼다는 점을 조심할 것.** 이 버그를 쫓는 동안, `window.scrollTo`를 감싸고
 * 그 안에서 `window.scrollY`를 읽는 probe로 "6/6 재현"을 만든 적이 있다. 그 읽기가 동기
 * 레이아웃을 강제해서, 스냅을 관찰한 게 아니라 **유발**한 것이었다. 계측을 걷어내니 재현이
 * 사라졌다. 여기서 레이아웃을 읽는 시점을 최소로 두는 이유다.
 */

const HOME_SCROLL = 1200;

test.describe("홈 스크롤 스냅", () => {
  test("홈에서 스크롤한 뒤 다른 페이지로 가면 맨 위에서 시작한다", async ({ page }) => {
    /*
     * **이건 스모크 테스트다.** 원래의 이펙트 순서 버그(스냅을 passive cleanup에서 꺼서,
     * `<ScrollRestoration />`의 `scrollTo(0, 0)`이 도는 시점에 아직 켜져 있던 문제)는 이
     * 테스트로 잡히지 않았다 — 고치기 전 코드에서도 그냥 통과했다. 그 버그를 실제로 잡는 것은
     * `src/pages/HomePage.test.tsx`의 순서 단언이다.
     *
     * 그래도 남겨 둔다. "홈에서 스크롤하고 나가면 맨 위에서 시작한다"는 사용자가 보는 계약
     * 자체고, 스냅이 통째로 새는 큰 회귀는 여기서 걸린다.
     */
    await page.goto("/");
    await page.waitForFunction(() => document.documentElement.classList.contains("home-scroll-snap"));

    await page.evaluate((y) => window.scrollTo(0, y), HOME_SCROLL);
    await expect.poll(() => page.evaluate(() => window.scrollY)).toBeGreaterThan(0);

    await page.getByRole("navigation").getByRole("link", { name: "프로젝트" }).click();
    await expect(page).toHaveURL(/\/projects$/);

    await expect.poll(() => page.evaluate(() => Math.round(window.scrollY)), { timeout: 5000 }).toBe(0);
    await expect
      .poll(() => page.evaluate(() => document.documentElement.classList.contains("home-scroll-snap")))
      .toBe(false);
  });

  /*
   * 아직 안 고친 버그를 그대로 적어 둔 것이라 `fixme`다. 지우지 말고, 고칠 때 `fixme`만 떼면 된다.
   *
   * 재현: 1280x720에서 홈을 스크롤한 뒤 새로고침하면 매번 문서 맨 아래(Footer)에 고정된다.
   * 대조 실험으로 원인이 스냅임을 확인했다 — 스냅 클래스가 붙지 못하게 막으면 복원 위치
   * (1154)로 정상 복귀하고, 붙게 두면 맨 아래(5580 = 최대 스크롤)에 박힌다.
   *
   * 왜 #297의 "한 프레임 미루기"로 안 막히나: 스냅이 켜지는 순간을 재 보면 `readyState`는 이미
   * `complete`인데 `scrollHeight`는 최종 6300 중 1874(약 30%)다. SPA라 문서 자체는 일찍 끝나고
   * React가 뒤늦게 채우기 때문에 `load` 이벤트로 미뤄도 소용없다(실제로 시도해 보고 되돌렸다).
   * 그렇게 짧은 문서에 mandatory 스냅이 걸리면 Footer에 붙고, 이후 문서가 길어져도 스냅이
   * Footer를 놓아주지 않는다.
   *
   * 1440x900에서는 복원 위치가 마침 그때의 짧은 문서 안에 들어와서 재현되지 않는다 — 한
   * 해상도만 보고 "괜찮다"고 넘기면 놓친다.
   *
   * 켜는 시점을 옮기는 것으로는 안정적으로 못 막고, `mandatory` 자체를 손대야 한다(예:
   * `proximity`로 낮추기, 또는 레이아웃 높이가 안정된 뒤에 켜기). 연출이 바뀌는 선택이라
   * 별도 판단이 필요하다.
   */
  test.fixme("홈에서 스크롤한 채 새로고침해도 푸터로 튀지 않는다(#297, 미해결)", async ({ page }) => {
    await page.goto("/");
    await page.waitForFunction(() => document.documentElement.classList.contains("home-scroll-snap"));
    await page.evaluate((y) => window.scrollTo(0, y), HOME_SCROLL);
    await expect.poll(() => page.evaluate(() => window.scrollY)).toBeGreaterThan(0);

    await page.reload();
    // 문서가 최종 높이에 도달할 때까지 기다린 뒤에 잰다. 로딩 중에는 `scrollHeight`가 최종값의
    // 30%밖에 안 돼서, 그 짧은 문서 기준으로는 멀쩡한 스크롤도 "맨 아래"로 보인다.
    await page.waitForLoadState("networkidle");
    await expect
      .poll(() => page.evaluate(() => Math.round(document.documentElement.scrollHeight - window.innerHeight)))
      .toBeGreaterThan(3000);

    const { scrollY, maxScroll } = await page.evaluate(() => ({
      scrollY: Math.round(window.scrollY),
      maxScroll: Math.round(document.documentElement.scrollHeight - window.innerHeight),
    }));
    expect(scrollY).toBeLessThan(maxScroll - 10);
  });
});
