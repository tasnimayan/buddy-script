import axios, {
  isAxiosError,
  type AxiosError,
  type AxiosInstance,
  type AxiosRequestConfig,
} from "axios";
import type { ZodType } from "zod";

const API_BASE_URL = process.env.BACKEND_API_URL!;
const DEFAULT_TIMEOUT_MS = 10_000;
const MAX_RETRIES = 3;
const RETRY_DELAY_BASE_MS = 300;
const RETRYABLE_STATUS_CODES = new Set([408, 429, 500, 502, 503, 504]);

declare module "axios" {
  export interface AxiosRequestConfig {
    retryCount?: number;
  }
}

export type ApiResult<T> =
  | { ok: true; data: T; setCookies?: string[] }
  | { ok: false; error: string };

export function apiSuccess<T>(data: T, setCookies?: string[]): ApiResult<T> {
  return setCookies?.length
    ? { ok: true, data, setCookies }
    : { ok: true, data };
}

export function apiFailure(error: string): ApiResult<never> {
  return { ok: false, error };
}

// ---------------------------------------------------------------------------
// Axios instance with retry

function isRetryableError(error: AxiosError): boolean {
  return !error.response || RETRYABLE_STATUS_CODES.has(error.response.status);
}

function retryDelay(attempt: number): number {
  return (
    RETRY_DELAY_BASE_MS * 2 ** (attempt - 1) +
    Math.random() * RETRY_DELAY_BASE_MS
  );
}

function createClient(): AxiosInstance {
  const client = axios.create({
    baseURL: API_BASE_URL,
    timeout: DEFAULT_TIMEOUT_MS,
    headers: { "Content-Type": "application/json" },
  });

  client.interceptors.response.use(undefined, async (error: AxiosError) => {
    const config = error.config as AxiosRequestConfig | undefined;
    if (!config || !isRetryableError(error)) return Promise.reject(error);

    const attempt = (config.retryCount ?? 0) + 1;
    if (attempt > MAX_RETRIES) return Promise.reject(error);

    config.retryCount = attempt;
    await new Promise<void>((r) => setTimeout(r, retryDelay(attempt)));
    return client(config);
  });

  return client;
}

const httpClient = createClient();

// ---------------------------------------------------------------------------
// Request helper

const ERROR_MESSAGES = {
  generic: "Your request could not be completed. Please try again.",
  network: "Unable to reach the server. Please try again.",
  invalidResponse: "Received an unexpected response from the server.",
} as const;

function extractErrorMessage(error: unknown): string {
  if (isAxiosError(error)) {
    if (!error.response) return ERROR_MESSAGES.network;
    const body = error.response.data as { message?: unknown } | undefined;
    if (body && typeof body.message === "string") return body.message;
  }
  return ERROR_MESSAGES.generic;
}

function extractSetCookies(
  headers: Record<string, unknown>,
): string[] | undefined {
  const raw = headers["set-cookie"];
  if (!raw) return undefined;
  return Array.isArray(raw) ? raw.map(String) : [String(raw)];
}

interface SendRequestOptions<T> extends Omit<AxiosRequestConfig, "url"> {
  responseSchema: ZodType<T>;
}

/** Send a request through the HTTP client and validate the response. */
export async function sendRequest<T>(
  url: string,
  { responseSchema, ...config }: SendRequestOptions<T>,
): Promise<ApiResult<T>> {
  try {
    const response = await httpClient.request({ url, ...config });
    const parsed = responseSchema.safeParse(response.data);
    if (!parsed.success) return apiFailure(ERROR_MESSAGES.invalidResponse);
    return apiSuccess(parsed.data, extractSetCookies(response.headers));
  } catch (error) {
    return apiFailure(extractErrorMessage(error));
  }
}
