import { ClerkProvider } from "@clerk/nextjs";
import type { Metadata } from "next";
import { Mona_Sans } from "next/font/google";
import { Toaster } from "@/components/ui/sonner";

import "./globals.css";
import Navbar from "@/components/Navbar";

const monaSans = Mona_Sans({
  variable: "--font-mona-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "HiredAI",
  description: "An AI-powered platform for preparing for mock interviews",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ClerkProvider>
      <html lang="en" className="dark">
        <body className={`${monaSans.className} antialiased pattern`}>
          <Navbar />
          {children}
          <Toaster />
        </body>
      </html>
    </ClerkProvider>
  );
}
