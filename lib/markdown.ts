import MarkdownIt from "markdown-it";
import sanitizeHtml from "sanitize-html";

const md = new MarkdownIt({ html: false, linkify: true, typographer: true });

export function renderMarkdown(markdown: string) {
  const raw = md.render(markdown);
  const clean = sanitizeHtml(raw, {
    allowedTags: sanitizeHtml.defaults.allowedTags.concat(["img", "h1", "h2", "h3", "h4", "h5", "h6", "pre", "code"]),
    allowedAttributes: {
      a: ["href", "name", "target", "rel"],
      img: ["src", "alt", "title"],
      code: ["class"],
      '*': ["id"],
    },
    allowedSchemesByTag: { img: ["http", "https", "data"] },
  });
  return clean;
}

