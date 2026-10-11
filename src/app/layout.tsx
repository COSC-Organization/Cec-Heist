import type { Metadata, Viewport } from "next";
import { Pixelify_Sans, Space_Mono, VT323 } from "next/font/google";
import "./globals.css";
import ZoomLock from "../components/ZoomLock";

const pixelify = Pixelify_Sans({
  variable: "--font-pixelify",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const spaceMono = Space_Mono({
  variable: "--font-space-mono",
  subsets: ["latin"],
  weight: ["400", "700"],
});

const vt323 = VT323({
  variable: "--font-vt323",
  subsets: ["latin"],
  weight: ["400"],
});

export const metadata: Metadata = {
  title: "CEC HEIST 2026",
  description: "CEC HEIST 2026 Official Application",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${pixelify.variable} ${spaceMono.variable} ${vt323.variable}`}>
      <body className="antialiased">
        <ZoomLock />
        {children}
      </body>
    </html>
  );
}
