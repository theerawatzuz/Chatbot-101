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
  title: "Just Easy Chat?",
  description: "A minimalist RAG chatbot with database integration",
  generator: "v1",
  icons: {
    icon: "./apple-touch-icon.png",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="th" suppressHydrationWarning>
      <head>
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover"
        />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta
          name="apple-mobile-web-app-status-bar-style"
          content="black-translucent"
        />
      </head>
      <body
        className={`${kanit.variable} ${inter.variable} font-kanit`}
        suppressHydrationWarning
        style={{
          overflow: "hidden",
          position: "fixed",
          width: "100%",
          height: "100%",
          touchAction: "none",
        }}
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

import "./globals.css";
