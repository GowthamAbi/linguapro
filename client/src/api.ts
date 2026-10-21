const API_URL = (import.meta.env.VITE_API_URL as string | undefined)?.replace(/\/$/, "") ?? "";

export async function apiRequest<T>(path: string, options: RequestInit = {}): Promise<T> {
  const response = await fetch(API_URL + path, {
    ...options,
    credentials: "include",
    headers: { "Content-Type": "application/json", ...options.headers },
  });

  const payload = await response.json().catch(() => ({})) as { message?: string; data?: T };

  if (!response.ok) {
    throw new Error(payload.message ?? "Something went wrong. Please try again.");
  }

  return (payload.data ?? payload) as T;
}