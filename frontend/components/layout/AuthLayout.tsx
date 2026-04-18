import { ReactNode } from "react";

interface AuthLayoutProps {
  children: ReactNode;
  title: string;
  subtitle?: string;
}

export function AuthLayout({ children, title, subtitle }: AuthLayoutProps) {
  return (
    <main className="min-h-dvh px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto grid min-h-[calc(100dvh-3rem)] w-full max-w-6xl overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-[0_30px_80px_-40px_rgba(15,23,42,0.35)] lg:grid-cols-2">
        {/* Left side - Branding */}
        <div className="hidden flex-col justify-between border-r border-slate-200 bg-[linear-gradient(180deg,#ffffff_0%,#f8fafc_100%)] p-12 lg:flex">
          <div>
            <p className="text-sm font-medium uppercase tracking-[0.35em] text-slate-500">
              Intara
            </p>
            <h1 className="mt-6 max-w-xl text-5xl font-semibold tracking-tight text-slate-950">
              {title}
            </h1>
            {subtitle && (
              <p className="mt-5 max-w-lg text-base leading-7 text-slate-600">
                {subtitle}
              </p>
            )}
          </div>
        </div>

        {/* Right side - Content */}
        <div className="flex items-center justify-center p-6 sm:p-10">
          {children}
        </div>
      </div>
    </main>
  );
}
