import type { Metadata } from "next";
import "./globals.css";
import ClientProviders from "@/components/auth/ClientProviders";

export const metadata: Metadata = {
  title: "AccessHire — Adaptive Capability Twin",
  description: "See Capability. Prove Potential. Enable Transition. An AI Career & Workforce Operating System.",
  keywords: ["capability twin", "AI career", "inclusive hiring", "workforce intelligence", "AccessHire"],
  openGraph: {
    title: "AccessHire — Adaptive Capability Twin",
    description: "See Capability. Prove Potential. Enable Transition.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="h-full" data-theme="light">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&family=JetBrains+Mono:wght@400;500&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="h-full antialiased" style={{ background: 'var(--bg-base)', color: 'var(--text-primary)' }}>
        <ClientProviders>
          {children}
        </ClientProviders>
      </body>
    </html>
  );
}
