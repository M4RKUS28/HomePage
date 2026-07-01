import { Geist, Geist_Mono, Archivo } from "next/font/google";
import "../globals.css";
import { fetchCVDataSSR, fetchPublicSettingsSSR } from '../../lib/server-api';
import { buildAccentCss, resolveAccentColor } from '../../lib/accent';
import Providers from "../../components/Providers";
import MainLayout from "../../layouts/MainLayout";
import ToastNotification from "../../components/UI/ToastNotification";
import { NextIntlClientProvider } from 'next-intl';
import { getMessages, setRequestLocale } from 'next-intl/server';
import { routing } from '../../i18n/routing';
import { notFound } from 'next/navigation';

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// Display face: variable width axis lets us use the expanded cut for headlines
const archivo = Archivo({
  variable: "--font-archivo",
  subsets: ["latin"],
  axes: ["wdth"],
});

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata({ params }) {
  const { locale } = await params;
  const messages = await getMessages({ locale });
  
  return {
    title: messages?.metadata?.title || "M4RKUS-HP",
    description: messages?.metadata?.description || "Personal portfolio and professional showcase",
  };
}

export default async function LocaleLayout({ children, params }) {
  const { locale } = await params;

  // Validate that the incoming locale is supported
  if (!routing.locales.includes(locale)) {
    notFound();
  }

  setRequestLocale(locale);

  // Fetch CV data (header/footer) and public settings (accent color) in parallel
  const [cvData, publicSettings] = await Promise.all([
    fetchCVDataSSR(locale),
    fetchPublicSettingsSSR(),
  ]);
  const headerText = cvData?.personalInfo?.headerText || 'Portfolio';
  const socialLinks = cvData?.personalInfo?.socialLinks || [];
  const ownerName = cvData?.personalInfo?.name || 'Portfolio';

  // Custom accent color → CSS var overrides, rendered inline so the very
  // first paint already uses it. Null when unset/default/invalid. The "random"
  // setting is resolved to a fresh hex per request (the route already renders
  // dynamically via the no-store CV fetch), so each full reload gets a new color.
  const accentCss = buildAccentCss(resolveAccentColor(publicSettings?.accent_color));

  const messages = await getMessages();

  return (
    <html lang={locale} data-scroll-behavior="smooth" suppressHydrationWarning>
      <body className={`${geistSans.variable} ${geistMono.variable} ${archivo.variable} antialiased`}>
        {accentCss && (
          <style id="accent-theme" dangerouslySetInnerHTML={{ __html: accentCss }} />
        )}
        <NextIntlClientProvider messages={messages}>
          <Providers>
            <MainLayout 
              headerText={headerText}
              socialLinks={socialLinks}
              ownerName={ownerName}
            >
              {children}
            </MainLayout>
            <ToastNotification />
          </Providers>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
