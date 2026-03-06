import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "إلكترونيات النعمان",
  description: "محل بيع الأدوات الإلكترونية وقطع الغيار",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ar" dir="rtl">
      <body className="antialiased bg-gray-50 min-h-screen">
        {children}
      </body>
    </html>
  );
}
