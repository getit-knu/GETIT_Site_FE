# GETIT_Site_FE

> GETIT 프론트엔드 프로젝트

## 기술 스택

- **Frontend**: React, TypeScript, Vite, pnpm
- **Hosting**: Cloudflare Pages
- **CI/CD**: GitHub Actions
- **Backend**: Spring Boot (Azure VM) + Nginx reverse proxy (연동 예정)

## 시작하기

### 요구 사항

- Node.js LTS
- pnpm

### 설치 및 실행

```bash
pnpm install
pnpm dev
```

### 주요 스크립트

| 명령어            | 설명                        |
| ----------------- | --------------------------- |
| `pnpm dev`        | 개발 서버 실행              |
| `pnpm build`      | 타입 체크 + 프로덕션 빌드   |
| `pnpm type-check` | 타입 검사만 실행            |
| `pnpm lint`       | ESLint 검사 (경고 0개 기준) |
| `pnpm preview`    | 빌드 결과 미리보기          |

## 브랜치 전략

- `main`: 배포 브랜치 (직접 push 금지)
- `develop`: 기본/통합 브랜치 (직접 push 금지, PR을 통해서만 머지)
- 작업 브랜치: `{type}/{이슈번호}-{작업내용}` 형식으로 `develop`에서 분기

### 브랜치 타입

| 타입       | 설명                            |
| ---------- | ------------------------------- |
| `feat`     | 새로운 기능 추가                |
| `fix`      | 버그 수정                       |
| `refactor` | 코드 리팩토링 (기능 변경 없음)  |
| `chore`    | 빌드/설정 등 기능과 무관한 작업 |
| `docs`     | 문서 작성 및 수정               |

## 커밋 컨벤션

[Conventional Commits](https://www.conventionalcommits.org/)를 따릅니다.

- `feat:` 새로운 기능 추가
- `fix:` 버그 수정
- `style:` Tailwind/CSS 스타일링, 코드 포맷팅, 세미콜론 누락 등 (코드 변경 없음)
- `refactor:` 코드 리팩토링 (기능 변경 없음)
- `design`: UI 디자인 요소 변경(피드백 반영 등)
- `chore:` 기타 영향을 크게 미치지 않는 자잘한 수정
- `test`: 테스트 코드 추가 또는 수정
- `docs`: 문서 수정(README 등)

## PR / 이슈 규칙

- 1 Issue - 1 Branch 원칙
- PR 본문에 `close #이슈번호` 작성 시 머지되면 이슈가 자동으로 닫힘
- `develop`은 PR을 통해서만 머지 가능 (direct push 차단, 서버에서 강제)
- PR/Issue 생성 시 `.github` 템플릿이 자동으로 채워짐

## Git Hooks

Husky + lint-staged로 커밋/푸시 전 자동 검사합니다.

- `pre-commit`: 변경된 파일에 ESLint `--fix` + Prettier 실행
- `pre-push`: `pnpm type-check` 실행 (타입 에러가 있으면 push 차단)

`pnpm install` 시 `prepare` 스크립트로 자동 설치됩니다.

## 디렉토리 구조

>

## 환경 변수

>

## 배포

- `main` 브랜치에 머지되면 GitHub Actions를 통해 Cloudflare Pages로 자동 배포 (예정)
- PR 생성 시 GitHub Actions에서 Lint / TypeCheck / Build 자동 검증 (예정)
