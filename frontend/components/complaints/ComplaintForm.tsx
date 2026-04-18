"use client";

import { FormEvent, useState } from "react";
import { Textarea } from "@/components/ui/Textarea";
import { FormField } from "@/components/ui/FormField";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import type { Complaint } from "@/lib/state/ComplaintsManager";

interface ComplaintFormProps {
  onSubmit: (description: string) => Promise<Complaint>;
  isSubmitting: boolean;
}

export function ComplaintForm({ onSubmit, isSubmitting }: ComplaintFormProps) {
  const [description, setDescription] = useState("");
  const [formError, setFormError] = useState<string | null>(null);
  const [createdComplaint, setCreatedComplaint] = useState<Complaint | null>(null);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFormError(null);

    try {
      const complaint = await onSubmit(description);
      setCreatedComplaint(complaint);
      setDescription("");
    } catch (err: unknown) {
      setFormError(err instanceof Error ? err.message : "Failed to submit complaint");
    }
  };

  return (
    <Card variant="form" className="w-full lg:w-[60%]">
      <CardHeader>
        <CardTitle className="text-2xl">Complaint form</CardTitle>
        <CardDescription>
          Tell us what happened and we&apos;ll route it correctly.
        </CardDescription>
      </CardHeader>

      <CardContent>
        <form className="space-y-5" onSubmit={handleSubmit}>
          <FormField label="Description" required>
            <Textarea
              id="description"
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              placeholder="Describe the issue you want to report."
              required
            />
          </FormField>

          <button
            type="submit"
            disabled={isSubmitting}
            className="inline-flex h-11 w-full items-center justify-center rounded-full bg-slate-950 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {isSubmitting ? "Submitting..." : "Submit complaint"}
          </button>
        </form>

        {formError && (
          <div className="mt-6 rounded-3xl border border-rose-200 bg-rose-50 px-4 py-3 text-center">
            <p className="text-sm text-rose-700">{formError}</p>
          </div>
        )}

        {createdComplaint && (
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
        )}
      </CardContent>

      <CardFooter>
        <p className="text-sm text-slate-500">
          Need account access instead?{" "}
          <a href="/sign-in" className="font-medium text-slate-900">
            Sign in
          </a>
        </p>
      </CardFooter>
    </Card>
  );
}
