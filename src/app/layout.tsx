import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import AuthProvider from "@/components/common/AuthProvider";
import { NotificationToaster } from "@/components/ui/NotificationToaster";

import OfflineGuard from "@/components/layout/OfflineGuard";
import SplashController from "@/components/common/SplashController";
import { GlobalNotificationPoller } from "@/components/layout/GlobalNotificationPoller";

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
    <html lang="en">
      <body className={`${inter.className} antialiased`}>
        <AuthProvider>
          <OfflineGuard>
            <SplashController>
              {children}
              <NotificationToaster />
              <GlobalNotificationPoller />
            </SplashController>
          </OfflineGuard>
        </AuthProvider>
      </body>
    </html>
  );
}
