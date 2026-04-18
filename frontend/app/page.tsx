"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";

export default function Home() {
  const [complaintId, setComplaintId] = useState<string | null>(null);
  const [email, setEmail] = useState("");
  const [complaint, setComplaint] = useState("");

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const generatedId = `CMP-${Date.now().toString(36).toUpperCase()}-${Math.floor(
      Math.random() * 9000 + 1000
    )}`;

    setComplaintId(generatedId);
    setEmail("");
    setComplaint("");
  };

  return (
    <main className="min-h-dvh px-4 py-6 sm:px-6 lg:px-8">
      <section className="mx-auto flex min-h-[calc(100dvh-3rem)] w-full max-w-4xl flex-col items-center justify-center gap-6">
        <div className="w-full rounded-[2rem] border border-slate-200 bg-white px-6 py-10 text-center shadow-[0_30px_80px_-40px_rgba(15,23,42,0.35)] sm:px-10 sm:py-12">
          <p className="text-sm font-medium uppercase tracking-[0.35em] text-slate-500">
            Intara Support
          </p>
          <blockquote className="mx-auto mt-6 max-w-3xl text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl lg:text-5xl">
            {"\""}One clear place to raise a complaint, share context, and get routed
            to the right team.{"\""}
          </blockquote>
          <p className="mx-auto mt-5 max-w-2xl text-base leading-7 text-slate-600">
            Keep the front end simple for now. The backend can classify,
            prioritize, and route complaints after this intake screen collects
            the right details.
          </p>
          <div className="mt-8 grid gap-3 sm:grid-cols-2">
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-xs uppercase tracking-[0.3em] text-slate-500">
                Intake
              </p>
              <p className="mt-2 text-lg font-semibold text-slate-950">
                Complaint first
              </p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-xs uppercase tracking-[0.3em] text-slate-500">
                Review
              </p>
              <p className="mt-2 text-lg font-semibold text-slate-950">
                Manual and backend
              </p>
            </div>
          </div>
        </div>

        <div className="w-full rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-[0_20px_50px_-30px_rgba(15,23,42,0.35)] sm:p-8 lg:w-[60%]">
          <div className="space-y-2 text-center">
            <h2 className="text-2xl font-semibold tracking-tight text-slate-950">
              Complaint form
            </h2>
            <p className="text-sm text-slate-500">
              Tell us what happened and we&apos;ll route it correctly.
            </p>
          </div>

          <form className="mt-8 space-y-5" onSubmit={handleSubmit}>
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
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="name@example.com"
                className="flex h-11 w-full rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-sm text-slate-950 outline-none ring-offset-white placeholder:text-slate-400 focus:border-slate-300 focus:bg-white focus:ring-2 focus:ring-slate-900/10"
                required
              />
            </div>

            <div className="space-y-2">
              <label
                htmlFor="complaint"
                className="text-sm font-medium leading-none text-slate-700"
              >
                Complaint
              </label>
              <textarea
                id="complaint"
                rows={5}
                value={complaint}
                onChange={(event) => setComplaint(event.target.value)}
                placeholder="Describe the issue you want to report."
                className="w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-950 outline-none ring-offset-white placeholder:text-slate-400 focus:border-slate-300 focus:bg-white focus:ring-2 focus:ring-slate-900/10"
                required
              />
            </div>

            <button
              type="submit"
              className="inline-flex h-11 w-full items-center justify-center rounded-full bg-slate-950 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-800"
            >
              Submit complaint
            </button>
          </form>

          {complaintId ? (
            <div className="mt-6 rounded-3xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-center">
              <p className="text-xs uppercase tracking-[0.3em] text-emerald-700">
                Complaint ID
              </p>
              <p className="mt-2 text-lg font-semibold text-emerald-950">
                {complaintId}
              </p>
            </div>
          ) : null}

          <p className="mt-6 text-center text-sm text-slate-500">
            Need account access instead?{" "}
            <Link href="/sign-in" className="font-medium text-slate-900">
              Sign in
            </Link>
          </p>
        </div>
      </section>
    </main>
  );
}
