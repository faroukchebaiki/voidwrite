import MarkdownIt from "markdown-it";
import sanitizeHtml from "sanitize-html";

const md = new MarkdownIt({ html: false, linkify: true, typographer: true });

export function renderMarkdown(markdown: string) {
  const looksLikeHtml = /<\w+[^>]*>/.test(markdown || "");
  const raw = looksLikeHtml ? markdown : md.render(markdown);
  const clean = sanitizeHtml(raw, {
    allowedTags: sanitizeHtml.defaults.allowedTags.concat(["img","h1","h2","h3","h4","h5","h6","pre","code","iframe","div","span"]),
    allowedAttributes: {
      a: ["href", "name", "target", "rel"],
      img: ["src", "alt", "title"],
      code: ["class"],
      iframe: ["src","width","height","allow","allowfullscreen","frameborder"],
      '*': ["id", "class"],
    },
    allowedSchemesByTag: { img: ["http", "https", "data"], iframe: ["http", "https"] },
  });
  return clean;
}
