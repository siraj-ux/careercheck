import type { Metadata, Viewport } from 'next';
import { Poppins, Geist_Mono } from 'next/font/google';
import './globals.css';

const poppins = Poppins({
  variable: '--font-poppins',
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700', '800'],
  display: 'swap',
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
};

export const metadata: Metadata = {
  title: 'CareerChecks — Find the Course & College That Fit You',
  description:
    'Take India’s most thoughtful 35-minute psychometric and aptitude test. Get your personalised RIASEC interest code, aptitude scores, and meet a verified human consultant.',
  keywords: [
    'career guidance',
    'psychometric test India',
    'aptitude test for students',
    'class 12 career options',
    'CUET guidance',
    'college admission counseling',
  ],
  authors: [{ name: 'CareerChecks' }],
  openGraph: {
    title: 'CareerChecks — Find the Course & College That Fit You',
    description:
      'Evaluate your career fit with our 35-minute psychometric assessment and meet a verified human consultant for a personalised roadmap.',
    url: 'https://www.careerchecks.com',
    siteName: 'CareerChecks',
    locale: 'en_IN',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'CareerChecks — Find the Course & College That Fit You',
    description:
      '35-minute psychometric & aptitude assessment followed by 1-on-1 verified human consultant counseling.',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${poppins.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-[#F2F2F2] text-zinc-950 font-sans selection:bg-[#EBF3FB] selection:text-[#004C99]">
        {children}
      </body>
    </html>
  );
}
