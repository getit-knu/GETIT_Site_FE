# GETIT 프론트엔드 — Copilot 지침

경북대 IT 동아리 **GETIT** 통합 운영 플랫폼의 프론트엔드입니다.
이 문서는 `GETIT_Site_FE` 레포지토리 전체에 적용됩니다.
모든 코멘트는 한국어로 작성해주세요.

응답·주석·커밋 메시지는 **한국어**로 작성합니다. 코드 식별자는 영어입니다.

---

## 기술 스택

| | |
|---|---|
| 언어 | TypeScript |
| 프레임워크 | React 19 + Vite |
| 라우팅 | React Router (`react-router` 에서 import) |
| 서버 상태 | TanStack Query |
| HTTP | axios |
| 스타일 | **CSS Modules (SCSS)** + `clsx` |
| 테스트 | Vitest + React Testing Library |
| 패키지 매니저 | **pnpm** |

Tailwind 를 쓰지 않습니다. styled-components 도 쓰지 않습니다.

---

## 디렉터리 구조

```
src/
├── components/
│   ├── ui/          공통 UI (Button · Input · TextArea · Badge · Card · Modal)
│   └── layout/      PublicLayout · Nav · Footer
├── pages/           라우트가 가리키는 화면
├── api/             axios 인스턴스 · 도메인별 API 함수
├── hooks/
├── types/
├── styles/
│   └── abstracts/   _variables.scss · _container.scss
└── routes.tsx
```

컴포넌트 하나당 폴더 하나입니다.

```
components/ui/Modal/
├── Modal.tsx
├── Modal.module.scss
└── Modal.test.tsx
```

명명 규칙: 컴포넌트 `PascalCase`, 훅 `useCamelCase`, 그 외 파일 `camelCase`.
export 는 **named export** 를 씁니다 (`export function Modal()`).
단, 라우트가 lazy 로 부르는 페이지 컴포넌트는 예외입니다.

---

## 공통 컴포넌트 — 네이티브 props 를 막지 마십시오

**이 레포에서 가장 자주 발생한 문제입니다.** 공통 컴포넌트가 필요한 속성을 안 받아서
첫 소비자가 쓰지 못하는 일이 반복됐습니다.

```tsx
// ❌ 이러면 maxLength · onBlur · name · ref 를 못 쓴다
interface TextAreaProps {
  label?: string;
  value: string;
  onChange: (value: string) => void;
}

// ✅ 네이티브 속성을 통째로 열어둔다
type TextAreaProps = Omit<ComponentPropsWithRef<"textarea">, "onChange"> & {
  label?: string;
  error?: string;
  onChange: (value: string) => void;
};

export function TextArea({ label, error, onChange, ...rest }: TextAreaProps) {
  return <textarea onChange={(e) => onChange(e.target.value)} {...rest} />;
}
```

`onChange` 가 값을 직접 주는 시그니처는 편하니 유지해도 됩니다.
**나머지를 막지만 않으면 됩니다.** React 19라 `forwardRef` 없이 `ref` 가 prop 으로 들어옵니다.

버튼은 `type` 을 열어두십시오. `type="button"` 을 하드코딩하면 폼 submit 을 못 합니다
(기본값을 `"button"` 으로 두는 것은 맞습니다).

---

## 접근성 — 선언한 role 의 계약을 지킵니다

**`role` 을 직접 지정하면 그 role 의 키보드 동작을 반드시 함께 구현합니다.**

```tsx
// ❌ 포커스는 가는데 Enter/Space 가 안 먹는다. 접근성이 없는 것보다 나쁘다
<div role="button" tabIndex={0} onClick={onClick}>

// ✅
<div role="button" tabIndex={0} onClick={onClick} onKeyDown={handleKeyDown}>
```

```tsx
function handleKeyDown(event: KeyboardEvent<HTMLDivElement>) {
  if (event.key === "Enter" || event.key === " ") {
    event.preventDefault();   // Space 의 페이지 스크롤을 막는다
    onClick();
  }
}
```

### 입력 컴포넌트

`useId` 로 label 을 연결하고, **에러도 필드에 연결합니다.**

```tsx
const id = useId();
const errorId = `${id}-error`;

<input id={id} aria-invalid={error ? true : undefined} aria-describedby={error ? errorId : undefined} />
{error && <p id={errorId} role="alert">{error}</p>}
```

`role="alert"` 만으로는 에러가 나타나는 순간 한 번 읽힐 뿐, 필드에 포커스했을 때는 안 읽힙니다.

### 모달

