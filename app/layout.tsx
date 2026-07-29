import type { Metadata } from "next";
import "./globals.css";

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
    <html lang="th">
      <body className="antialiased bg-audit-bg text-navy min-h-screen">
        {children}
      </body>
    </html>
  );
}
