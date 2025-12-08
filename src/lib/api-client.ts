/**
 * API Client dla Foodnager
 * Obsługuje wywołania API z error handling i type safety
 */

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
    public code?: string
  ) {
    super(message);
    this.name = "ApiError";
  }
}

class ApiClient {
  private baseURL: string;

  constructor(baseURL = "") {
    this.baseURL = baseURL;
  }

  async get<T>(endpoint: string, params?: Record<string, unknown>): Promise<T> {
    const url = new URL(endpoint, window.location.origin);

    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          url.searchParams.set(key, String(value));
        }
      });
    }

    const response = await fetch(url.toString(), {
      headers: this.getHeaders(),
    });

    return this.handleResponse<T>(response);
  }

  async post<T>(endpoint: string, body?: Record<string, unknown>): Promise<T> {
    const url = new URL(endpoint, window.location.origin);

    const response = await fetch(url.toString(), {
      method: "POST",
      headers: this.getHeaders(),
      body: body ? JSON.stringify(body) : undefined,
    });

    return this.handleResponse<T>(response);
  }

  async patch<T>(endpoint: string, body?: Record<string, unknown>): Promise<T> {
    const url = new URL(endpoint, window.location.origin);

    const response = await fetch(url.toString(), {
      method: "PATCH",
      headers: this.getHeaders(),
      body: body ? JSON.stringify(body) : undefined,
    });

    return this.handleResponse<T>(response);
  }

  async delete<T>(endpoint: string): Promise<T> {
    const url = new URL(endpoint, window.location.origin);

    const response = await fetch(url.toString(), {
      method: "DELETE",
      headers: this.getHeaders(),
    });

    return this.handleResponse<T>(response);
  }

  private getHeaders(): HeadersInit {
    return {
      "Content-Type": "application/json",
      // 'Authorization': `Bearer ${getToken()}` // TODO: implement auth
    };
  }

  private async handleResponse<T>(response: Response): Promise<T> {
    if (!response.ok) {
      throw await this.parseError(response);
    }

    if (response.status === 204) {
      return null as T;
    }

    return response.json();
  }

  private async parseError(response: Response): Promise<ApiError> {
    try {
      const errorData = await response.json();
      return new ApiError(response.status, errorData.error?.message || "Wystąpił błąd", errorData.error?.code);
    } catch {
      return new ApiError(response.status, "Wystąpił nieoczekiwany błąd");
    }
  }
}

export const apiClient = new ApiClient();
