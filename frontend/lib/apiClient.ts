import { getApiUrl } from "@/lib/apiEndPointMap";

export type ApiErrorPayload = {
  error?: string;
  details?: unknown;
};

export class ApiError extends Error {
  status: number;
  payload?: ApiErrorPayload;

  constructor(message: string, status: number, payload?: ApiErrorPayload) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.payload = payload;
  }
}

type ApiJsonOptions = Omit<RequestInit, "body"> & {
  body?: unknown;
  accessToken?: string | null;
};

export async function apiJson<T>(path: string, options: ApiJsonOptions = {}): Promise<T> {
  const { body, accessToken, headers, ...rest } = options;

  const response = await fetch(getApiUrl(path), {
    ...rest,
    headers: {
      "Content-Type": "application/json",
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
      ...(headers || {})
    },
    body: body === undefined ? undefined : JSON.stringify(body)
  });

  const contentType = response.headers.get("content-type") || "";
  const isJson = contentType.includes("application/json");
  const payload: unknown = isJson ? await response.json().catch(() => null) : await response.text();

  if (!response.ok) {
    const apiPayload = (typeof payload === "object" && payload !== null ? payload : undefined) as
      | ApiErrorPayload
      | undefined;
    const message =
      apiPayload?.error ||
      (typeof payload === "string" && payload.trim().length ? payload : response.statusText) ||
      "Request failed";
    throw new ApiError(message, response.status, apiPayload);
  }

  return payload as T;
}

