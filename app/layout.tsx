import type { Metadata } from 'next';
import './globals.css';
import { ThreeColumnLayout } from '@/components/layout/three-column-layout';
import { SpeedInsights } from '@vercel/speed-insights/next';

export const metadata: Metadata = {
  title: 'SMVITM Technical Forum',
  description: 'A Stack Overflow-style Q&A platform for SMVITM students',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="antialiased">
        <ThreeColumnLayout>{children}</ThreeColumnLayout>
        <SpeedInsights />
      </body>
    </html>
  );
}
