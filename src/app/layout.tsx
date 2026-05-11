import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { SiteHeader } from "@/components/SiteHeader";
import { loadSections } from "@/lib/sections";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "佐纳 — 个人主页",
  description: "佐纳的个人网站：正在做的事、感兴趣的事、与一些成果。",
};

interface RootLayoutProps {
  children: React.ReactNode;
}

export default async function RootLayout({
  children,
}: Readonly<RootLayoutProps>): Promise<React.ReactElement> {
  const sections = await loadSections();
  const navItems = sections.map((s) => ({
    label: s.nav,
    href: `#${s.slug}`,
    id: s.slug,
  }));
  return (
    <html
      lang="zh-CN"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased snap-y snap-mandatory`}
    >
      <body className="min-h-full flex flex-col bg-background text-foreground">
        <SiteHeader items={navItems} />
        {children}
      </body>
    </html>
  );
}
