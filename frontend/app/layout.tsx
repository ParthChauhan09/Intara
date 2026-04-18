import type { Metadata } from "next";
import "./globals.css";
import { MainContextProvider } from "@/lib/state/MainContext";
import { Geist } from "next/font/google";
import { cn } from "@/lib/utils";

const geist = Geist({subsets:['latin'],variable:'--font-sans'});

export const metadata: Metadata = {
  title: "Intara",
  description: "Frontend for Intara.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={cn("h-full antialiased", "font-sans", geist.variable)}
      suppressHydrationWarning
    >
      <body
        className="min-h-full"
        suppressHydrationWarning
      >
        <MainContextProvider>{children}</MainContextProvider>
      </body>
    </html>
  );
}
