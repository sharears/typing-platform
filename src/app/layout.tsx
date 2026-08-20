import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/Providers";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Type & Learn",
  description: "Learn topics by typing AI-generated summaries.",
};

import { Analytics } from '@vercel/analytics/react';

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <Providers>
          <nav className="nav-header">
            <div className="nav-logo gradient-text">Type & Learn</div>
          </nav>
          <main className="main-content">
            {children}
          </main>
        </Providers>
        <Analytics />
      </body>
    </html>
  );
}
