const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "";

export type QueryParams = object;

export async function fetchApi<T>(
  path: string,
  params: QueryParams = {},
  signal?: AbortSignal,
): Promise<T> {
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(params) as [string, unknown][]) {
    if (typeof value === "string" && value !== "") {
      query.set(key, value);
    } else if (typeof value === "number" && Number.isFinite(value)) {
      query.set(key, String(value));
    }
  }

  const queryString = query.size > 0 ? `?${query.toString()}` : "";
  const response = await fetch(`${API_BASE_URL}${path}${queryString}`, { signal });
  if (!response.ok) {
    throw new Error(`API request failed: ${response.status}`);
  }
  return response.json() as Promise<T>;
}