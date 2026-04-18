import type { Request, Response } from "express";
import { createSupabaseUserClient } from "../supabase.ts";
import { isComplaintStatus, type ComplaintStatus } from "../models/Complaint.ts";
import type { ErrorWithCause } from "../types/types.ts";

type CreateComplaintBody = {
  description?: string;
  category?: string;
  priority?: string;
  slaDeadline?: string | null;
};

type UpdateComplaintStatusBody = {
  id?: string;
  status?: ComplaintStatus;
  recommendation?: string | null;
  slaDeadline?: string | null;
};

const complaintSelect =
  "id,userId:user_id,description,category,priority,recommendation,status,slaDeadline:sla_deadline,createdAt:created_at";

export class ComplaintController {
  private constructor() {}

  private static getErrorDetails(err: unknown) {
    const isProd = process.env.NODE_ENV === "production";
    if (isProd) return undefined;

    const error = err as ErrorWithCause;
    return {
      message: error?.message,
      cause: error?.cause
        ? {
            name: error.cause.name,
            message: error.cause.message,
            code: error.cause.code
          }
        : undefined
    };
  }

  private static getErrorMessage(err: unknown, fallback: string): string {
    return err instanceof Error ? err.message : fallback;
  }

  static async list(req: Request, res: Response) {
    if (!req.accessToken) return res.status(401).json({ error: "Missing access token" });

    try {
      const supabase = createSupabaseUserClient(req.accessToken);
      const { data, error } = await supabase
        .from("complaints")
        .select(complaintSelect)
        .order("created_at", { ascending: false });
      if (error) return res.status(400).json({ error: error.message });
      return res.json({ complaints: data || [] });
    } catch (err: unknown) {
      return res.status(502).json({
        error: ComplaintController.getErrorMessage(err, "Failed to fetch complaints"),
        details: ComplaintController.getErrorDetails(err)
      });
    }
  }

  static async create(req: Request<{}, {}, CreateComplaintBody>, res: Response) {
    if (!req.user || !req.accessToken) return res.status(401).json({ error: "Missing authenticated user" });

    const { description, category, priority, slaDeadline } = req.body || {};
    if (!description) return res.status(400).json({ error: "description is required" });
    if (!category) return res.status(400).json({ error: "category is required" });
    if (!priority) return res.status(400).json({ error: "priority is required" });

    try {
      const supabase = createSupabaseUserClient(req.accessToken);
      const { data, error } = await supabase
        .from("complaints")
        .insert({
          user_id: req.user.id,
          description,
          category,
          priority,
          sla_deadline: slaDeadline ?? null
        })
        .select(complaintSelect)
        .single();
      if (error) return res.status(400).json({ error: error.message });
      return res.status(201).json({ complaint: data });
    } catch (err: unknown) {
      return res.status(502).json({
        error: ComplaintController.getErrorMessage(err, "Failed to create complaint"),
        details: ComplaintController.getErrorDetails(err)
      });
    }
  }

  static async updateStatus(req: Request<{}, {}, UpdateComplaintStatusBody>, res: Response) {
    if (!req.user || !req.accessToken) return res.status(401).json({ error: "Missing authenticated user" });

    const { id, status } = req.body || {};
    if (!id) return res.status(400).json({ error: "id is required" });
    if (!isComplaintStatus(status)) {
      return res.status(400).json({ error: "status must be one of OPEN, PENDING, REVIEWED, ESCALATED, CLOSED" });
    }

    const patch: Record<string, unknown> = { status };
    if ("recommendation" in (req.body || {})) {
      patch.recommendation = req.body.recommendation ?? null;
    }
    if ("slaDeadline" in (req.body || {})) {
      patch.sla_deadline = req.body.slaDeadline ?? null;
    }

    try {
      const supabase = createSupabaseUserClient(req.accessToken);
      const { data, error } = await supabase
        .from("complaints")
        .update(patch)
        .eq("id", id)
        .eq("user_id", req.user.id)
        .select(complaintSelect)
        .single();
      if (error) return res.status(400).json({ error: error.message });
      return res.json({ complaint: data });
    } catch (err: unknown) {
      return res.status(502).json({
        error: ComplaintController.getErrorMessage(err, "Failed to update complaint"),
        details: ComplaintController.getErrorDetails(err)
      });
    }
  }
}

