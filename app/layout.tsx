import './globals.css';
import './datepicker.css';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'K4nb4n',
  description: 'Local-first Kanban',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
