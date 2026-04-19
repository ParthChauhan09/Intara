"use client";

import { useRouter } from "next/navigation";

export default function NotFound() {
  const router = useRouter();

  return (
    <div className="min-h-screen w-full bg-white flex items-center justify-center px-6">
      {/* Background blobs */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden -z-10">
        <div className="absolute -top-40 -left-40 h-[520px] w-[520px] rounded-full bg-slate-100 opacity-70 animate-[drift_14s_ease-in-out_infinite_alternate]" />
        <div className="absolute -bottom-40 -right-40 h-[620px] w-[620px] rounded-full bg-slate-100 opacity-50 animate-[drift_18s_ease-in-out_infinite_alternate-reverse]" />
      </div>

      <div className="relative z-10 flex flex-col items-center text-center max-w-md w-full animate-[fadeUp_0.6s_ease-out_both]">

        {/* 404 */}
        <span className="text-[10rem] sm:text-[12rem] font-black tracking-tighter text-slate-950 leading-none select-none animate-[subtlePulse_4s_ease-in-out_infinite]">
          404
        </span>

        {/* Animated underline */}
        <span className="block h-1.5 w-24 rounded-full bg-slate-950 mb-8 animate-[expandLine_0.7s_cubic-bezier(0.4,0,0.2,1)_0.3s_both]" />

        <h1 className="text-2xl sm:text-3xl font-bold text-slate-950 tracking-tight mb-3">
          Page not found
        </h1>
        <p className="text-slate-500 text-base leading-relaxed mb-10">
          The page you're looking for doesn't exist or has been moved.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 w-full">
          <button
            type="button"
            onClick={() => router.back()}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-2xl border border-slate-200 bg-white text-sm font-semibold text-slate-700 hover:bg-slate-50 hover:border-slate-300 transition-all duration-200 active:scale-95"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15 18 9 12 15 6"/>
            </svg>
            Go back
          </button>
          <button
            type="button"
            onClick={() => router.push("/")}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-2xl bg-slate-950 text-sm font-semibold text-white hover:bg-slate-800 transition-all duration-200 active:scale-95"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>
            </svg>
            Go home
          </button>
        </div>
      </div>

      <style>{`
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(28px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes drift {
          from { transform: translate(0, 0) scale(1); }
          to   { transform: translate(28px, 18px) scale(1.06); }
        }
        @keyframes subtlePulse {
          0%, 100% { opacity: 1; }
          50%       { opacity: 0.75; }
        }
        @keyframes expandLine {
          from { transform: scaleX(0); }
          to   { transform: scaleX(1); }
        }
      `}</style>
    </div>
  );
}
