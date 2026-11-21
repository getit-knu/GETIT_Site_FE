import Lightbox from "yet-another-react-lightbox";
import Counter from "yet-another-react-lightbox/plugins/counter";
import Zoom from "yet-another-react-lightbox/plugins/zoom";
import "yet-another-react-lightbox/styles.css";
import "yet-another-react-lightbox/plugins/counter.css";

export interface PhotoLightboxProps {
  urls: string[];
  title: string;
  /** 처음 보여줄 사진. */
  index: number;
  onClose: () => void;
}

const LABELS = {
  Previous: "이전 사진",
  Next: "다음 사진",
  Close: "닫기",
  "Zoom in": "확대",
  "Zoom out": "축소",
  Lightbox: "사진 크게 보기",
  Carousel: "사진 넘기기",
  Slide: "사진",
  "Photo gallery": "프로젝트 사진",
  "{index} of {total}": "{index} / {total}",
};

/**
 * 프로젝트 사진 전체화면 뷰어(#404). 넘기기(버튼·←→·스와이프), 확대·축소(버튼·핀치·더블탭·휠), 닫기(✕·Esc·바깥).
 * `yet-another-react-lightbox`라 무거워서 `ProjectGallery`가 사진을 처음 누를 때만 받는다.
 *
 * 뷰어는 키 이벤트를 바깥으로 올려보내지 않아, 상세 모달 위에서 Esc를 눌러도 사진만 닫힌다(테스트로 고정).
 */
export default function PhotoLightbox({ urls, title, index, onClose }: PhotoLightboxProps) {
  const single = urls.length <= 1;

  return (
    <Lightbox
      open
      index={index}
      close={onClose}
      slides={urls.map((src, i) => ({ src, alt: `${title} 화면 ${i + 1}` }))}
      plugins={[Zoom, Counter]}
      zoom={{ maxZoomPixelRatio: 3, scrollToZoom: true }}
      carousel={{ finite: true }}
      controller={{ closeOnBackdropClick: true }}
      render={single ? { buttonPrev: () => null, buttonNext: () => null } : undefined}
      labels={LABELS}
    />
  );
}
