"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { useMainContext } from "@/lib/state/MainContext";
import { observer } from "mobx-react-lite";
import { FullPageLoader } from "@/components/FullPageLoader";
import { useGuestOnlyRoute } from "@/lib/useGuestOnlyRoute";

function SignUpPage() {
  const router = useRouter();
  const { auth } = useMainContext();
  const { isReady, isAllowed } = useGuestOnlyRoute("/");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isReady) {
    return <FullPageLoader label="Loading..." />;
  }

  if (!isAllowed) {
    return <FullPageLoader label="Redirecting..." />;
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    if (!acceptedTerms) {
      setError("Please accept the terms to continue.");
      return;
    }

    setIsSubmitting(true);

    try {
      await auth.signUp(name, email, password);

      router.push("/sign-in");
      router.refresh();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Sign-up failed");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="h-dvh overflow-hidden px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto grid h-[calc(100dvh-3rem)] w-full max-w-6xl overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-[0_30px_80px_-40px_rgba(15,23,42,0.35)] lg:grid-cols-2">
        <div className="hidden flex-col justify-between border-r border-slate-200 bg-[linear-gradient(180deg,#ffffff_0%,#f8fafc_100%)] p-12 lg:flex">
          <div>
            <p className="text-sm font-medium uppercase tracking-[0.35em] text-slate-500">
              Intara
            </p>
            <h1 className="mt-6 max-w-xl text-5xl font-semibold tracking-tight text-slate-950">
              Create your account
            </h1>
            <p className="mt-5 max-w-lg text-base leading-7 text-slate-600">
              This sign-up page mirrors the default shadcn/ui form layout so it
              feels familiar when you install the components.
            </p>
          </div>
        </div>

        <div className="flex min-h-0 items-center justify-center p-5 sm:p-8 lg:p-10">
          <div className="w-full max-w-md rounded-[1.75rem] border border-slate-200 bg-white p-5 shadow-[0_20px_50px_-30px_rgba(15,23,42,0.35)] sm:p-6">
            <div className="space-y-1.5 text-center">
              <h2 className="text-xl font-semibold tracking-tight text-slate-950 sm:text-2xl">
                Create an account
              </h2>
              <p className="text-xs text-slate-500 sm:text-sm">
                Enter your details to get started.
              </p>
            </div>

            <form
              className="mt-5 space-y-4 sm:mt-6 sm:space-y-5"
              onSubmit={handleSubmit}
            >
              <div className="space-y-1.5">
                <label
                  htmlFor="name"
                  className="text-sm font-medium leading-none text-slate-700"
                >
                  Full name
                </label>
                <input
                  id="name"
                  type="text"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  placeholder="Jane Doe"
                  className="flex h-10 w-full rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-sm text-slate-950 outline-none ring-offset-white placeholder:text-slate-400 focus:border-slate-300 focus:bg-white focus:ring-2 focus:ring-slate-900/10"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label
                  htmlFor="email"
                  className="text-sm font-medium leading-none text-slate-700"
                >
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="name@example.com"
                  className="flex h-10 w-full rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-sm text-slate-950 outline-none ring-offset-white placeholder:text-slate-400 focus:border-slate-300 focus:bg-white focus:ring-2 focus:ring-slate-900/10"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label
                  htmlFor="password"
                  className="text-sm font-medium leading-none text-slate-700"
                >
                  Password
                </label>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="••••••••"
                  className="flex h-10 w-full rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-sm text-slate-950 outline-none ring-offset-white placeholder:text-slate-400 focus:border-slate-300 focus:bg-white focus:ring-2 focus:ring-slate-900/10"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label
                  htmlFor="confirm-password"
                  className="text-sm font-medium leading-none text-slate-700"
                >
                  Confirm password
                </label>
                <input
                  id="confirm-password"
                  type="password"
                  value={confirmPassword}
                  onChange={(event) => setConfirmPassword(event.target.value)}
                  placeholder="••••••••"
                  className="flex h-10 w-full rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-sm text-slate-950 outline-none ring-offset-white placeholder:text-slate-400 focus:border-slate-300 focus:bg-white focus:ring-2 focus:ring-slate-900/10"
                  required
                />
              </div>

              <div className="flex items-start gap-2 text-sm text-slate-600">
                <input
                  id="terms"
                  type="checkbox"
                  checked={acceptedTerms}
                  onChange={(event) => setAcceptedTerms(event.target.checked)}
                  className="mt-1 h-4 w-4 rounded border-slate-300 text-slate-950 focus:ring-slate-900/10"
                />
                <label htmlFor="terms" className="leading-6">
                  I agree to the terms and privacy policy.
                </label>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="inline-flex h-10 w-full items-center justify-center rounded-full bg-slate-950 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-70"
              >
                {isSubmitting ? "Creating..." : "Create account"}
              </button>
            </form>

            {error ? (
              <p className="mt-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                {error}
              </p>
            ) : null}

            <p className="mt-4 text-center text-sm text-slate-500 sm:mt-5">
              Already have an account?{" "}
              <Link href="/sign-in" className="font-medium text-slate-900">
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}

export default observer(SignUpPage);
