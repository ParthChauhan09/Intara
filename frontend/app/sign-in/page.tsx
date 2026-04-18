import Link from "next/link";

export default function SignInPage() {
  return (
    <main className="min-h-dvh px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto grid min-h-[calc(100dvh-3rem)] w-full max-w-6xl overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-[0_30px_80px_-40px_rgba(15,23,42,0.35)] lg:grid-cols-2">
        <div className="hidden flex-col justify-between border-r border-slate-200 bg-[linear-gradient(180deg,#ffffff_0%,#f8fafc_100%)] p-12 lg:flex">
          <div>
            <p className="text-sm font-medium uppercase tracking-[0.35em] text-slate-500">
              Intara
            </p>
            <h1 className="mt-6 max-w-xl text-5xl font-semibold tracking-tight text-slate-950">
              Sign in to continue
            </h1>
            <p className="mt-5 max-w-lg text-base leading-7 text-slate-600">
              Keep the default shadcn/ui structure and customize the fields or
              actions later as your auth flow grows.
            </p>
          </div>
        </div>

        <div className="flex items-center justify-center p-6 sm:p-10">
          <div className="w-full max-w-md rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-[0_20px_50px_-30px_rgba(15,23,42,0.35)] sm:p-8">
            <div className="space-y-2 text-center">
              <h2 className="text-2xl font-semibold tracking-tight text-slate-950">
                Welcome back
              </h2>
              <p className="text-sm text-slate-500">
                Sign in with your email and password.
              </p>
            </div>

            <form className="mt-8 space-y-5">
              <div className="space-y-2">
                <label
                  htmlFor="email"
                  className="text-sm font-medium leading-none text-slate-700"
                >
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  placeholder="name@example.com"
                  className="flex h-11 w-full rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-sm text-slate-950 outline-none ring-offset-white placeholder:text-slate-400 focus:border-slate-300 focus:bg-white focus:ring-2 focus:ring-slate-900/10"
                />
              </div>

              <div className="space-y-2">
                <label
                  htmlFor="password"
                  className="text-sm font-medium leading-none text-slate-700"
                >
                  Password
                </label>
                <input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  className="flex h-11 w-full rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-sm text-slate-950 outline-none ring-offset-white placeholder:text-slate-400 focus:border-slate-300 focus:bg-white focus:ring-2 focus:ring-slate-900/10"
                />
              </div>

              <div className="flex items-center justify-between gap-4">
                <label className="flex items-center gap-2 text-sm text-slate-600">
                  <input
                    type="checkbox"
                    className="h-4 w-4 rounded border-slate-300 text-slate-950 focus:ring-slate-900/10"
                  />
                  Remember me
                </label>
                <Link
                  href="/sign-in"
                  className="text-sm font-medium text-slate-700 transition hover:text-slate-950"
                >
                  Forgot password?
                </Link>
              </div>

              <button
                type="submit"
                className="inline-flex h-11 w-full items-center justify-center rounded-full bg-slate-950 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-800"
              >
                Sign in
              </button>
            </form>

            <p className="mt-6 text-center text-sm text-slate-500">
              Don&apos;t have an account?{" "}
              <Link href="/sign-up" className="font-medium text-slate-900">
                Sign up
              </Link>
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
