import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import ThemeProvider from "@/components/ThemeProvider";
import BottomNav from "@/components/Navigation/BottomNav";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

import AuthGuard from "@/components/AuthGuard";
import DataFetcher from "@/components/DataFetcher";

export const metadata: Metadata = {
  title: "Sur Sangeet",
  description: "Synchronized Bhajan Reading Application",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} antialiased bg-black`}>
        <ThemeProvider>
          <AuthGuard>
            <DataFetcher />
            {/* Mobile constraint container for Desktop */}
            <div className="mx-auto w-full max-w-[480px] min-h-screen bg-background relative overflow-x-hidden no-scrollbar shadow-2xl">
              {children}
              <BottomNav />
            </div>
          </AuthGuard>
        </ThemeProvider>
      </body>
    </html>
  );
}
