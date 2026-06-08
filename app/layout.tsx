import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ToastProvider } from "@/components/ui/toast";
import { ServiceWorkerRegister } from "@/components/pwa/service-worker-register";

const inter = Inter({ subsets: ["latin"], variable: "--font-sans" });

export const metadata: Metadata = {
  title: {
    default: "DALOA HUB - Marketplace de Daloa",
    template: "%s | DALOA HUB",
  },
  description:
    "Plateforme numerique de la ville de Daloa : achetez, vendez et faites livrer en toute simplicite.",
  manifest: "/manifest.webmanifest",
  applicationName: "DALOA HUB",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "DALOA HUB",
  },
};

export const viewport: Viewport = {
  themeColor: "#00A651",
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr" suppressHydrationWarning>
      <body className={`${inter.variable} font-sans`}>
        <ToastProvider>{children}</ToastProvider>
        <ServiceWorkerRegister />
      </body>
    </html>
  );
}
