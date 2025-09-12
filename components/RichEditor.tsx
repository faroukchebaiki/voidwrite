"use client";
import { useEffect, useRef, useState } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import { BubbleMenu, FloatingMenu } from "@tiptap/react/menus";
import StarterKit from "@tiptap/starter-kit";
import Link from "@tiptap/extension-link";
import Image from "@tiptap/extension-image";
import Underline from "@tiptap/extension-underline";
import Youtube from "@tiptap/extension-youtube";
import Placeholder from "@tiptap/extension-placeholder";
import { Bold, Italic, Underline as UnderlineIcon, Code, Heading1, Heading2, Heading3, Undo2, Redo2, Link as LinkIcon, Image as ImageIcon, Youtube as YoutubeIcon, TerminalSquare } from "lucide-react";
import '@/styles/editor.css';

export default function RichEditor({ initialHTML = "", onChange }: { initialHTML?: string; onChange?: (html: string) => void; }) {
  const [mounted, setMounted] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  useEffect(() => setMounted(true), []);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({ codeBlock: { HTMLAttributes: { class: "language-plaintext" } } }),
      Underline,
      Link.configure({ openOnClick: true, autolink: true, linkOnPaste: true }),
      Image.configure({ inline: false }),
      Youtube.configure({ controls: true, nocookie: true, modestBranding: true }),
      Placeholder.configure({ placeholder: 'Start writing…' }),
    ],
    content: initialHTML || "",
    immediatelyRender: false,
    onUpdate: ({ editor }) => onChange?.(editor.getHTML()),
    editorProps: {
      attributes: {
        class: "prose dark:prose-invert max-w-none focus:outline-none min-h-[16rem] p-2 sm:p-3 border rounded-md sm:rounded-lg"
      }
    },
  }, [mounted]);

  const insertHeading = (level: 1 | 2 | 3) => editor?.chain().focus().toggleHeading({ level }).run();
  const toggleBold = () => editor?.chain().focus().toggleBold().run();
  const toggleItalic = () => editor?.chain().focus().toggleItalic().run();
  const toggleUnderline = () => editor?.chain().focus().toggleUnderline().run();
  const toggleCode = () => editor?.chain().focus().toggleCode().run();
  const toggleCodeBlock = () => editor?.chain().focus().toggleCodeBlock().run();
  const setLinkCmd = () => { const url = prompt("Enter URL") || ""; if (url) editor?.chain().focus().setLink({ href: url }).run(); };
  const insertCommandSnippet = () => { const cmd = prompt("Command (e.g. npm run dev)") || ""; if (cmd) editor?.chain().focus().insertContent(`<pre><code class=\\"language-bash\\">$ ${cmd}</code></pre>`).run(); };
  const insertYouTube = () => { const url = prompt("YouTube URL (https://www.youtube.com/watch?v=...)") || ""; if (url) editor?.chain().focus().setYoutubeVideo({ src: url }).run(); };
  const onPickImage = () => fileRef.current?.click();
  const onFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setUploading(true);
    try {
      const body = new FormData();
      body.append('file', f);
      const res = await fetch('/api/upload', { method: 'POST', body });
      if (!res.ok) throw new Error('Upload failed');
      const { url } = await res.json();
      editor?.chain().focus().setImage({ src: url, alt: f.name }).run();
    } catch (e: any) {
      alert(e.message || 'Upload error');
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  if (!mounted) return null;

  return (
    <div className="editor-shell">
      <div className="editor-toolbar">
        <div className="group">
          <button className="tool" onClick={() => editor?.chain().focus().undo().run()} title="Undo"><Undo2 size={16} /></button>
          <button className="tool" onClick={() => editor?.chain().focus().redo().run()} title="Redo"><Redo2 size={16} /></button>
        </div>
        <div className="group">
          <button className="tool" onClick={() => insertHeading(1)} title="Heading 1"><Heading1 size={16} /></button>
          <button className="tool" onClick={() => insertHeading(2)} title="Heading 2"><Heading2 size={16} /></button>
          <button className="tool" onClick={() => insertHeading(3)} title="Heading 3"><Heading3 size={16} /></button>
        </div>
        <div className="group">
          <button className="tool" data-active={editor?.isActive('bold')} onClick={toggleBold} title="Bold"><Bold size={14} /></button>
          <button className="tool" data-active={editor?.isActive('italic')} onClick={toggleItalic} title="Italic"><Italic size={14} /></button>
          <button className="tool" data-active={editor?.isActive('underline')} onClick={toggleUnderline} title="Underline"><UnderlineIcon size={14} /></button>
          <button className="tool" data-active={editor?.isActive('code')} onClick={toggleCode} title="Inline code"><Code size={14} /></button>
          <button className="tool" data-active={editor?.isActive('codeBlock')} onClick={toggleCodeBlock} title="Code block"><TerminalSquare size={14} /></button>
        </div>
        <div className="group">
          <button className="tool" onClick={setLinkCmd} title="Link"><LinkIcon size={14} /></button>
          <button className="tool" onClick={onPickImage} disabled={uploading} title="Image"><ImageIcon size={14} /></button>
          <button className="tool" onClick={insertYouTube} title="YouTube"><YoutubeIcon size={14} /></button>
          <button className="tool" onClick={insertCommandSnippet} title="Command">$</button>
        </div>
        <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={onFile} />
      </div>
      <div className="editor-card">
        {editor ? (
          <>
            <EditorContent editor={editor} />
            <BubbleMenu editor={editor}>
              <div className="group">
                <button className="tool" data-active={editor.isActive('bold')} onClick={toggleBold}><Bold size={14} /></button>
                <button className="tool" data-active={editor.isActive('italic')} onClick={toggleItalic}><Italic size={14} /></button>
                <button className="tool" data-active={editor.isActive('underline')} onClick={toggleUnderline}><UnderlineIcon size={14} /></button>
                <button className="tool" onClick={setLinkCmd}><LinkIcon size={14} /></button>
              </div>
            </BubbleMenu>
            <FloatingMenu editor={editor} shouldShow={({ editor }) => {
              const { $from } = editor.state.selection;
              const text = $from.parent.textContent || '';
              return text.trim().startsWith('/') || (!text.trim() && $from.parent.content.size === 0);
            }}>
              <div className="group">
                <button className="tool" title="Heading 1" onClick={() => insertHeading(1)}><Heading1 size={14} /></button>
                <button className="tool" title="Heading 2" onClick={() => insertHeading(2)}><Heading2 size={14} /></button>
                <button className="tool" title="Heading 3" onClick={() => insertHeading(3)}><Heading3 size={14} /></button>
                <button className="tool" title="Code block" onClick={toggleCodeBlock}><TerminalSquare size={14} /></button>
                <button className="tool" title="Image" onClick={onPickImage}><ImageIcon size={14} /></button>
                <button className="tool" title="YouTube" onClick={insertYouTube}><YoutubeIcon size={14} /></button>
              </div>
            </FloatingMenu>
          </>
        ) : null}
      </div>
    </div>
  );
}
