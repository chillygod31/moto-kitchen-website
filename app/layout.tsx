import type { Metadata } from "next";
import { Cinzel, Source_Sans_3 } from "next/font/google";
import localFont from "next/font/local";
import "./globals.css";
import Header from "./components/Header";
import Footer from "./components/Footer";

const halimun = localFont({
  src: "../public/fonts/Halimun.ttf",
  variable: "--font-heading",
});

const cinzel = Cinzel({
  variable: "--font-cinzel",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const sourceSans = Source_Sans_3({
  variable: "--font-body",
  subsets: ["latin"],
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
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${halimun.variable} ${cinzel.variable} ${sourceSans.variable} antialiased`}>
        <Header />
        <main>{children}</main>
        <Footer />
      </body>
    </html>
  );
}
