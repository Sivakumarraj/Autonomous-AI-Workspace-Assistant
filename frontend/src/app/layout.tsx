import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import AppShell from "@/components/layout/AppShell";
import {
  THEME_INIT_SCRIPT,
  ThemeProvider,
} from "@/components/providers/ThemeProvider";
import { ToastProvider } from "@/components/providers/ToastProvider";

// next/font self-hosts the font at build time. The previous <link> to
// fonts.googleapis.com added a render-blocking third-party request on every
// page load and left the app dependent on an external host.
const inter = Inter({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  display: "swap",
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "AI Workspace Assistant - Nexus AI",
  description:
    "Autonomous AI Workspace Assistant powered by Nexus AI. Manage documents, chat with AI, automate workflows, and more.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" data-theme="dark" className={inter.variable}>
      <head>
        {/*
          Applies the stored theme before first paint. Without this the page
          renders dark then flips to light, which is very visible.
        */}
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
      </head>
      <body>
        <ThemeProvider>
          <ToastProvider>
            <AppShell>{children}</AppShell>
          </ToastProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
