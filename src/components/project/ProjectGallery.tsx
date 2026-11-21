import { lazy, Suspense, useState } from "react";

import styles from "./ProjectGallery.module.scss";

// 전체화면 뷰어는 사진을 처음 누를 때만 받는다(#404). 쇼케이스 첫 화면 번들은 그대로다.
const PhotoLightbox = lazy(() => import("./PhotoLightbox"));

interface ProjectGalleryProps {
  /** 어드민·부원이 정한 순서 그대로(BE#227 `galleryImageUrls`). */
  urls: string[];
  title: string;
}

/**
 * 프로젝트 이미지(스크린샷) 가로 스크롤(#382). FESTA 상세와 `/projects` 상세가 같이 쓴다.
 * 이미지가 없으면 아무것도 그리지 않는다 — 감싸는 섹션 제목도 호출부가 같이 숨긴다.
 *
 * 사진을 누르면 그 사진부터 전체화면으로 넘겨 보고 확대한다(#404).
 */
export function ProjectGallery({ urls, title }: ProjectGalleryProps) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  if (urls.length === 0) return null;

  return (
    <>
      <ul className={styles.strip}>
        {urls.map((url, index) => (
          <li key={url} className={styles.item}>
            <button
              type="button"
              className={styles.shotButton}
              aria-label={`${title} 화면 ${index + 1} 크게 보기`}
              onClick={() => setOpenIndex(index)}
            >
              <img src={url} alt="" loading="lazy" className={styles.shot} />
            </button>
          </li>
        ))}
      </ul>

      {openIndex !== null && (
        <Suspense fallback={null}>
          <PhotoLightbox urls={urls} title={title} index={openIndex} onClose={() => setOpenIndex(null)} />
        </Suspense>
      )}
    </>
  );
}
