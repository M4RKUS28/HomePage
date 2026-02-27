import { Geist, Geist_Mono } from "next/font/google";
import "../globals.css";
import { fetchCVDataSSR } from '../../lib/server-api';
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

  // Fetch CV data for header text and footer data
  const cvData = await fetchCVDataSSR();
  const headerText = cvData?.personalInfo?.headerText || 'Portfolio';
  const socialLinks = cvData?.personalInfo?.socialLinks || [];
  const ownerName = cvData?.personalInfo?.name || 'Portfolio';

  const messages = await getMessages();

  return (
    <html lang={locale} data-scroll-behavior="smooth" suppressHydrationWarning>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
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
