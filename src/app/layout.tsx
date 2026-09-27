import type { Metadata } from "next";
import { Montserrat } from "next/font/google";
import "./globals.css";

const montserrat = Montserrat({
  variable: "--font-montserrat",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://worldpickleball.world"),
  title: {
    default: "World Pickleball Union | Uniting Pickleball Worldwide",
    template: "%s | World Pickleball Union",
  },
  description:
    "World Pickleball Union is being established as an international non-profit governing body supporting the global development of pickleball through governance, competition, standards and integrity.",
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
    <html lang="en" className={montserrat.variable}>
      <body>{children}</body>
    </html>
  );
}
