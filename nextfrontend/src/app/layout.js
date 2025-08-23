import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "../contexts/AuthContext";
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

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <ThemeProvider>
          <ToastProvider>
            <AuthProvider>
              <MainLayout>
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
