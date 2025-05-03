"use client";
import { SessionProvider } from "next-auth/react";
import { Toaster } from "react-hot-toast";

export default function AppLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <SessionProvider>
      <div className="flex h-screen">
        <main className="flex-1 overflow-auto">
          <Toaster position="top-right" />
          {children}
        </main>
      </div>
    </SessionProvider>
  );
}
