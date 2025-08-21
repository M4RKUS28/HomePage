'use client';

import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { LoadingProvider } from "@/contexts/LoadingContext";

export default function ClientLayout({ children }) {
  return (
    <LoadingProvider>
      <Header />
      <main className="flex-grow">
        {children}
      </main>
      <Footer />
    </LoadingProvider>
  );
}
