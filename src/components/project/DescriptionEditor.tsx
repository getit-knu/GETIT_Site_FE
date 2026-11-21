import Image from "@tiptap/extension-image";
import { Placeholder } from "@tiptap/extensions";
import { Markdown } from "@tiptap/markdown";
import { EditorContent, useEditor, useEditorState, type Editor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import clsx from "clsx";
import { useRef, useState } from "react";

import { getDownloadUrl, uploadFile, uploadInvalidReason } from "../../apis/file/filesApi";
import { fileErrorMessage } from "../../errors/file/errorMessages";
import markdownStyles from "../ui/Markdown/Markdown.module.scss";

import styles from "./DescriptionEditor.module.scss";
import type { DescriptionImage } from "./projectImages";

export interface DescriptionEditorProps {
  /** 처음 값(마크다운). 바뀐 값은 `onChange`로만 알린다 — 에디터가 자기 상태를 들고 있다. */
  initialValue: string;
  onChange: (markdown: string) => void;
  onImageUploaded: (image: DescriptionImage) => void;
  /** 10장(BE 한도)이 차면 이미지 넣기를 잠근다. */
  canAddImage: boolean;
}

interface ToolbarButton {
  label: string;
  text: string;
  isActive: (editor: Editor) => boolean;
  run: (editor: Editor) => void;
}

const BUTTONS: ToolbarButton[] = [
  {
    label: "제목",
    text: "H2",
    isActive: (e) => e.isActive("heading", { level: 2 }),
    run: (e) => e.chain().focus().toggleHeading({ level: 2 }).run(),
  },
  {
    label: "소제목",
    text: "H3",
    isActive: (e) => e.isActive("heading", { level: 3 }),
    run: (e) => e.chain().focus().toggleHeading({ level: 3 }).run(),
  },
  { label: "굵게", text: "B", isActive: (e) => e.isActive("bold"), run: (e) => e.chain().focus().toggleBold().run() },
  {
    label: "기울임",
    text: "I",
    isActive: (e) => e.isActive("italic"),
    run: (e) => e.chain().focus().toggleItalic().run(),
  },
  {
    label: "글머리 목록",
    text: "•",
    isActive: (e) => e.isActive("bulletList"),
    run: (e) => e.chain().focus().toggleBulletList().run(),
  },
  {
    label: "번호 목록",
    text: "1.",
    isActive: (e) => e.isActive("orderedList"),
    run: (e) => e.chain().focus().toggleOrderedList().run(),
  },
  {
    label: "인용",
    text: "❝",
    isActive: (e) => e.isActive("blockquote"),
    run: (e) => e.chain().focus().toggleBlockquote().run(),
  },
];

/** 에디터 안에서 이미지 대체 글자로 쓴다. 확장자는 뺀다. */
function altOf(fileName: string): string {
  return fileName.replace(/\.[^.]+$/, "");
}

/**
 * 프로젝트 설명 블로그 에디터(#385). 화면은 서식이 적용된 글로 쓰고, 저장은 마크다운으로 한다
 * (`@tiptap/markdown`) — BE는 지금처럼 `description` 문자열 하나를 받고, 상세는 `Markdown`으로 그린다.
 *
 * 무거워서(ProseMirror) 작성 폼에서만 지연 로딩한다 — `DescriptionField` 참고.
 */
export default function DescriptionEditor({
  initialValue,
  onChange,
  onImageUploaded,
  canAddImage,
}: DescriptionEditorProps) {
  const fileInput = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const editor = useEditor({
    extensions: [
      // 밑줄은 마크다운으로 저장할 방법이 없어 뺀다. 제목은 상세 화면 위계에 맞춰 두 단계만 둔다.
      StarterKit.configure({ heading: { levels: [2, 3] }, underline: false, link: { openOnClick: false } }),
      Image,
      Placeholder.configure({ placeholder: "어떤 서비스인지, 무엇을 할 수 있는지 자유롭게 소개해 주세요." }),
      Markdown,
    ],
    content: initialValue,
    contentType: "markdown",
    editorProps: {
      attributes: {
        class: clsx(markdownStyles.markdown, styles.content),
        role: "textbox",
        "aria-multiline": "true",
        "aria-label": "설명",
      },
    },
    // 제목·이미지 뒤에는 커서를 둘 빈 문단이 저절로 붙는다(StarterKit TrailingNode). 저장에는 필요 없다.
    onUpdate: ({ editor: current }) => onChange(current.getMarkdown().trimEnd()),
  });

  // 툴바 눌림 표시. 에디터는 입력마다 컴포넌트를 다시 그리지 않으므로 필요한 값만 따로 구독한다.
  const active = useEditorState({
    editor,
    selector: ({ editor: current }) => BUTTONS.map((button) => button.isActive(current)),
  });

  function handleLink() {
    const previous = editor.getAttributes("link").href as string | undefined;
    const url = window.prompt("링크 주소(https://…)를 입력하세요. 비우면 링크를 지웁니다.", previous ?? "https://");
    if (url === null) return;
    if (url.trim() === "") {
      editor.chain().focus().extendMarkRange("link").unsetLink().run();
      return;
    }
    if (!/^https?:\/\/\S+$/i.test(url.trim())) {
      setError("링크는 http:// 또는 https:// 로 시작해야 합니다.");
      return;
    }
    setError(null);
    editor.chain().focus().extendMarkRange("link").setLink({ href: url.trim() }).run();
  }

  async function handleImage(file: File) {
    const reason = uploadInvalidReason(file, "PROJECT_IMAGE");
    if (reason !== null) {
      setError(reason);
      return;
    }
    setError(null);
    setUploading(true);
    try {
      const { fileId } = await uploadFile(file, "PROJECT_IMAGE");
      // 업로드 응답엔 주소가 없다. 공개 파일이라 올린 본인에게는 고정 주소가 온다(BE `FileService.downloadUrl`).
      const { downloadUrl } = await getDownloadUrl(fileId);
      editor
        .chain()
        .focus()
        .setImage({ src: downloadUrl, alt: altOf(file.name) })
        .run();
      onImageUploaded({ fileId, url: downloadUrl });
    } catch (caught) {
      setError(fileErrorMessage(caught));
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className={styles.editor}>
      <div className={styles.toolbar} role="toolbar" aria-label="설명 서식">
        {BUTTONS.map((button, index) => (
          <button
            key={button.label}
            type="button"
            aria-label={button.label}
            aria-pressed={active[index]}
            className={styles.tool}
            onClick={() => button.run(editor)}
          >
            {button.text}
          </button>
        ))}
        <button type="button" aria-label="링크" className={styles.tool} onClick={handleLink}>
          🔗
        </button>
        <button
          type="button"
          className={styles.tool}
          disabled={uploading || !canAddImage}
          onClick={() => fileInput.current?.click()}
        >
          {uploading ? "올리는 중…" : "이미지 넣기"}
        </button>
        <input
          ref={fileInput}
          type="file"
          accept="image/png,image/jpeg,image/webp"
          aria-label="설명에 넣을 이미지"
          className={styles.fileInput}
          onChange={(e) => {
            const file = e.target.files?.[0];
            e.target.value = "";
            if (file) void handleImage(file);
          }}
        />
      </div>

      <EditorContent editor={editor} />

      {!canAddImage && <p className={styles.hint}>설명 속 이미지는 10장까지 넣을 수 있습니다.</p>}
      {error !== null && (
        <p role="alert" className={styles.reason}>
          {error}
        </p>
      )}
    </div>
  );
}
