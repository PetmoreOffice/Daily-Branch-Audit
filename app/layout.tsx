import type { Metadata } from "next";
import { Prompt } from "next/font/google";
import "./globals.css";

const promptFont = Prompt({
  subsets: ["latin", "thai"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-prompt",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Branch Audit System - ระบบตรวจประเมินสาขา",
  description: "ระบบตรวจประเมินสาขาและวิเคราะห์ผลการปฏิบัติงาน Real-time สำหรับทีมผู้บริหารและ Area Manager",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="th" className={promptFont.variable}>
      <body className="antialiased bg-audit-bg text-navy min-h-screen font-sans">
        {children}
      </body>
    </html>
  );
}
