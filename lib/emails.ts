import { siteConfig } from "@/site";

type EmailTemplateOptions = {
  heading: string;
  intro?: string;
  content: string;
  footerNote?: string;
};

type PlainTextOptions = {
  heading: string;
  bodyLines: string[];
  footerNote?: string;
};

const ACCENT_COLOR = "#6366f1";
const TEXT_COLOR = "#111827";

export function renderBrandedEmail({ heading, intro, content, footerNote }: EmailTemplateOptions) {
  const brand = siteConfig.title;
  const tagline = siteConfig.tagline;
  const footer = footerNote
    ? `<p style="margin:12px 0 0;">${footerNote}</p>`
    : "";

  return `<!doctype html>
<html lang="en">
  <head>
    <meta charSet="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${heading} · ${brand}</title>
  </head>
  <body style="margin:0; padding:32px 16px; background-color:#f3f4f6; font-family:'Inter',-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif; color:${TEXT_COLOR};">
    <table role="presentation" style="margin:0 auto; width:100%; max-width:640px; background:#ffffff; border-radius:16px; overflow:hidden; box-shadow:0 18px 45px rgba(15,23,42,0.12);">
      <tr>
        <td style="padding:32px 40px 16px;">
          <div style="font-size:12px; letter-spacing:0.35em; text-transform:uppercase; color:${ACCENT_COLOR}; font-weight:600;">${brand}</div>
          <h1 style="font-size:26px; margin:18px 0 12px; color:${TEXT_COLOR};">${heading}</h1>
          ${intro ? `<p style="margin:0 0 18px; font-size:15px; line-height:1.7; color:#4b5563;">${intro}</p>` : ""}
          <div style="font-size:15px; line-height:1.75; color:#1f2937;">${content}</div>
        </td>
      </tr>
      <tr>
        <td style="padding:24px 40px 32px; background:#f9fafb; border-top:1px solid #e5e7eb; font-size:13px; line-height:1.6; color:#6b7280;">
          <p style="margin:0; font-weight:600; color:${TEXT_COLOR};">${brand}</p>
          <p style="margin:4px 0 12px;">${tagline}</p>
          <p style="margin:0;">If you weren’t expecting this message, you can safely ignore it.</p>
          ${footer}
        </td>
      </tr>
    </table>
  </body>
</html>`;
}

export function renderPlainTextEmail({ heading, bodyLines, footerNote }: PlainTextOptions) {
  const brand = siteConfig.title;
  const tagline = siteConfig.tagline;
  const footer = footerNote ? `\n${footerNote}` : "";
  return [
    `${brand} — ${heading}`,
    "",
    ...bodyLines,
    "",
    `${brand} · ${tagline}`,
    "If you weren’t expecting this email, you can ignore it.",
    footer,
  ]
    .filter(Boolean)
    .join("\n");
}

export function renderCodeCallout(code: string, description?: string) {
  const label = description ? `<p style="margin:0 0 16px;">${description}</p>` : "";
  return `${label}<div style="display:inline-block; margin:12px 0 20px; padding:14px 22px; border-radius:12px; background:#eef2ff; color:${TEXT_COLOR}; font-size:28px; letter-spacing:8px; font-weight:700;">${code}</div>`;
}
