"use client";

import { Card } from "@/components/ui/Card";
import { Logo } from "@/components/layout/Logo";

export function HeroSection() {
  return (
    <Card variant="hero" className="w-full">
      <Logo size="lg" className="justify-center sm:justify-start" />
      <blockquote className="mx-auto mt-8 max-w-3xl text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl lg:text-5xl">
        {"\""}One clear place to raise a complaint, share context, and get
        routed to the right team.{"\""}
      </blockquote>
      <p className="mx-auto mt-5 max-w-2xl text-base leading-7 text-slate-600">
        Keep the front end simple for now. The backend can classify,
        prioritize, and route complaints after this intake screen collects
        the right details.
      </p>
    </Card>
  );
}
