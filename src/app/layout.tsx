import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://worldpickleball.world"),
  title: "World Pickleball Union | Uniting Pickleball Worldwide",
  description:
    "World Pickleball Union is being established as an international non-profit governing body supporting the global development of pickleball.",
  icons: {
    icon: "/brand/wpu-mark.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={inter.variable}>
      <body>{children}</body>
    </html>
  );
}
