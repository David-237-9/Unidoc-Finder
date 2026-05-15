const API_BASE_URL = '/api';

export class ApiError extends Error {
    public readonly status: number
    public readonly payload: unknown

    constructor(message: string, status: number, payload: unknown) {
        super(message)
        this.name = 'ApiError'
        this.status = status
        this.payload = payload
    }
}

export async function apiRequest<T>(path: string, init?: RequestInit): Promise<T> {
    const response = await fetch(`${API_BASE_URL}${path}`, {
        ...init,
        headers: {
            'Content-Type': 'application/json',
            ...init?.headers
        }
    });

    const payload = await readResponsePayload(response);

    if (!response.ok) {
        throw new ApiError(resolveErrorMessage(payload, response.statusText), response.status, payload);
    }

    return payload as T;
}

async function readResponsePayload(response: Response): Promise<unknown> {
    const contentType = response.headers.get('content-type') ?? '';

    if (response.status === 204) {
        return null
    }

    if (contentType.includes('application/json')) {
        return response.json()
    }

    return response.text()
}

function resolveErrorMessage(payload: unknown, fallback: string): string {
    if (typeof payload === 'string' && payload.trim()) {
        return payload
    }

    if (isErrorPayload(payload)) {
        return payload.error
    }

    return fallback || 'API Error'
}

function isErrorPayload(value: unknown): value is { error: string } {
    return Boolean(value && typeof value === 'object' && 'error' in value && typeof value.error === 'string')
}
