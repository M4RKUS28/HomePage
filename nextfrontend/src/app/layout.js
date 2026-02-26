import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "../contexts/AuthContext";
import { fetchCurrentUserSSR, fetchCVDataSSR } from '../lib/server-api';
import { ThemeProvider } from "../contexts/ThemeContext";
import { ToastProvider } from "../contexts/ToastContext";
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
  // Fetch user from iron-session → signed JWT → FastAPI (server-side)
  const initialUser = await fetchCurrentUserSSR();
  
  // Fetch CV data for header text and footer data
  const cvData = await fetchCVDataSSR();
  const headerText = cvData?.personalInfo?.headerText || 'Portfolio';
  const socialLinks = cvData?.personalInfo?.socialLinks || [];
  const ownerName = cvData?.personalInfo?.name || 'Portfolio';
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <ThemeProvider>
          <ToastProvider>
            <AuthProvider initialUser={initialUser}>
              <MainLayout 
                headerText={headerText}
                socialLinks={socialLinks}
                ownerName={ownerName}
              >
                {children}
              </MainLayout>
              <ToastNotification />
            </AuthProvider>
          </ToastProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
