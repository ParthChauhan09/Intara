"use client";

import Link from "next/link";
import { useEffect, useState, type FormEvent } from "react";
import { useProtectedRoute } from "@/lib/useProtectedRoute";
import { observer } from "mobx-react-lite";
import { FullPageLoader } from "@/components/FullPageLoader";
import { useMainContext } from "@/lib/state/MainContext";
import type { Complaint } from "@/lib/state/ComplaintsManager";

function Home() {
  const { auth, complaints } = useMainContext();
  const [createdComplaint, setCreatedComplaint] = useState<Complaint | null>(null);
  const [description, setDescription] = useState("");
  const [formError, setFormError] = useState<string | null>(null);

  const { isReady, isAllowed } = useProtectedRoute("/sign-in");

  useEffect(() => {
    if (auth.accessToken) {
      complaints.fetchComplaints(auth.accessToken);
    }
  }, [auth.accessToken]);

  if (!isReady) return <FullPageLoader label="Checking session..." />;
  if (!isAllowed) return <FullPageLoader label="Redirecting..." />;

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFormError(null);

    if (!auth.accessToken) {
      setFormError("You must be signed in to submit a complaint.");
      return;
    }

    try {
      const complaint = await complaints.createComplaint(auth.accessToken, {
        description
      });

      setCreatedComplaint(complaint);
      setDescription("");
    } catch (err: unknown) {
      setFormError(err instanceof Error ? err.message : "Failed to submit complaint");
    }
  };

  return (
    <main className="min-h-dvh px-4 py-6 sm:px-6 lg:px-8">
      <section className="mx-auto flex min-h-[calc(100dvh-3rem)] w-full max-w-4xl flex-col items-center justify-center gap-6 py-8">
        <div className="w-full rounded-[2rem] border border-slate-200 bg-white px-6 py-10 text-center shadow-[0_30px_80px_-40px_rgba(15,23,42,0.35)] sm:px-10 sm:py-12">
          <p className="text-sm font-medium uppercase tracking-[0.35em] text-slate-500">
            Intara Support
          </p>
          <blockquote className="mx-auto mt-6 max-w-3xl text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl lg:text-5xl">
            {'"'}One clear place to raise a complaint, share context, and get
            routed to the right team.{'"'}
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
                htmlFor="description"
                className="text-sm font-medium leading-none text-slate-700"
              >
                Description
              </label>
              <textarea
                id="description"
                rows={5}
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                placeholder="Describe the issue you want to report."
                className="w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-950 outline-none ring-offset-white placeholder:text-slate-400 focus:border-slate-300 focus:bg-white focus:ring-2 focus:ring-slate-900/10"
                required
              />
            </div>

            <button
              type="submit"
              disabled={complaints.isCreating}
              className="inline-flex h-11 w-full items-center justify-center rounded-full bg-slate-950 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {complaints.isCreating ? "Submitting..." : "Submit complaint"}
            </button>
          </form>

          {formError ? (
            <div className="mt-6 rounded-3xl border border-rose-200 bg-rose-50 px-4 py-3 text-center">
              <p className="text-sm text-rose-700">{formError}</p>
            </div>
          ) : null}

          {createdComplaint ? (
            <div className="mt-6 rounded-3xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-center">
              <p className="text-xs uppercase tracking-[0.3em] text-emerald-700">
                Complaint Created
              </p>
              <p className="mt-2 text-lg font-semibold text-emerald-950">
                {createdComplaint.id}
              </p>
              <p className="mt-1 text-sm text-emerald-700">
                Status: {createdComplaint.status}
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

        {complaints.complaints.length > 0 ? (
          <div className="w-full rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-[0_20px_50px_-30px_rgba(15,23,42,0.35)] sm:p-8">
            <div className="space-y-2 text-center">
              <h2 className="text-2xl font-semibold tracking-tight text-slate-950">
                Your Complaints
              </h2>
              <p className="text-sm text-slate-500">
                Track the status of your submitted complaints.
              </p>
            </div>

            <div className="mt-8 space-y-4">
              {complaints.complaints.map((complaint) => (
                <div
                  key={complaint.id}
                  className="rounded-2xl border border-slate-200 bg-slate-50 p-4"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-slate-900">
                        {complaint.description}
                      </p>
                      <div className="mt-2 flex flex-wrap items-center gap-2">
                        <span className="rounded-full bg-slate-200 px-2 py-1 text-xs font-medium text-slate-700">
                          {complaint.category}
                        </span>
                        <span
                          className={`rounded-full px-2 py-1 text-xs font-medium ${
                            complaint.priority === "Urgent" || complaint.priority === "High"
                              ? "bg-rose-100 text-rose-700"
                              : complaint.priority === "Medium"
                                ? "bg-amber-100 text-amber-700"
                                : "bg-emerald-100 text-emerald-700"
                          }`}
                        >
                          {complaint.priority}
                        </span>
                      </div>
                    </div>
                    <span
                      className={`shrink-0 rounded-full px-3 py-1 text-xs font-medium ${
                        complaint.status === "OPEN"
                          ? "bg-blue-100 text-blue-700"
                          : complaint.status === "PENDING"
                            ? "bg-amber-100 text-amber-700"
                            : complaint.status === "REVIEWED"
                              ? "bg-purple-100 text-purple-700"
                              : complaint.status === "ESCALATED"
                                ? "bg-rose-100 text-rose-700"
                                : "bg-emerald-100 text-emerald-700"
                      }`}
                    >
                      {complaint.status}
                    </span>
                  </div>
                  <p className="mt-2 text-xs text-slate-500">
                    ID: {complaint.id}
                  </p>
                </div>
              ))}
            </div>
          </div>
        ) : null}
      </section>
    </main>
  );
}

export default observer(Home);
