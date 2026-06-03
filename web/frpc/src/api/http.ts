// http.ts - Base HTTP client

class HTTPError extends Error {
  status: number
  statusText: string

  constructor(status: number, statusText: string, message?: string) {
    super(message || statusText)
    this.status = status
    this.statusText = statusText
  }
}

let _authHeader = ''
let _frpcTarget = ''

export function setAuthHeader(header: string) {
  _authHeader = header
}

export function setFrpcTarget(target: string) {
  _frpcTarget = target
}

async function request<T>(url: string, options: RequestInit = {}): Promise<T> {
  const mergedOptions: RequestInit = {
    credentials: 'include',
    ...options,
  }

  const extraHeaders: Record<string, string> = {}
  if (_authHeader) {
    extraHeaders['Authorization'] = _authHeader
  }
  if (_frpcTarget) {
    extraHeaders['X-Frpc-Target'] = _frpcTarget
  }
  if (Object.keys(extraHeaders).length > 0) {
    mergedOptions.headers = {
      ...(mergedOptions.headers as Record<string, string>),
      ...extraHeaders,
    }
  }

  const response = await fetch(url, mergedOptions)

  if (!response.ok) {
    throw new HTTPError(
      response.status,
      response.statusText,
      `HTTP ${response.status}`,
    )
  }

  // Handle empty response (e.g. 204 No Content)
  if (response.status === 204) {
    return {} as T
  }

  const contentType = response.headers.get('content-type')
  if (contentType && contentType.includes('application/json')) {
    return response.json()
  }
  return response.text() as unknown as T
}

export const http = {
  get: <T>(url: string, options?: RequestInit) =>
    request<T>(url, { ...options, method: 'GET' }),
  post: <T>(url: string, body?: any, options?: RequestInit) => {
    const headers: HeadersInit = { ...options?.headers }
    let requestBody = body

    if (
      body &&
      typeof body === 'object' &&
      !(body instanceof FormData) &&
      !(body instanceof Blob)
    ) {
      if (!('Content-Type' in headers)) {
        ;(headers as any)['Content-Type'] = 'application/json'
      }
      requestBody = JSON.stringify(body)
    }

    return request<T>(url, {
      ...options,
      method: 'POST',
      headers,
      body: requestBody,
    })
  },
  put: <T>(url: string, body?: any, options?: RequestInit) => {
    const headers: HeadersInit = { ...options?.headers }
    let requestBody = body

    if (
      body &&
      typeof body === 'object' &&
      !(body instanceof FormData) &&
      !(body instanceof Blob)
    ) {
      if (!('Content-Type' in headers)) {
        ;(headers as any)['Content-Type'] = 'application/json'
      }
      requestBody = JSON.stringify(body)
    }

    return request<T>(url, {
      ...options,
      method: 'PUT',
      headers,
      body: requestBody,
    })
  },
  delete: <T>(url: string, options?: RequestInit) =>
    request<T>(url, { ...options, method: 'DELETE' }),
}
