import type { Request, Response } from "express";
import { createSupabaseAdminClient } from "../supabase.ts";
import { isComplaintStatus } from "../models/Complaint.ts";

export class AdminController {
  private constructor() {}

  static async getDashboardStats(req: Request, res: Response) {
    const adminClient = createSupabaseAdminClient();
    if (!adminClient) {
      return res.status(501).json({ error: "Missing SUPABASE_SERVICE_ROLE_KEY setup for admin endpoints" });
    }

    try {
      const { data, error } = await adminClient
        .from("complaints")
        .select("id,userId:user_id,description,category,priority,recommendation,status,slaDeadline:sla_deadline,createdAt:created_at")
        .order("created_at", { ascending: false });

      if (error) return res.status(400).json({ error: error.message });
      
      const complaints = data || [];
      
      const categoryMap = new Map<string, number>();
      const priorityMap = new Map<string, number>();
      const statusMap = new Map<string, number>();

      for (const c of complaints) {
        if (c.category) categoryMap.set(c.category, (categoryMap.get(c.category) || 0) + 1);
        if (c.priority) priorityMap.set(c.priority, (priorityMap.get(c.priority) || 0) + 1);
        if (c.status) statusMap.set(c.status, (statusMap.get(c.status) || 0) + 1);
      }

      const toArray = (map: Map<string, number>) => Array.from(map.entries()).map(([name, value]) => ({ name, value }));

      return res.json({
        categoryStats: toArray(categoryMap),
        priorityStats: toArray(priorityMap),
        statusStats: toArray(statusMap),
        complaints: complaints
      });

    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to fetch stats";
      return res.status(500).json({ error: message });
    }
  }

  static async updateComplaintStatus(req: Request, res: Response) {
    const adminClient = createSupabaseAdminClient();
    if (!adminClient) {
      return res.status(501).json({ error: "Missing SUPABASE_SERVICE_ROLE_KEY setup for admin endpoints" });
    }

    const { id, status } = req.body || {};
    if (!id) return res.status(400).json({ error: "id is required" });
    if (!isComplaintStatus(status)) {
      return res.status(400).json({ error: "status must be one of OPEN, PENDING, REVIEWED, ESCALATED, CLOSED" });
    }

    try {
      const { data, error } = await adminClient
        .from("complaints")
        .update({ status })
        .eq("id", id)
        .select("id,userId:user_id,description,category,priority,recommendation,status,slaDeadline:sla_deadline,createdAt:created_at")
        .single();
        
      if (error) return res.status(400).json({ error: error.message });
      return res.json({ complaint: data });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to update complaint";
      return res.status(500).json({ error: message });
    }
  }
}
