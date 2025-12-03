import type { Metadata } from 'next';
import './globals.css';
import { ThreeColumnLayout } from '@/components/layout/three-column-layout';

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
      </body>
    </html>
  );
}
