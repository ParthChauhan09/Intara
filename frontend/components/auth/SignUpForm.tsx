"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { Input } from "@/components/ui/Input";
import { FormField } from "@/components/ui/FormField";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/Card";

interface SignUpFormProps {
  onSubmit: (name: string, email: string, password: string) => Promise<void>;
  isSubmitting: boolean;
}

export function SignUpForm({ onSubmit, isSubmitting }: SignUpFormProps) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

    try {
      await onSubmit(name, email, password);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Sign-up failed");
    }
  };

  return (
    <Card variant="form" className="w-full max-w-md">
      <CardHeader>
        <CardTitle className="text-xl sm:text-2xl">Create an account</CardTitle>
        <CardDescription>
          Enter your details to get started.
        </CardDescription>
      </CardHeader>

      <CardContent>
        <form
          className="space-y-4 sm:space-y-5"
          onSubmit={handleSubmit}
        >
          <FormField label="Full name" required>
            <Input
              id="name"
              type="text"
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="Jane Doe"
              required
              className="h-10"
            />
          </FormField>

          <FormField label="Email" required>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="name@example.com"
              required
              className="h-10"
            />
          </FormField>

          <FormField label="Password" required>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="••••••••"
              required
              className="h-10"
            />
          </FormField>

          <FormField label="Confirm password" required>
            <Input
              id="confirm-password"
              type="password"
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              placeholder="••••••••"
              required
              className="h-10"
            />
          </FormField>

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

        {error && (
          <p className="mt-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            {error}
          </p>
        )}
      </CardContent>

      <CardFooter>
        <p className="text-sm text-slate-500">
          Already have an account?{" "}
          <Link href="/sign-in" className="font-medium text-slate-900">
            Sign in
          </Link>
        </p>
      </CardFooter>
    </Card>
  );
}
