import { ImageResponse } from 'next/og';

/**
 * PNG version of the Pentriq logo mark for use inside emails. Gmail and
 * Outlook strip inline SVG and don't render external SVG, so the header logo
 * has to be a raster image. Rendered at 120px (3x of the 36–40px display
 * size) for crisp retina output. Public (no auth) — see middleware.ts.
 */
export async function GET() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(180deg, #10b981 0%, #047857 100%)',
          border: '3px solid rgba(255,255,255,0.22)',
          borderRadius: 34,
        }}
      >
        <svg width="66" height="66" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path
            d="M21.44 2.56 2.75 9.77c-.7.27-.69 1.28.02 1.53l6.9 2.44c.32.11.57.36.68.68l2.44 6.9c.25.71 1.26.72 1.53.02l7.21-18.69c.24-.63-.4-1.27-1.03-1.03z"
            stroke="#ffffff"
            strokeWidth="1.7"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path d="M21.4 2.6 9.7 14.3" stroke="#ffffff" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>
    ),
    {
      width: 120,
      height: 120,
      headers: { 'Cache-Control': 'public, max-age=86400, s-maxage=31536000, immutable' },
    }
  );
}
