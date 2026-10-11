import type { Metadata } from "next";
import { Inter } from "next/font/google";
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
  title: "AspireMint",
  description: "Role-based Deal Management System",
  icons: {
    icon: "/favicon.svg",
    apple: "/favicon.svg",
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "AspireMint",
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
