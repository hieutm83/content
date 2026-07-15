import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "TikTok Analytics | An Lành Một Chút",
  description: "Dashboard phân tích hiệu quả nội dung TikTok từ Lark Base",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="vi">
      <body>{children}</body>
    </html>
  );
}
