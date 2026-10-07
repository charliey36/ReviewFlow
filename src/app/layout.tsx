import type { Metadata, Viewport } from 'next';
import localFont from 'next/font/local';
import './globals.css';
import { ThemeProvider, THEME_BOOTSTRAP_SCRIPT } from '@/components/theme-context';
import { SpotlightProvider } from '@/components/spotlight';

/* Inter (variable, latin subset, SIL OFL) is self-hosted so there is no
   build-time or runtime request to Google Fonts. */
const inter = localFont({
  src: './fonts/InterVariable.woff2',
  variable: '--font-inter',
  display: 'swap',
  weight: '100 900',
});

const description =
  'Automate review requests, rebooking reminders and customer retention for service businesses. Compliant by design, with a private feedback channel on every request.';

export const metadata: Metadata = {
  title: {
    default: 'ReviewFlow — Reviews, rebookings and referrals on autopilot',
    template: '%s · ReviewFlow',
  },
  description,
  applicationName: 'ReviewFlow',
  openGraph: {
    title: 'ReviewFlow — Reviews, rebookings and referrals on autopilot',
    description,
    siteName: 'ReviewFlow',
    type: 'website',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#060910',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    // suppressHydrationWarning: the inline script below adds the `dark`
    // class to <html> before React hydrates, which is intentional.
    <html lang="en" className={inter.variable} suppressHydrationWarning>
      <head>
        {/* Runs before paint to apply the right theme class immediately,
            avoiding a flash of light mode before React hydrates. */}
        <script dangerouslySetInnerHTML={{ __html: THEME_BOOTSTRAP_SCRIPT }} />
      </head>
      <body>
        <ThemeProvider>
          <SpotlightProvider />
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
