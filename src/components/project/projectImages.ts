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

/**
 * 목록 카드·상세 상단 썸네일. **항상 프로젝트 아이콘**이다(#403) — 어느 화면에서든 같은 아이콘으로 프로젝트를
 * 알아보게 한다. 정사각형이라 `ProjectCover`가 자르지 않고 가운데 두고 흐린 같은 그림으로 채운다.
 * BE는 아이콘이 없으면 `null`, 어드민 응답은 `""`를 줄 수 있다.
 */
export function projectCoverUrl(project: { thumbnailUrl: string | null }): string | null {
  return project.thumbnailUrl || null;
}

/** BE `@Size(max = 20000)`. 설명 마크다운 글자 수(한글 3바이트 기준 TEXT 컬럼 한도). */
export const DESCRIPTION_MAX_LENGTH = 20000;

/** BE `@Size(max = 10)`(BE#227). 설명 본문 속 이미지 수. */
export const DESCRIPTION_IMAGE_MAX = 10;

/** 에디터에서 이번에 올린 설명 속 이미지(#385). 본문에는 `url`이 `![](url)`로 들어간다. */
export interface DescriptionImage {
  fileId: number;
  url: string;
}

/**
 * 요청에 실을 `descriptionImageFileIds`(#385). 이번에 올린 것 중 본문에 아직 남은 것만 연결한다 — 올렸다가
 * 지운 이미지는 연결하지 않아 24시간 뒤 정리된다.
 *
 * **예전에 넣은 이미지는 본문에서 지웠어도 그대로 둔다.** 응답이 id만 주고 주소를 주지 않아, 본문에 남았는지
 * 알 수 없다. 빼 버리면 아직 본문에 있는 이미지까지 지워질 수 있어서 남기는 쪽을 택했다.
 */
export function descriptionImageFileIds(existing: number[], uploaded: DescriptionImage[], markdown: string): number[] {
  const kept = uploaded.filter((image) => markdown.includes(image.url)).map((image) => image.fileId);
  return [...new Set([...existing, ...kept])];
}
