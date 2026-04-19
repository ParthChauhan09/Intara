"use client";

import { FormEvent, useState } from "react";
import { Textarea } from "@/components/ui/Textarea";
import { FormField } from "@/components/ui/FormField";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import type { Complaint } from "@/lib/state/ComplaintsManager";

interface ComplaintFormProps {
  onSubmit: (description: string) => Promise<Complaint>;
  onSubmitAudio?: (file: File) => Promise<Complaint>;
  isSubmitting: boolean;
}

export function ComplaintForm({ onSubmit, onSubmitAudio, isSubmitting }: ComplaintFormProps) {
  const [mode, setMode] = useState<"text" | "audio">("text");
  const [description, setDescription] = useState("");
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [createdComplaint, setCreatedComplaint] = useState<Complaint | null>(null);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFormError(null);

    try {
      let complaint: Complaint;
      if (mode === "audio" && audioFile && onSubmitAudio) {
        complaint = await onSubmitAudio(audioFile);
        setAudioFile(null);
      } else {
        complaint = await onSubmit(description);
        setDescription("");
      }
      setCreatedComplaint(complaint);
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
          {onSubmitAudio && (
            <div className="flex bg-slate-100 p-1 rounded-lg w-fit">
              <button
                type="button"
                onClick={() => setMode("text")}
                className={`text-sm px-4 py-1.5 rounded-md transition-colors ${
                  mode === "text" ? "bg-white font-medium shadow-sm text-slate-900" : "text-slate-500 hover:text-slate-900"
                }`}
              >
                Text
              </button>
              <button
                type="button"
                onClick={() => setMode("audio")}
                className={`text-sm px-4 py-1.5 rounded-md transition-colors ${
                  mode === "audio" ? "bg-white font-medium shadow-sm text-slate-900" : "text-slate-500 hover:text-slate-900"
                }`}
              >
                Audio
              </button>
            </div>
          )}

          {mode === "text" ? (
            <FormField label="Description" required>
              <Textarea
                id="description"
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                placeholder="Describe the issue you want to report."
                required
              />
            </FormField>
          ) : (
            <FormField label="Audio Recording" required>
              <div className="flex items-center justify-center w-full">
                <label
                  htmlFor="dropzone-file"
                  className="flex flex-col items-center justify-center w-full h-32 border-2 border-slate-300 border-dashed rounded-xl cursor-pointer bg-slate-50 hover:bg-slate-100 transition"
                >
                  <div className="flex flex-col items-center justify-center pt-5 pb-6 text-slate-500">
                    <svg className="w-8 h-8 mb-3" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 20 16">
                      <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 13h3a3 3 0 0 0 0-6h-.025A5.56 5.56 0 0 0 16 6.5 5.5 5.5 0 0 0 5.207 5.021C5.137 5.017 5.071 5 5 5a4 4 0 0 0 0 8h2.167M10 15V6m0 0L8 8m2-2 2 2"/>
                    </svg>
                    {audioFile ? (
                      <p className="text-sm font-semibold text-slate-800">{audioFile.name}</p>
                    ) : (
                      <>
                        <p className="text-sm font-semibold"><span className="font-bold">Click to upload</span> audio</p>
                        <p className="text-xs mt-1">MP3, WAV, or M4A</p>
                      </>
                    )}
                  </div>
                  <input
                    id="dropzone-file"
                    type="file"
                    accept=".mp3,audio/mpeg,.wav,audio/wav,audio/x-wav,.m4a,audio/mp4,audio/x-m4a"
                    className="hidden"
                    required
                    onChange={(e) => setAudioFile(e.target.files?.[0] ?? null)}
                  />
                </label>
              </div>
            </FormField>
          )}

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
    </Card>
  );
}
