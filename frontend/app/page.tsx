import Link from "next/link";

export default function Home() {
  return (
    <main className="min-h-screen px-4 py-6 sm:px-6 lg:px-8">
      <section className="mx-auto flex min-h-[calc(100vh-3rem)] w-full max-w-6xl flex-col overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-[0_30px_80px_-40px_rgba(15,23,42,0.35)] md:grid md:grid-cols-2">
        <div className="flex flex-col justify-between gap-10 p-8 sm:p-10 lg:p-14">
          <div>
            <p className="text-sm font-medium uppercase tracking-[0.35em] text-slate-500">
              Intara
            </p>
            <h1 className="mt-6 max-w-xl text-4xl font-semibold tracking-tight text-slate-950 sm:text-5xl lg:text-6xl">
              A refined entry point for your app.
            </h1>
            <p className="mt-5 max-w-lg text-base leading-7 text-slate-600 sm:text-lg">
              Use these pages as the starting point for your shadcn/ui sign-in
              and sign-up flow. They are mobile-friendly, minimal, and easy to
              extend.
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <Link
              href="/sign-in"
              className="inline-flex items-center justify-center rounded-full bg-slate-950 px-5 py-3 text-sm font-medium text-white transition hover:bg-slate-800"
            >
              Sign in
            </Link>
            <Link
              href="/sign-up"
              className="inline-flex items-center justify-center rounded-full border border-slate-300 px-5 py-3 text-sm font-medium text-slate-900 transition hover:bg-slate-100"
            >
              Sign up
            </Link>
          </div>
        </div>

        <div className="border-t border-slate-200 bg-[linear-gradient(180deg,#fafafa_0%,#f1f5f9_100%)] p-8 sm:p-10 lg:border-l lg:border-t-0 lg:p-14">
          <div className="grid h-full content-center gap-4 rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-[0_20px_50px_-35px_rgba(15,23,42,0.25)] sm:p-8">
            <div className="space-y-2">
              <p className="text-sm uppercase tracking-[0.3em] text-slate-500">
                Default shadcn/ui
              </p>
              <h2 className="text-2xl font-semibold text-slate-950">
                Ready for your auth screens
              </h2>
            </div>
            <p className="max-w-md text-sm leading-6 text-slate-600">
              The sign-in and sign-up pages use the typical shadcn card, input,
              label, checkbox, and button layout so you can install the
              components and drop them in without extra styling work.
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}
