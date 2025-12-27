import type { Metadata } from "next";
import Script from "next/script";
import { headers } from "next/headers";
import { Cinzel, Work_Sans, Cormorant_Garamond, DM_Serif_Display, Inter } from "next/font/google";
import localFont from "next/font/local";
import "./globals.css";
import Header from "./components/Header";
import Footer from "./components/Footer";
import CookieConsent from "./components/CookieConsent";
import MarketingClickTracker from "./components/MarketingClickTracker";

const halimun = localFont({
  src: "../public/fonts/Halimun.ttf",
  variable: "--font-heading",
});

const cinzel = Cinzel({
  variable: "--font-cinzel",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const workSans = Work_Sans({
  variable: "--font-body",
  subsets: ["latin"],
});

const cormorantGaramond = Cormorant_Garamond({
  variable: "--font-heading-display",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const dmSerifDisplay = DM_Serif_Display({
  variable: "--font-dm-serif-display",
  subsets: ["latin"],
  weight: ["400"],
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});

export const metadata: Metadata = {
  title: {
    default: "Moto Kitchen | Authentic Tanzanian Catering in the Netherlands",
    template: "%s | Moto Kitchen",
  },
  description: "Experience the rich flavours of Tanzania. Moto Kitchen brings authentic Tanzanian cuisine to your events, parties, and gatherings across the Netherlands.",
  keywords: ["Tanzanian catering", "African food", "Netherlands catering", "Swahili cuisine", "event catering", "wedding catering", "corporate catering"],
  authors: [{ name: "Moto Kitchen" }],
  creator: "Moto Kitchen",
  metadataBase: new URL("https://motokitchen.nl"),
  openGraph: {
    type: "website",
    locale: "en_NL",
    url: "https://motokitchen.nl",
    siteName: "Moto Kitchen",
    title: "Moto Kitchen | Authentic Tanzanian Catering in the Netherlands",
    description: "Experience the rich flavours of Tanzania. Moto Kitchen brings authentic Tanzanian cuisine to your events, parties, and gatherings across the Netherlands.",
    images: [
      {
        url: "/og-image.jpg",
        width: 1200,
        height: 630,
        alt: "Moto Kitchen - Authentic Tanzanian Catering",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Moto Kitchen | Authentic Tanzanian Catering",
    description: "Experience the rich flavours of Tanzania at your next event.",
    images: ["/og-image.jpg"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  icons: {
    icon: "/logo-circle.png",
    apple: "/logo-circle.png",
    shortcut: "/logo-circle.png",
  },
  viewport: {
    width: 'device-width',
    initialScale: 1,
    maximumScale: 5,
    userScalable: true,
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const gtmId = process.env.NEXT_PUBLIC_GTM_ID;
  const headersList = await headers();
  const pathname = headersList.get("x-pathname") || "";
  const enableMarketingAnalytics =
    !!gtmId && !pathname.startsWith("/admin") && !pathname.startsWith("/order");

  return (
    <html lang="en">
      <head>
        {enableMarketingAnalytics && (
          <>
            {/* Consent Mode (EU): default denied until user accepts in cookie banner */}
            <Script
              id="consent-default"
              strategy="beforeInteractive"
              dangerouslySetInnerHTML={{
                __html: `
                  window.dataLayer = window.dataLayer || [];
                  function gtag(){dataLayer.push(arguments);}
                  gtag('consent', 'default', {
                    ad_storage: 'denied',
                    analytics_storage: 'denied',
                    ad_user_data: 'denied',
                    ad_personalization: 'denied',
                    wait_for_update: 500
                  });
                `,
              }}
            />

            {/* Google Tag Manager */}
            <Script
              id="gtm"
              strategy="afterInteractive"
              dangerouslySetInnerHTML={{
                __html: `
                  (function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
                  new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
                  j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
                  'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
                  })(window,document,'script','dataLayer','${gtmId}');
                `,
              }}
            />
          </>
        )}
      </head>
      <body className={`${halimun.variable} ${cinzel.variable} ${workSans.variable} ${cormorantGaramond.variable} ${dmSerifDisplay.variable} ${inter.variable} antialiased`}>
        {enableMarketingAnalytics && (
          <noscript>
            <iframe
              src={`https://www.googletagmanager.com/ns.html?id=${gtmId}`}
              height="0"
              width="0"
              style={{ display: "none", visibility: "hidden" }}
            />
          </noscript>
        )}
        {enableMarketingAnalytics && <MarketingClickTracker />}
        <Header />
        <main>{children}</main>
        <Footer />
        {enableMarketingAnalytics && <CookieConsent />}
      </body>
    </html>
  );
}
