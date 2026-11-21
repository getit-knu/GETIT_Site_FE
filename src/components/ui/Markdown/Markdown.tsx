import clsx from "clsx";
import ReactMarkdown, { type Components } from "react-markdown";
import remarkBreaks from "remark-breaks";
import remarkGfm from "remark-gfm";

import styles from "./Markdown.module.scss";

interface MarkdownProps {
  /** 마크다운 원문. 강의 설명·과제 설명은 BE가 이 형태로 준다(`LectureDetail.description` 참고). */
  content: string;
  /** 바깥 여백·색 등은 호출부 스타일을 그대로 쓴다 — 내부 요소(제목·목록·굵게 등) 타이포만 이 컴포넌트가 정한다. */
  className?: string;
  /**
   * 줄바꿈 하나도 줄바꿈으로 보여준다(#384). 마크다운은 원래 이어 붙이지만, 일반 글로 쓴 예전 프로젝트
   * 설명은 줄바꿈으로 문단을 나눠 두어서 그대로 붙이면 한 덩어리가 된다.
   */
  keepLineBreaks?: boolean;
  /** 주면 이 검사를 통과한 주소의 이미지만 그리고, 나머지는 대체 글자로 보여준다(외부 추적 이미지 차단). */
  allowImage?: (src: string) => boolean;
}

/**
 * 마크다운 원문을 렌더링한다.
 *
 * `react-markdown`은 파싱한 마크다운을 React 엘리먼트 트리로 직접 만들어서 렌더링한다 —
 * `dangerouslySetInnerHTML`을 쓰지 않고, 마크다운에 섞인 원시 HTML도 기본적으로 무시한다.
 * 강의 설명은 운영진이 쓰지만 사용자 입력이라는 점은 같으므로 이 안전한 기본값을 그대로 쓴다.
 */
export function Markdown({ content, className, keepLineBreaks = false, allowImage }: MarkdownProps) {
  const components: Components | undefined = allowImage && {
    img: ({ src, alt }) =>
      typeof src === "string" && allowImage(src) ? (
        <img src={src} alt={alt ?? ""} loading="lazy" />
      ) : (
        <span className={styles.blockedImage}>{alt || "이미지"}</span>
      ),
  };

  return (
    <div className={clsx(styles.markdown, className)}>
      <ReactMarkdown remarkPlugins={keepLineBreaks ? [remarkGfm, remarkBreaks] : [remarkGfm]} components={components}>
        {content}
      </ReactMarkdown>
    </div>
  );
}
