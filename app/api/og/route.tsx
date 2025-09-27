import { ImageResponse } from 'next/og';
import { siteConfig } from '@/site';

export const runtime = 'edge';
export const revalidate = 60;

const fontPromise = fetch(new URL('./assets/KdamThmorPro-Regular.ttf', import.meta.url)).then((res) => res.arrayBuffer());

const size = { width: 1200, height: 630 } as const;

const colors = {
  background: '#050608',
  accent: '#f0f2ff',
  faded: 'rgba(240, 242, 255, 0.42)',
  grid: 'rgba(255,255,255,0.09)',
};

const clampText = (value: string | null | undefined, max = 140) => {
  if (!value) return undefined;
  const singleLine = value.replace(/\s+/g, ' ').trim();
  if (!singleLine) return undefined;
  return singleLine.length > max ? `${singleLine.slice(0, max - 1)}…` : singleLine;
};

export async function GET(request: Request) {
  const fontData = await fontPromise;
  const { searchParams } = new URL(request.url);

  const titleParam = clampText(searchParams.get('title'), 80);
  const subtitleParam = clampText(searchParams.get('subtitle'), 160);
  const footerParam = clampText(searchParams.get('footer'), 60);

  const title = titleParam ?? siteConfig.title;
  const subtitle = subtitleParam ?? siteConfig.tagline;
  const footer = footerParam ?? siteConfig.url.replace(/https?:\/\//, '');

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          position: 'relative',
          background: colors.background,
          color: '#ffffff',
          fontFamily: 'Kdam Thmor Pro, sans-serif',
        }}
      >
        {/* grid overlay */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            backgroundImage: `radial-gradient(circle at 20% 20%, ${colors.grid} 0, transparent 45%), radial-gradient(circle at 80% 10%, ${colors.grid} 0, transparent 35%)`,
          }}
        />
        <div
          style={{
            position: 'absolute',
            inset: 0,
            backgroundImage: 'linear-gradient(135deg, rgba(18, 41, 205, 0.25) 0%, rgba(17, 24, 39, 0.65) 55%, rgba(5, 6, 8, 0.9) 100%)',
          }}
        />

        <div
          style={{
            position: 'relative',
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            padding: '84px',
          }}
        >
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center', color: colors.faded, fontSize: 28 }}>
            <div
              style={{
                width: 14,
                height: 14,
                borderRadius: '50%',
                background: colors.accent,
                boxShadow: `0 0 18px ${colors.accent}`,
              }}
            />
            <span style={{ letterSpacing: '0.3em', textTransform: 'uppercase', fontSize: 18 }}>Voidwrite Studio</span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
            <div
              style={{
                fontSize: 92,
                lineHeight: 1.05,
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                textShadow: '0 12px 42px rgba(0, 0, 0, 0.35)',
              }}
            >
              {title}
            </div>
            {subtitle && (
              <div
                style={{
                  fontSize: 30,
                  lineHeight: 1.4,
                  letterSpacing: '0.04em',
                  color: colors.faded,
                  maxWidth: '75%',
                }}
              >
                {subtitle}
              </div>
            )}
          </div>

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              fontSize: 24,
              letterSpacing: '0.18em',
              textTransform: 'uppercase',
              color: colors.faded,
            }}
          >
            <span>{footer}</span>
            <span style={{ fontSize: 20 }}>© {new Date().getFullYear()} Voidwrite</span>
          </div>
        </div>
      </div>
    ),
    {
      ...size,
      fonts: [
        {
          name: 'Kdam Thmor Pro',
          data: fontData,
          style: 'normal',
          weight: 400,
        },
      ],
    }
  );
}