`role="dialog"` · `aria-modal="true"` · **`aria-labelledby` 로 제목 연결** ·
`tabIndex={-1}` 로 dialog 자체에 초기 포커스 · 포커스 트랩 · **닫힐 때 트리거로 포커스 복귀** ·
**열려 있는 동안 배경 스크롤 락** 을 전부 갖춥니다.

초기 포커스를 "첫 포커서블 요소" 로 주면 닫기 버튼에 포커스가 갑니다.
dialog 자체에 주고 `aria-labelledby` 와 짝지어야 스크린리더가 제목부터 읽습니다.

포커스 트랩 셀렉터에서 **`:not([disabled])` 를 모든 요소에** 적용하고,
숨겨진 요소(`offsetParent === null`)는 걸러냅니다. 빠뜨리면 트랩이 새어나갑니다.

### 시각적 어포던스와 실제 동작을 일치시킵니다

배경색·그림자·둥근 모서리로 **버튼처럼 보이게 만들었으면 눌려야 합니다.**
아직 이동할 화면이 없어 비활성이라면 상태를 드러내십시오.

```tsx
<span className={styles.cta} aria-disabled="true" title="준비 중입니다">지원하기</span>
```
```scss
.cta { cursor: default; opacity: 0.55; }
```

**`eslint-plugin-jsx-a11y` 규칙을 끄지 마십시오.**

---

## 스타일 — 색은 토큰에서만

```scss
// styles/abstracts/_variables.scss

// 팔레트 (Figma Palette 섹션)
$color-text-primary: #364153;
$color-text-secondary: #6a7282;
$color-background: #f8f8f8;
$color-accent: #283997;

// 팔레트 정렬 대상이 아닌 기능색. 값은 재량이지만 정의는 여기 모은다.
$color-border: #d1d5db;
$color-error: #dc2626;
$color-disabled-bg: #f3f4f6;
```

**`.module.scss` 안에 hex 리터럴을 쓰지 마십시오.** "팔레트 정렬 대상이 아니다" 와
"토큰이 아니다" 는 다릅니다. 예외값도 토큰 파일에 별도 섹션으로 정의합니다.

### 대비 기준

**다크 배경 위에서 `$color-text-secondary` 를 쓰지 마십시오.** 밝은 배경 전제로 만든
토큰이라 어두운 배경에서는 WCAG AA(4.5:1)에 미달합니다.
(`#6a7282` on `#101828` = 3.67:1 — 실측)

본문 텍스트는 **4.5:1 이상**을 확보합니다. 다크 배경에는 `#9ca3af` 이상을 쓰십시오.

### 그 외

- 조건부 클래스는 `clsx()` 로 결합합니다.
- `z-index` 는 `_variables.scss` 의 스케일을 씁니다 (`$z-nav` · `$z-modal` 등). 숫자를 즉석에서 정하지 마십시오.
- 반투명 sticky 헤더에는 `backdrop-filter: blur()` 를 같이 겁니다. 불투명도만 낮추면 뒤 텍스트가 겹칩니다.
- 전체 높이는 `min-height: 100vh;` 다음 줄에 `min-height: 100dvh;` 를 씁니다 (모바일 주소창).
- 폼 필드의 `.wrapper` · `.label` · `.errorMessage` 처럼 반복되는 블록은 SCSS placeholder 로 뺍니다.
- 라이트 테마만 지원합니다. `color-scheme: light` 는 `:root` 에 한 번만 선언합니다.

---

## 백엔드 연동

응답은 항상 envelope 으로 옵니다.

```ts
type ApiResponse<T> = {
  success: boolean;
  data: T | null;
  error: { code: string; message: string; fieldErrors?: { field: string; reason: string }[] } | null;
};
```

- **분기는 `error.code` 로 합니다.** `message` 는 fallback 이며 그대로 화면에 뿌리지 마십시오.
- 시간 필드는 오프셋 포함 문자열입니다 (`2026-09-10T23:59:59+09:00`).
  오프셋이 없는 값이 오면 백엔드 버그이니 그대로 넘기지 말고 알리십시오.
- 서버 상태는 **TanStack Query** 로 다룹니다. `useEffect` + `useState` 로 직접 fetch 하지 마십시오.
- API 함수는 `src/api/` 에 도메인별로 모으고, 컴포넌트에서 `axios` 를 직접 호출하지 않습니다.

### 명세서

`GETIT-API-명세서.md` 가 단일 기준입니다.
**응답에 있는 필드가 항상 `null` 이면 백엔드에 아직 소스가 없다는 뜻입니다.**
그 값으로 기능을 만들기 전에 확인하십시오
(예: `placeholder`, `collegeId`/`majorId`, `submittedCount`).

