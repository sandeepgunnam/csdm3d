import type { Metadata } from "next";
import { IBM_Plex_Mono, Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const ibmPlexMono = IBM_Plex_Mono({
  variable: "--font-ibm-plex-mono",
  weight: ["400", "500", "600"],
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "CSDM3D — ServiceNow CSDM 5.0 Maturity",
  description:
    "Connect a ServiceNow instance, score the five CSDM 5.0 domains, and review the result with two specialist agents — Pierrondi Enterprise Architect and ITOM Doctor.",
  openGraph: {
    title: "CSDM3D — ServiceNow CSDM 5.0 Maturity",
    description:
      "CSDM 5.0 maturity, made visible. Two-agent assessment with a 3D map.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} ${ibmPlexMono.variable} h-full`}>
      <body className="min-h-full">{children}</body>
    </html>
  );
}
