import { cn } from "@/lib/utils";
import { ReactNode } from "react";
import dynamic from "next/dynamic";

const LogoutButton = dynamic(() => import("./LogoutButton"), { ssr: false });

interface PageContainerProps {
  children: ReactNode;
  className?: string;
  maxWidth?: "sm" | "md" | "lg" | "xl" | "4xl" | "7xl" | "full";
  showLogout?: boolean;
}

const maxWidthClasses = {
  sm: "max-w-sm",
  md: "max-w-md",
  lg: "max-w-lg",
  xl: "max-w-xl",
  "4xl": "max-w-4xl",
  "7xl": "max-w-7xl",
  full: "w-full",
};

export function PageContainer({
  children,
  className,
  maxWidth = "4xl",
  showLogout = false,
}: PageContainerProps) {
  return (
    <main className={cn("min-h-dvh px-4 py-6 sm:px-6 lg:px-8", className)}>
      {showLogout && (
        <div className="fixed top-4 right-4 z-50 sm:top-5 sm:right-6">
          <LogoutButton />
        </div>
      )}
      <div
        className={cn(
          "mx-auto flex min-h-[calc(100dvh-3rem)] w-full flex-col items-center justify-center gap-6 py-8",
          maxWidthClasses[maxWidth]
        )}
      >
        {children}
      </div>
    </main>
  );
}
