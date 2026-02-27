import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { fetchCVDataSSR } from '../lib/server-api';
import Providers from "../components/Providers";
import MainLayout from "../layouts/MainLayout";
import ToastNotification from "../components/UI/ToastNotification";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: "M4RKUS-HP",
  description: "Personal portfolio and professional showcase",
};

export default async function RootLayout({ children }) {
  // Fetch CV data for header text and footer data
  const cvData = await fetchCVDataSSR();
  const headerText = cvData?.personalInfo?.headerText || 'Portfolio';
  const socialLinks = cvData?.personalInfo?.socialLinks || [];
  const ownerName = cvData?.personalInfo?.name || 'Portfolio';

  return (
    <html lang="en" data-scroll-behavior="smooth">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
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
      </body>
    </html>
  );
}
