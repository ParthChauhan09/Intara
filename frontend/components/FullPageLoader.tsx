type FullPageLoaderProps = {
  label?: string;
};

export function FullPageLoader({ label = "Loading..." }: FullPageLoaderProps) {
  return (
    <main className="min-h-dvh px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto flex min-h-[calc(100dvh-3rem)] w-full max-w-4xl items-center justify-center rounded-[2rem] border border-slate-200 bg-white shadow-[0_30px_80px_-40px_rgba(15,23,42,0.35)]">
        <div className="flex items-center gap-3 text-sm text-slate-600">
          <span className="h-4 w-4 animate-spin rounded-full border-2 border-slate-300 border-t-slate-900" />
          <span>{label}</span>
        </div>
      </div>
    </main>
  );
}

