import type { Metadata } from "next";
import "./globals.css";
import { TopStatusBar } from "@/components/layout/TopStatusBar";
import { LeftNavRail } from "@/components/layout/LeftNavRail";
import { RightOperationsPanel } from "@/components/layout/RightOperationsPanel";
import { BottomEventConsole } from "@/components/layout/BottomEventConsole";

export const metadata: Metadata = {
  title: "AstroFlow-AI | Bharatiya Antariksh Station Mission Console",
  description:
    "Offline Edge-AI Copilot for Bharatiya Antariksh Station (BAS) astronaut protocol guidance and anomaly detection.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="h-screen w-screen overflow-hidden flex flex-col bg-background text-foreground antialiased selection:bg-accent/30 selection:text-white">
        {/* TOP STATUS BAR (Fixed, 48px) */}
        <TopStatusBar />

        {/* 3-COLUMN CORE MIDDLE SECTION (Flex-1, min-h-0) */}
        <div className="flex-1 flex overflow-hidden min-h-0">
          {/* LEFT NAVIGATION RAIL (Fixed, 56px) */}
          <LeftNavRail />

          {/* MAIN CONTENT VIEWPORT (Center Dynamic Route) */}
          <main className="flex-1 overflow-y-auto min-w-0 bg-background/60 p-3.5 focus:outline-none">
            {children}
          </main>

          {/* RIGHT OPERATIONS PANEL (Fixed, 320px) */}
          <RightOperationsPanel />
        </div>

        {/* BOTTOM EVENT CONSOLE (Fixed 160px terminal drawer) */}
        <BottomEventConsole />
      </body>
    </html>
  );
}
