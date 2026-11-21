import styles from "./ProjectGallery.module.scss";

interface ProjectGalleryProps {
  /** 어드민·부원이 정한 순서 그대로(BE#227 `galleryImageUrls`). */
  urls: string[];
  title: string;
}

/**
 * 프로젝트 이미지(스크린샷) 가로 스크롤(#382). FESTA 상세와 `/projects` 상세가 같이 쓴다.
 * 이미지가 없으면 아무것도 그리지 않는다 — 감싸는 섹션 제목도 호출부가 같이 숨긴다.
 */
export function ProjectGallery({ urls, title }: ProjectGalleryProps) {
  if (urls.length === 0) return null;

  return (
    <ul className={styles.strip}>
      {urls.map((url, index) => (
        <li key={url} className={styles.item}>
          <img src={url} alt={`${title} 화면 ${index + 1}`} loading="lazy" className={styles.shot} />
        </li>
      ))}
    </ul>
  );
}
