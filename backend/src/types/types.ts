export type AuthBody = {
  email?: string;
  password?: string;
  name?: string;
  role?: string;
  data?: Record<string, unknown>;
};

export type ErrorWithCause = {
  message?: string;
  cause?: {
    name?: string;
    message?: string;
    code?: string;
  } | null;
};

