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
    title: "V2 Attendance",
  },
  icons: {
    icon: [
      { url: "/icon.png", sizes: "192x192", type: "image/png" },
      { url: "/icon.png", sizes: "512x512", type: "image/png" },
      { url: "/favicon.ico", sizes: "any" },
    ],
    shortcut: "/icon.png",
    apple: [
      { url: "/icon.png", sizes: "180x180", type: "image/png" },
      { url: "/apple-icon.png", sizes: "180x180", type: "image/png" },
    ],
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
      <head>
        <link rel="icon" type="image/png" sizes="192x192" href="/icon.png" />
        <link rel="icon" type="image/png" sizes="512x512" href="/icon.png" />
        <link rel="apple-touch-icon" sizes="180x180" href="/icon.png" />
        <link rel="shortcut icon" href="/icon.png" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="V2 Attend" />
        <meta name="application-name" content="V2 Attend" />
      </head>
      <body className="font-kantumruy bg-slate-50 text-slate-900 antialiased min-h-screen selection:bg-blue-500 selection:text-white">
        <PwaUpdater />
        {children}
      </body>
    </html>
  );
}
