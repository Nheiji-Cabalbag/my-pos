import "./globals.css";
import type { Metadata } from "next";
import { AuthGate } from "@/components/auth-gate";
import { Sidebar } from "@/components/sidebar";

export const metadata: Metadata = { title: "POS & Inventory" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-[#f5f8f7] text-slate-800 antialiased">
        <AuthGate>
          <div className="flex min-h-screen flex-col md:flex-row">
            <Sidebar />
            <main className="flex-1 p-4 md:p-6">{children}</main>
          </div>
        </AuthGate>
      </body>
    </html>
  );
}
