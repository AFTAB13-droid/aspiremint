import type { Metadata } from "next";
import { Inter } from "next/font/google";
import Script from "next/script";
import "./globals.css";
import AuthProvider from "@/components/common/AuthProvider";
import { NotificationToaster } from "@/components/ui/NotificationToaster";

import OfflineGuard from "@/components/layout/OfflineGuard";
import SplashController from "@/components/common/SplashController";
import { GlobalNotificationPoller } from "@/components/layout/GlobalNotificationPoller";
import FcmInitializer from "@/components/common/FcmInitializer";

import { ThemeProvider } from "@/context/ThemeContext";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  metadataBase: new URL("https://deals.aspiremint.in"),
  title: {
    default: "AspireMint | Flipkart Review Finder & 100% Cashback Deals",
    template: "%s | AspireMint",
  },
  description:
    "Extract customer reviews, copy permalinks, generate screenshot proofs, and discover 100% cashback deals on Flipkart & Amazon.",
  keywords: [
    "Flipkart review finder",
    "Flipkart review screenshot",
    "Flipkart review download",
    "Flipkart cashback deals",
    "Amazon cashback deals",
    "AspireMint",
    "100% cashback",
    "UPI refund deals",
  ],
  authors: [{ name: "AspireMint" }],
  creator: "AspireMint",
  publisher: "AspireMint",
  icons: {
    icon: "/favicon.svg",
    apple: "/favicon.svg",
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "AspireMint",
  },
  openGraph: {
    title: "AspireMint | Flipkart Review Finder & 100% Cashback Deals",
    description:
      "Extract customer reviews, copy permalinks, generate screenshot proofs, and discover 100% cashback deals on Flipkart & Amazon.",
    url: "https://deals.aspiremint.in",
    siteName: "AspireMint",
    locale: "en_IN",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "AspireMint | Flipkart Review Finder & 100% Cashback Deals",
    description:
      "Extract customer reviews, copy permalinks, generate screenshot proofs, and discover 100% cashback deals on Flipkart & Amazon.",
  },
  verification: {
    google: "rC345VkSlShZ1NHNI1MzugRWGvo818qWiM5liXVuXx8",
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
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var saved = localStorage.getItem('aspiremint_theme');
                  // AspireMint default theme is strictly LIGHT!
                  // Only apply dark if user has explicitly saved 'dark'.
                  if (saved === 'dark') {
                    document.documentElement.classList.add('dark');
                    document.documentElement.setAttribute('data-theme', 'dark');
                  } else {
                    document.documentElement.classList.remove('dark');
                    document.documentElement.setAttribute('data-theme', 'light');
                  }
                } catch (e) {}
              })();
            `,
          }}
        />
        {/* Google Analytics 4 (GA4) */}
        <Script
          strategy="afterInteractive"
          src="https://www.googletagmanager.com/gtag/js?id=G-VN0DHF5VPL"
        />
        <Script
          id="google-analytics-init"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: `
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());
              gtag('config', 'G-VN0DHF5VPL', {
                page_path: window.location.pathname,
              });
            `,
          }}
        />
      </head>
      <body className={`${inter.className} antialiased transition-colors duration-300`}>
        <ThemeProvider>
          <AuthProvider>
            <OfflineGuard>
              <SplashController>
                {children}
                <FcmInitializer />
                <NotificationToaster />
                <GlobalNotificationPoller />
              </SplashController>
            </OfflineGuard>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
