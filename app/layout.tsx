import type React from "react";
import "./globals.css";
import type { Metadata } from "next";
import { Kanit, Inter } from "next/font/google";
import { ThemeProvider } from "@/components/theme-provider";

// Load Kanit font for Thai language
const kanit = Kanit({
  weight: ["300", "400", "500", "600"],
  subsets: ["thai", "latin"],
  variable: "--font-kanit",
  display: "swap",
});

// Load Inter font for English text
const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Easy Chat",
  description: "แชทบอท AI และ RAG ที่เรียบง่ายและใช้งานได้ดี",
  generator: "v1",
  viewport:
    "width=device-width, initial-scale=1, viewport-fit=cover, maximum-scale=1, user-scalable=no",
  themeColor: "#ffffff",
  appleWebApp: {
    title: "Easy Chat",
    statusBarStyle: "default",
    capable: true,
  },
  icons: {
    icon: "/apple-touch-icon.png",
    apple: "/apple-touch-icon.png",
  },
  manifest: "/manifest.json",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="th" suppressHydrationWarning>
      <head>
        <meta name="format-detection" content="telephone=no" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="application-name" content="Easy Chat" />
        <link rel="shortcut icon" href="/favicon.ico" />
        <link
          rel="apple-touch-icon"
          sizes="180x180"
          href="/apple-touch-icon.png"
        />
      </head>
      <body
        className={`${kanit.variable} ${inter.variable} font-kanit antialiased ios-safe-padding`}
        suppressHydrationWarning
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem
          disableTransitionOnChange
        >
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
