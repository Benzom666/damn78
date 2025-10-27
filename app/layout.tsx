import type React from "react"
import type { Metadata } from "next"
import { Geist, Geist_Mono } from "next/font/google"
import { Analytics } from "@vercel/analytics/next"
import { AppProviders } from "@/components/providers/app-providers"
import "./globals.css"

const geist = Geist({ 
  subsets: ["latin"],
  variable: "--font-geist-sans",
})

const geistMono = Geist_Mono({ 
  subsets: ["latin"],
  variable: "--font-geist-mono",
})

export const metadata: Metadata = {
  title: {
    default: "Delivery Management Pro",
    template: "%s | Delivery Management Pro",
  },
  description: "Professional delivery and route management system with real-time tracking, route optimization, and comprehensive analytics.",
  keywords: ["delivery", "logistics", "route optimization", "tracking", "management"],
  authors: [{ name: "AI Amplified Solutions", url: "https://aiamplifiedsolutions.com" }],
  creator: "AI Amplified Solutions",
  publisher: "AI Amplified Solutions",
  robots: {
    index: false,
    follow: false,
  },
  viewport: {
    width: "device-width",
    initialScale: 1,
    maximumScale: 1,
  },
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "white" },
    { media: "(prefers-color-scheme: dark)", color: "black" },
  ],
  manifest: "/manifest.json",
  icons: {
    icon: "/favicon.ico",
    shortcut: "/favicon-16x16.png",
    apple: "/apple-touch-icon.png",
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://delivery-management-pro.vercel.app",
    title: "Delivery Management Pro",
    description: "Professional delivery and route management system",
    siteName: "Delivery Management Pro",
  },
  twitter: {
    card: "summary_large_image",
    title: "Delivery Management Pro",
    description: "Professional delivery and route management system",
    creator: "@aiamplified",
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body className={`${geist.variable} ${geistMono.variable} font-sans antialiased min-h-screen bg-background`}>
        <AppProviders>
          <div className="relative flex min-h-screen flex-col">
            <main className="flex-1">
              {children}
            </main>
          </div>
        </AppProviders>
        <Analytics />
      </body>
    </html>
  )
}