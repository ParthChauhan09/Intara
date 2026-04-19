import type { Request, Response } from "express";
import { createSupabaseUserClient } from "../supabase.ts";
import { Category, Priority, Status, isComplaintCategory, isComplaintPriority, isComplaintStatus, type ComplaintStatus, type ComplaintCategory, type ComplaintPriority } from "../models/Complaint.ts";
import type { ErrorWithCause } from "../types/types.ts";
import { ComplaintAIService } from "../services/ai/ComplaintAIService.ts";
import fs from "node:fs";
import path from "node:path";
import { transcribeAudio } from "../services/audio/transcriber.ts";
type CreateComplaintBody = {
  description?: string;
  category?: ComplaintCategory;
  priority?: ComplaintPriority;
  slaDeadline?: string | null;
};

type UpdateComplaintStatusBody = {
  id?: string;
  status?: ComplaintStatus;
  recommendation?: string[];
  slaDeadline?: string | null;
};

const complaintSelectAdmin =
  "id,userId:user_id,description,category,priority,recommendation,status,slaDeadline:sla_deadline,resolvedAt:resolved_at,createdAt:created_at";

// Regular users do not see category, priority, or recommendation
const complaintSelectUser =
  "id,userId:user_id,description,status,slaDeadline:sla_deadline,resolvedAt:resolved_at,createdAt:created_at";

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
        .select(complaintSelectUser)
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

    let finalCategory = isComplaintCategory(category) ? category : Category.Product;
    let finalPriority = isComplaintPriority(priority) ? priority : Priority.Medium;
    let recommendation: string[] | null = null;

    try {
      const aiResult = await ComplaintAIService.process(
        description,
        Object.values(Category),
        Object.values(Priority),
        { groqApiKey: process.env.GROQ_API_KEY, geminiApiKey: process.env.GEMINI_API_KEY }
      );
      
      if (aiResult.status === 'Success' || aiResult.status === 'Needs Review') {
        if (!category && aiResult.category && isComplaintCategory(aiResult.category)) {
          finalCategory = aiResult.category;
        }
        if (!priority && aiResult.priority && isComplaintPriority(aiResult.priority)) {
          finalPriority = aiResult.priority;
        }
        if (aiResult.recommended_actions && aiResult.recommended_actions.length > 0) {
          recommendation = aiResult.recommended_actions;
        }
      }
    } catch (err) {
      console.error("AI service error:", err);
    }

    const slaHours = finalPriority === Priority.High ? 12 : finalPriority === Priority.Medium ? 24 : 48;
    const computedSlaDeadline = new Date(Date.now() + slaHours * 60 * 60 * 1000).toISOString();

    try {
      const supabase = createSupabaseUserClient(req.accessToken);
      const { data, error } = await supabase
        .from("complaints")
        .insert({
          user_id: req.user.id,
          description,
          category: finalCategory,
          priority: finalPriority,
          recommendation,
          sla_deadline: slaDeadline ?? computedSlaDeadline
        })
        .select(complaintSelectUser)
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

  static async createFromAudio(req: Request, res: Response) {
    if (!req.user || !req.accessToken) return res.status(401).json({ error: "Missing authenticated user" });

    const file = req.file;
    if (!file) return res.status(400).json({ error: "No audio file uploaded." });

    const ext = path.extname(file.originalname).toLowerCase() || '.mp3';
    const renamedPath = `${file.path}${ext}`;
    fs.renameSync(file.path, renamedPath);

    try {
      const transcript = await transcribeAudio(renamedPath);
      
      let finalCategory: ComplaintCategory = Category.Product;
      let finalPriority: ComplaintPriority = Priority.Medium;
      let recommendation: string[] | null = null;

      try {
        const aiResult = await ComplaintAIService.process(
          transcript,
          Object.values(Category),
          Object.values(Priority),
          { groqApiKey: process.env.GROQ_API_KEY, geminiApiKey: process.env.GEMINI_API_KEY }
        );
        
        if (aiResult.status === 'Success' || aiResult.status === 'Needs Review') {
          if (aiResult.category && isComplaintCategory(aiResult.category)) {
            finalCategory = aiResult.category;
          }
          if (aiResult.priority && isComplaintPriority(aiResult.priority)) {
            finalPriority = aiResult.priority;
          }
          if (aiResult.recommended_actions && aiResult.recommended_actions.length > 0) {
            recommendation = aiResult.recommended_actions;
          }
        }
      } catch (err) {
        console.error("AI service error:", err);
      }

      const slaHours = finalPriority === Priority.High ? 12 : finalPriority === Priority.Medium ? 24 : 48;
      const computedSlaDeadline = new Date(Date.now() + slaHours * 60 * 60 * 1000).toISOString();

      const supabase = createSupabaseUserClient(req.accessToken);
      const { data, error } = await supabase
        .from("complaints")
        .insert({
          user_id: req.user.id,
          description: transcript,
          category: finalCategory,
          priority: finalPriority,
          recommendation,
          sla_deadline: computedSlaDeadline
        })
        .select(complaintSelectUser)
        .single();
      
      if (error) return res.status(400).json({ error: error.message });
      return res.status(201).json({ complaint: data, transcript });
    } catch (err: unknown) {
      return res.status(502).json({
        error: ComplaintController.getErrorMessage(err, "Failed to process audio complaint"),
        details: ComplaintController.getErrorDetails(err)
      });
    } finally {
      if (fs.existsSync(renamedPath)) fs.unlinkSync(renamedPath);
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
    if (status === Status.CLOSED) {
      patch.resolved_at = new Date().toISOString();
    }
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
        .select(complaintSelectUser)
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