**와이어프레임에 있는데 API 명세서에 없는 항목을 발견하면 그냥 넘기지 마십시오.**
백엔드만 봐서는 절대 안 보이는 결함이고, 실제로 이 경로로 여러 건이 잡혔습니다.

---

## 라우팅

```tsx
{
  // 공개 화면은 반드시 이 children 안에 넣는다. 밖에 두면 Nav/Footer 없이 렌더된다.
  lazy: layout(() => import("./components/layout/PublicLayout"), "PublicLayout"),
  children: [{ path: "/", lazy: page(() => import("./pages/HomePage")) }],
},
{ path: "/oauth/callback", lazy: page(() => import("./pages/OAuthCallbackPage")) },
```

레이아웃이 필요 없는 화면(콜백 · 403)만 pathless layout route 밖에 둡니다.

---

## 테스트

```tsx
import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
```

- vitest globals 를 쓰지 않습니다. `it` · `expect` · `vi` 를 명시적으로 import 합니다.
- `src/tests/setup.ts` 의 `afterEach(cleanup)` 이 없으면 portal 렌더 컴포넌트의 DOM 이 누적됩니다.
- 쿼리는 **role 우선** 입니다 (`getByRole("button", { name: "확인" })`).
  `parentElement` 같은 DOM 구조 탐색은 쓰지 마십시오 — 래퍼 한 겹만 추가돼도 조용히 틀립니다.
  잡기 어려운 요소에는 `data-testid` 를 붙입니다.
- **"아직 구현하지 않았음" 을 테스트로 고정하면 좋습니다.**

  ```tsx
  expect(nav.queryAllByRole("link")).toHaveLength(2); // GETIT 로고 + 홈
  ```

  나중에 링크로 바꿀 때 이 테스트가 깨지면서 "여기도 고쳐라" 를 알려줍니다.
- 가장 복잡한 로직(포커스 트랩 · 포커스 복원 · 키보드 조작)을 빠뜨리지 마십시오.

---

## 컨벤션

| | |
|---|---|
| 브랜치 | `feat/이슈번호-작업내용` — **`#` 를 붙이지 않습니다** |
| 커밋 | `feat: ...` · `fix: ...` · `refactor: ...` · `style: ...` |
| PR 전 | `pnpm lint` · `pnpm type-check` · `pnpm format:check` · `pnpm build` · `pnpm test` |
| 브라우저 저장소 | 인증 토큰은 HttpOnly 쿠키입니다. `localStorage` 에 토큰을 두지 마십시오 |

여러 컴포넌트를 한 번에 만들 때는 **상태 없는 프레젠테이셔널** 과 **동작이 있는 것**
(Modal 등)을 나눠 PR 을 쪼갭니다.

---

## 코드 리뷰 체크리스트

Copilot이 이 레포의 PR을 리뷰할 때 아래를 우선 확인합니다.
**전부 실제로 발생한 문제입니다.**

- [ ] 공통 컴포넌트가 **네이티브 props · ref** 를 막고 있지 않은가
- [ ] `role` 을 선언했는데 **키보드 핸들러가 빠지지** 않았는가
- [ ] 버튼처럼 **보이는데 눌리지 않는** 요소가 없는가
- [ ] 입력 에러가 `aria-invalid` · `aria-describedby` 로 **필드에 연결**됐는가
- [ ] `.module.scss` 에 **hex 리터럴**이 들어가지 않았는가
- [ ] 다크 배경 위 텍스트의 **대비가 4.5:1** 이상인가
- [ ] `Button` 의 `type` 이 하드코딩되지 않았는가
- [ ] 모달에 **스크롤 락 · 포커스 복귀 · `aria-labelledby`** 가 있는가
- [ ] 테스트가 `parentElement` 같은 **DOM 구조에 결합**되지 않았는가
- [ ] 서버 상태를 `useEffect` + `useState` 로 직접 다루지 않았는가
- [ ] 에러 분기를 `error.message` 가 아니라 **`error.code`** 로 하는가
- [ ] 항상 `null` 인 응답 필드에 **기능을 얹지** 않았는가
- [ ] `mailto:` 처럼 **지금 동작 가능한 것**을 텍스트로 두지 않았는가
- [ ] 브랜치명에 **`#`** 이 없는가
- [ ] `eslint-plugin-jsx-a11y` 규칙을 끄거나 우회하지 않았는가
