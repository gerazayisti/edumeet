import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { SiteHeader } from "@/components/layout/site-header";
import { NotificationProvider } from "@/components/notifications/notification-provider";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "EduMeet - Plateforme Éducative Moderne",
  description: "EduMeet est une plateforme éducative innovante qui connecte enseignants et étudiants dans un environnement d'apprentissage moderne",
  manifest: '/manifest.json',
  icons: [
    { rel: 'apple-touch-icon', url: '/icon-192x192.png' },
    { rel: 'icon', url: '/icon-192x192.png' },
  ],
  themeColor: '#ffffff',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <NotificationProvider>
          <div className="relative min-h-screen flex flex-col">
            <SiteHeader />
            <main className="flex-1">
              <div className="container py-6">{children}</div>
            </main>
          </div>
          <Toaster />
        </NotificationProvider>
      </body>
    </html>
  )
}
