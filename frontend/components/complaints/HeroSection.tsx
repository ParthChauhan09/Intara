"use client";

import { Card } from "@/components/ui/Card";

export function HeroSection() {
  return (
    <Card variant="hero" className="w-full">
      <p className="text-sm font-medium uppercase tracking-[0.35em] text-slate-500">
        Intara Support
      </p>
      <blockquote className="mx-auto mt-6 max-w-3xl text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl lg:text-5xl">
        {"\""}One clear place to raise a complaint, share context, and get
        routed to the right team.{"\""}
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
    </Card>
  );
}
