import { makeAutoObservable, runInAction } from "mobx";
import { apiJson, ApiError } from "@/lib/apiClient";
import { apiEndPointMap } from "@/lib/apiEndPointMap";
import { AuthStorage } from "@/lib/authStorage";

export type ComplaintStatus = "OPEN" | "PENDING" | "REVIEWED" | "ESCALATED" | "CLOSED";

export type Complaint = {
  id: string;
  userId: string;
  description: string;
  category: string;
  priority: string;
  recommendation: string[];
  status: ComplaintStatus;
  slaDeadline: string | null;
  createdAt: string;
};

type ComplaintListResponse = {
  complaints: Complaint[];
};

type ComplaintResponse = {
  complaint: Complaint;
};

export class ComplaintsManager {
  complaints: Complaint[] = [];
  isLoading = false;
  isCreating = false;
  isUpdating = false;
  error: string | null = null;

  constructor() {
    makeAutoObservable(this, {}, { autoBind: true });
  }

  async fetchComplaints(accessToken: string): Promise<void> {
    this.isLoading = true;
    this.error = null;

    try {
      const result = await apiJson<ComplaintListResponse>(apiEndPointMap.complaints.list, {
        method: "GET",
        accessToken
      });

      runInAction(() => {
        this.complaints = result.complaints || [];
      });
    } catch (err: unknown) {
      runInAction(() => {
        this.error = err instanceof Error ? err.message : "Failed to fetch complaints";
      });
      if (err instanceof ApiError && err.status === 401) {
        AuthStorage.clearAccessToken();
        if (typeof window !== "undefined") {
          window.location.href = "/sign-in";
        }
      }
      throw err;
    } finally {
      runInAction(() => {
        this.isLoading = false;
      });
    }
  }

  async createComplaint(
    accessToken: string,
    data: {
      description: string;
      slaDeadline?: string | null;
    }
  ): Promise<Complaint> {
    this.isCreating = true;
    this.error = null;

    try {
      const result = await apiJson<ComplaintResponse>(apiEndPointMap.complaints.create, {
        method: "POST",
        accessToken,
        body: data
      });

      runInAction(() => {
        this.complaints.unshift(result.complaint);
      });

      return result.complaint;
    } catch (err: unknown) {
      runInAction(() => {
        this.error = err instanceof Error ? err.message : "Failed to create complaint";
      });
      if (err instanceof ApiError && err.status === 401) {
        AuthStorage.clearAccessToken();
        if (typeof window !== "undefined") {
          window.location.href = "/sign-in";
        }
      }
      throw err;
    } finally {
      runInAction(() => {
        this.isCreating = false;
      });
    }
  }

  async updateComplaintStatus(
    accessToken: string,
    data: {
      id: string;
      status: ComplaintStatus;
      recommendation?: string | null;
      slaDeadline?: string | null;
    }
  ): Promise<Complaint> {
    this.isUpdating = true;
    this.error = null;

    try {
      const result = await apiJson<ComplaintResponse>(apiEndPointMap.complaints.updateStatus, {
        method: "PATCH",
        accessToken,
        body: data
      });

      runInAction(() => {
        const index = this.complaints.findIndex((c) => c.id === result.complaint.id);
        if (index !== -1) {
          this.complaints[index] = result.complaint;
        }
      });

      return result.complaint;
    } catch (err: unknown) {
      runInAction(() => {
        this.error = err instanceof Error ? err.message : "Failed to update complaint";
      });
      if (err instanceof ApiError && err.status === 401) {
        AuthStorage.clearAccessToken();
        if (typeof window !== "undefined") {
          window.location.href = "/sign-in";
        }
      }
      throw err;
    } finally {
      runInAction(() => {
        this.isUpdating = false;
      });
    }
  }

  clearError(): void {
    this.error = null;
  }
}
