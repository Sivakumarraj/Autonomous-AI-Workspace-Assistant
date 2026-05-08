import type { Metadata } from "next";
import "@/app/globals.css";
import Sidebar from "@/components/layout/Sidebar";
import Header from "@/components/layout/Header";

export const metadata: Metadata = {
  title: "AI Workspace Assistant - Nexus AI",
  description: "Autonomous AI Workspace Assistant powered by Nexus AI. Manage documents, chat with AI, automate workflows, and more.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <div style={{ display: 'flex', height: '100vh', overflow: 'hidden' }}>
          <Sidebar />
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', marginLeft: '250px', height: '100vh', overflow: 'hidden' }}>
            <Header />
            <main style={{ flex: 1, overflow: 'auto', backgroundColor: '#0a0a1a' }}>
              {children}
            </main>
          </div>
        </div>
      </body>
    </html>
  );
}
