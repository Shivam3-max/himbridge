import type { Metadata, Viewport } from 'next';
import { Noto_Sans, Noto_Serif } from 'next/font/google';
import type { ReactNode } from 'react';
import { Toaster } from '@/components/ui/toast';
import { BRAND } from '@/config/brand';
import { I18nProvider } from '@/i18n/client';
import { getI18n } from '@/i18n/server';
import './globals.css';

const sans = Noto_Sans({ subsets: ['latin'], weight: ['400', '500', '600', '700', '800'], variable: '--font-sans', display: 'swap' });
const serif = Noto_Serif({ subsets: ['latin'], weight: ['600', '700'], variable: '--font-serif', display: 'swap' });

export const metadata: Metadata = {
  metadataBase: new URL(process.env.APP_URL ?? 'http://localhost:3000'),
  title: { default: `${BRAND.full} — Verified Sourcing, Export Worldwide`, template: `%s — ${BRAND.full}` },
  description: 'Verified manufacturers, RFQs, quality inspection, export documentation and door-to-door logistics on one portal.',
  openGraph: { siteName: BRAND.full, type: 'website' },
};

export const viewport: Viewport = { width: 'device-width', initialScale: 1, themeColor: '#0b2a5b' };

export default async function RootLayout({ children }: { children: ReactNode }) {
  const { locale, dict, rtl } = await getI18n();
  return (
    <html lang={locale} dir={rtl ? 'rtl' : 'ltr'} className={`${sans.variable} ${serif.variable}`}>
      <body>
        <I18nProvider locale={locale} dict={dict}>
          <Toaster>{children}</Toaster>
        </I18nProvider>
      </body>
    </html>
  );
}
