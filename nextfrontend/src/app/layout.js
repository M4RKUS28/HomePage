import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "../contexts/AuthContext";
import { cookies } from 'next/headers';
import { fetchCVDataSSR } from '../lib/server-api';

// Serverseitige User-Fetch-Funktion (direkter fetch statt axios)
async function fetchCurrentUserServer(token) {
  if (!token) return null;
  try {
    const res = await fetch(
      process.env.NODE_ENV === 'production'
        ? 'https://www.m4rkus28.de/api/users/me'
        : 'http://127.0.0.1:8000/api/users/me',
      {
        headers: { Authorization: `Bearer ${token}` },
        cache: 'no-store',
      }
    );
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}
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
  // Token aus Cookie lesen (SSR)
  const cookieStore = await cookies();
  const token = cookieStore.get('accessToken')?.value;
  const initialUser = await fetchCurrentUserServer(token);
  
  // Fetch CV data for header text
  const cvData = await fetchCVDataSSR();
  const headerText = cvData?.personalInfo?.headerText || 'Portfolio';
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <ThemeProvider>
          <ToastProvider>
            <AuthProvider initialUser={initialUser}>
              <MainLayout headerText={headerText}>
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
