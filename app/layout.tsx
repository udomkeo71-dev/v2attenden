import type { Metadata, Viewport } from "next";
import { Kantumruy_Pro, Battambang } from "next/font/google";
import "./globals.css";

const kantumruy = Kantumruy_Pro({
  subsets: ["khmer", "latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-kantumruy",
  display: "swap",
});

const battambang = Battambang({
  subsets: ["khmer"],
  weight: ["400", "700"],
  variable: "--font-battambang",
  display: "swap",
});

export const metadata: Metadata = {
  title: "V2aAttendence - ប្រព័ន្ធកត់ត្រាវត្តមានបុគ្គលិក | 7-Branch Attendance & AI",
  description: "ប្រព័ន្ធកត់ត្រាវត្តមានបុគ្គលិកតាម QR Code, GPS Geofencing, ផ្ទៀងផ្ទាត់ផ្ទៃមុខ Gemini AI និង Telegram Alert",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "V2aAttendence",
  },
  icons: {
    icon: "/logo.png",
    shortcut: "/logo.png",
    apple: "/logo.png",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#2563eb",
};

import { PwaUpdater } from "@/components/PwaUpdater";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="km" className={`${kantumruy.variable} ${battambang.variable}`}>
      <body className="font-kantumruy bg-slate-50 text-slate-900 antialiased min-h-screen selection:bg-blue-500 selection:text-white">
        <PwaUpdater />
        {children}
      </body>
    </html>
  );
}
