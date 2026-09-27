import type { Metadata, Viewport } from "next";
import { Montserrat } from "next/font/google";
import "./globals.css";

const montserrat = Montserrat({
  variable: "--font-montserrat",
  subsets: ["latin"],
  display: "swap",
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

export const metadata: Metadata = {
  metadataBase: new URL("https://worldpickleball.world"),

  title: {
    default: "World Pickleball Union | Uniting Pickleball Worldwide",
    template: "%s | World Pickleball Union",
  },

  description:
    "World Pickleball Union is being established as an international non-profit governing body supporting the global development of pickleball through governance, competition, standards and integrity.",

  applicationName: "World Pickleball Union",

  keywords: [
    "World Pickleball Union",
    "WPU",
    "pickleball",
    "international pickleball",
    "pickleball governance",
    "pickleball competitions",
    "pickleball standards",
    "pickleball federation",
    "pickleball membership",
    "pickleball development",
  ],

  authors: [{ name: "World Pickleball Union" }],
  creator: "World Pickleball Union",
  publisher: "World Pickleball Union",

  alternates: {
    canonical: "/",
  },

  openGraph: {
    type: "website",
    locale: "en",
    url: "/",
    siteName: "World Pickleball Union",
    title: "World Pickleball Union | Uniting Pickleball Worldwide",
    description:
      "An international non-profit governing body being established to support the global development of pickleball through governance, competition, standards and integrity.",
    images: [
      {
        url: "/opengraph-image.png",
        width: 1200,
        height: 630,
        alt: "World Pickleball Union — Uniting Pickleball Worldwide",
      },
    ],
  },

  twitter: {
    card: "summary_large_image",
    title: "World Pickleball Union | Uniting Pickleball Worldwide",
    description:
      "Supporting the international development of pickleball through governance, competition, standards and integrity.",
    images: ["/opengraph-image.png"],
  },

  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },

  icons: {
    icon: "/brand/wpu-mark.svg",
    shortcut: "/brand/wpu-mark.svg",
    apple: "/brand/wpu-mark.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={montserrat.variable}>
      <body>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@graph": [
                {
                  "@type": "Organization",
                  "@id": "https://worldpickleball.world/#organization",
                  name: "World Pickleball Union",
                  alternateName: "WPU",
                  url: "https://worldpickleball.world",
                  logo: {
                    "@type": "ImageObject",
                    url: "https://worldpickleball.world/brand/wpu-logo-approved.png",
                  },
                  description:
                    "World Pickleball Union is being established as an international non-profit governing body supporting the global development of pickleball.",
                },
                {
                  "@type": "WebSite",
                  "@id": "https://worldpickleball.world/#website",
                  url: "https://worldpickleball.world",
                  name: "World Pickleball Union",
                  alternateName: "WPU",
                  publisher: {
                    "@id": "https://worldpickleball.world/#organization",
                  },
                  inLanguage: "en",
                },
              ],
            }),
          }}
        />
        {children}
      </body>
    </html>
  );
}
