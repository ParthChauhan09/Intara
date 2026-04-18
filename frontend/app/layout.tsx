import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "TarkSastra",
  description: "Frontend for TarkSastra.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full bg-slate-950 text-white">{children}</body>
    </html>
  );
}
