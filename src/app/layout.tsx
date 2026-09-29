import type { Metadata } from 'next';
import './globals.css';

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
      <body className="min-h-screen bg-[#f8f9fa] text-slate-900 antialiased">
        {children}
      </body>
    </html>
  );
}
