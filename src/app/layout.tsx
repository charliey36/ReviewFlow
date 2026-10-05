import type { Metadata } from 'next';
import './globals.css';
import { ThemeProvider, THEME_BOOTSTRAP_SCRIPT } from '@/components/theme-context';

export const metadata: Metadata = {
  title: 'ReviewFlow',
  description: 'Automated customer review request emails.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        {/* Runs before paint to apply the right theme class immediately,
            avoiding a flash of light mode before React hydrates. */}
        <script dangerouslySetInnerHTML={{ __html: THEME_BOOTSTRAP_SCRIPT }} />
      </head>
      <body className="min-h-screen bg-[#f8f9fa] text-slate-900 antialiased transition-colors duration-200 dark:bg-slate-900 dark:text-slate-50">
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}
