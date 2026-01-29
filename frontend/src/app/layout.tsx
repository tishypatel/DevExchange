import type { Metadata } from 'next';
import { Inter, DM_Serif_Text } from 'next/font/google';
import './globals.css';
import { ThemeProvider } from '../components/ThemeProvider';

// 1. Configure Sans Font (Body text)
const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

// 2. Configure Serif Font (Headings)
const dmSerif = DM_Serif_Text({
  weight: ['400'], // DM Serif only supports 400 weight
  subsets: ['latin'],
  variable: '--font-dm-serif',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'DevExchange',
  description: 'Internal Engineering Knowledge Platform',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      {/* 3. Inject Variables & Set Defaults */}
      <body className={`${inter.variable} ${dmSerif.variable} font-sans bg-white dark:bg-gray-950 text-black dark:text-white transition-colors duration-300`}>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}