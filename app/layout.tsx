import "./globals.css";
import type { Metadata } from "next";
import { Inter, Kanit } from "next/font/google";
import { cn } from "@/lib/utils";
import { ThemeProvider } from "@/components/theme-provider";

// Load Inter font for English text
const inter = Inter({ subsets: ["latin"] });

// Load Kanit font for Thai language
const kanit = Kanit({
  weight: ["300", "400", "500", "600", "700"],
  subsets: ["thai", "latin"],
  variable: "--font-kanit",
});

export const metadata: Metadata = {
  title: "Just Easy Chat",
  description: "A simple yet powerful chatbot with knowledge base.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="th">
      <head>
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1, maximum-scale=1, minimum-scale=1, user-scalable=no, viewport-fit=cover"
        />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="theme-color" content="#ffffff" />
      </head>
      <body
        className={cn(
          inter.className,
          "font-kanit",
          kanit.variable,
          "ios-viewport ios-safe-padding"
        )}
      >
        <ThemeProvider attribute="class" defaultTheme="light">
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
