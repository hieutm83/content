import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "TikTok Analytics | An Lành Một Chút",
  description: "Dashboard phân tích hiệu quả nội dung Tiktok by MinhHieu",
  openGraph: {
    title: "TikTok Analytics | An Lành Một Chút",
    description: "Dashboard phân tích hiệu quả nội dung Tiktok by MinhHieu",
    url: "https://content-elo.pages.dev",
    siteName: "TikTok Analytics",
    locale: "vi_VN",
    type: "website",
  },
  twitter: {
    card: "summary",
    title: "TikTok Analytics | An Lành Một Chút",
    description: "Dashboard phân tích hiệu quả nội dung Tiktok by MinhHieu",
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="vi">
      <body>{children}</body>
    </html>
  );
}
