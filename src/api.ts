export class ApiError extends Error {
  constructor(message: string, readonly status: number) { super(message) }
}
export async function api<T>(path: string, method = 'GET', data?: unknown): Promise<T> {
  const upload = data instanceof FormData
  const response = await fetch('/api/admin' + path, {
    method, credentials: 'same-origin', cache: 'no-store',
    headers: data !== undefined && !upload ? { 'Content-Type': 'application/json' } : undefined,
    body: data === undefined ? undefined : upload ? data : JSON.stringify(data)
  })
  if (!response.ok) {
    const error = await response.json().catch(() => null)
    throw new ApiError(error?.error || 'The request could not be completed.', response.status)
  }
  return response.status === 204 ? undefined as T : response.json()
}
