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
  title: "RAG Chatbot",
  description: "A minimalist RAG chatbot with database integration",
  generator: "v0.dev",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="th">
      <body className={`${kanit.variable} ${inter.variable} font-kanit`}>
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
