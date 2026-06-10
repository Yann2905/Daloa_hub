import type { Metadata, Viewport } from "next";
import { Inter, Sora } from "next/font/google";
import "./globals.css";
import { ToastProvider } from "@/components/ui/toast";
import { ServiceWorkerRegister } from "@/components/pwa/service-worker-register";

const inter = Inter({ subsets: ["latin"], variable: "--font-sans" });
const sora = Sora({
  subsets: ["latin"],
  variable: "--font-display",
  weight: ["600", "700", "800"],
});

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_APP_URL?.startsWith("http")
      ? process.env.NEXT_PUBLIC_APP_URL
      : "https://daloa-hub.vercel.app",
  ),
  title: {
    default: "DALOA HUB - Marketplace de Daloa",
    template: "%s | DALOA HUB",
  },
  description:
    "Plateforme numerique de la ville de Daloa : achetez, vendez et faites livrer en toute simplicite.",
  openGraph: {
    type: "website",
    siteName: "DALOA HUB",
    locale: "fr_FR",
  },
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
      <body className={`${inter.variable} ${sora.variable} font-sans`}>
        <script
          dangerouslySetInnerHTML={{
            __html: `try{var t=localStorage.getItem('theme');if(t==='dark'||(!t&&window.matchMedia('(prefers-color-scheme:dark)').matches)){document.documentElement.classList.add('dark')}}catch(e){}`,
          }}
        />
        <ToastProvider>{children}</ToastProvider>
        <ServiceWorkerRegister />
      </body>
    </html>
  );
}
