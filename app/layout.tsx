import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  title: "Team Roster Management System",
  description: "Fast, simple team roster management."
};

export default function RootLayout({
  children
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen">
        <div className="min-h-screen flex flex-col">
          <header className="border-b border-slate-200 bg-white">
            <div className="mx-auto max-w-4xl px-4 py-4 flex items-center justify-between">
              <Link href="/roster" className="flex items-center gap-3">
                <Image
                  src="/ira-logo.png"
                  alt="Team Roster logo"
                  width={120}
                  height={32}
                  className="h-8 w-auto"
                />
                <div>
                  <p className="text-sm font-semibold text-ira-navy">
                    Team Roster Management System
                  </p>
                </div>
              </Link>
              <Link href="/admin/login" className="text-sm text-ira-navy underline">
                Admin
              </Link>
            </div>
          </header>
          <main className="flex-1">
            <div className="mx-auto max-w-4xl px-4 py-8">{children}</div>
          </main>
        </div>
      </body>
    </html>
  );
}
