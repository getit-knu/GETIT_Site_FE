/** 프로젝트 아이콘·이미지(#382) 화면들이 같이 쓰는 값과 계산. */

/** BE `@Size(max = 5)`(BE#227). */
export const GALLERY_MAX = 5;

/** 갤러리 한 장. `fileId`가 `null`이면 아직 올리는 중이다. */
export interface GalleryItem {
  key: string;
  fileId: number | null;
  url: string | null;
}

/**
 * 저장된 갤러리를 필드 값으로. BE는 파일을 못 찾은 URL을 빼고 주므로 id와 URL 개수가 어긋날 수 있다 —
 * id를 기준으로 두고 URL이 없는 장은 빈 칸으로 그린다. id가 빠지면 저장할 때 그 이미지가 지워진다.
 */
export function toGalleryItems(fileIds: number[], urls: string[]): GalleryItem[] {
  return fileIds.map((fileId, index) => ({ key: `saved-${fileId}`, fileId, url: urls[index] ?? null }));
}

/** 요청에 실을 `galleryFileIds`. 올리는 중인 장은 뺀다(저장 버튼은 그동안 잠근다). */
export function galleryFileIds(items: GalleryItem[]): number[] {
  return items.flatMap((item) => (item.fileId === null ? [] : [item.fileId]));
}

export function isGalleryUploading(items: GalleryItem[]): boolean {
  return items.some((item) => item.fileId === null);
}

/** 목록 카드·상세 상단 커버. 아이콘은 정사각형이라 가로 칸에서 크게 잘리므로 첫 스크린샷을 먼저 쓴다. */
export function projectCoverUrl(project: { galleryImageUrls: string[]; thumbnailUrl: string | null }): string | null {
  return project.galleryImageUrls[0] ?? project.thumbnailUrl;
}
