import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Paytm IntentGuard — Contextual Payment Security Layer",
  description: "An adaptive, contextual security prototype for UPI payments. Same amount. Different context. Different protection.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500;700&display=swap" rel="stylesheet" />
      </head>
      <body className="min-h-screen bg-[#070e1c] text-slate-100 antialiased selection:bg-[#00BAF2] selection:text-slate-900">
        {children}
      </body>
    </html>
  );
}
