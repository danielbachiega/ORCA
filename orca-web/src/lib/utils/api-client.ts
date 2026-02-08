/**
 * HTTP CLIENT ABSTRATO
 * 
 * PORQUÊ ABSTRATO?
 * Hoje: chamadas diretas aos microserviços (localhost:5001, localhost:5002, etc)
 * Amanhã: Gateway/BFF (localhost:3000/api)
 * 
 * Mudando AQUI = mudando em 1 arquivo, não em 50 componentes!
 * 
 * PADRÃO: Dependency Injection via instância exportada
 */

import axios, {
  AxiosInstance,
  AxiosRequestConfig,
  AxiosError,
} from 'axios';

export interface ApiClientConfig {
  baseURL: string;
  timeout?: number;
  token?: string;
}

export interface ApiResponse<T> {
  data: T;
  status: number;
  message?: string;
}

/**
 * Classe abstrata que encapsula toda lógica HTTP
 * Cada microserviço terá uma instância com baseURL diferente
 */
export class ApiClient {
  private axiosInstance: AxiosInstance;

  constructor(config: ApiClientConfig) {
    this.axiosInstance = axios.create({
      baseURL: config.baseURL,
      timeout: config.timeout || 30000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Interceptador para adicionar token em toda requisição
    this.axiosInstance.interceptors.request.use((cfg) => {
      const token = config.token || this.getTokenFromStorage();
      if (token) {
        cfg.headers.Authorization = `Bearer ${token}`;
      }
      return cfg;
    });

    // Interceptador para tratamento de erros globais
    this.axiosInstance.interceptors.response.use(
      (response) => response,
      (error: AxiosError) => {
        // 401 = Token expirado, trigger logout
        if (error.response?.status === 401) {
          this.handleUnauthorized();
        }
        return Promise.reject(error);
      }
    );
  }

  /**
   * GET: Obter dados
   */
  async get<T>(endpoint: string, config?: AxiosRequestConfig): Promise<T> {
    try {
      const response = await this.axiosInstance.get<T>(endpoint, config);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * POST: Criar dados
   */
  async post<T, D = unknown>(
    endpoint: string,
    data?: D,
    config?: AxiosRequestConfig
  ): Promise<T> {
    try {
      const response = await this.axiosInstance.post<T>(endpoint, data, config);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * PUT: Atualizar dados
   */
  async put<T, D = unknown>(
    endpoint: string,
    data?: D,
    config?: AxiosRequestConfig
  ): Promise<T> {
    try {
      const response = await this.axiosInstance.put<T>(endpoint, data, config);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * DELETE: Remover dados
   */
  async delete<T>(endpoint: string, config?: AxiosRequestConfig): Promise<T> {
    try {
      const response = await this.axiosInstance.delete<T>(endpoint, config);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Atualizar token (chamado quando usuário faz login)
   */
  setToken(token: string): void {
    this.axiosInstance.defaults.headers.common['Authorization'] =
      `Bearer ${token}`;
  }

  /**
   * Limpar token (chamado no logout)
   */
  clearToken(): void {
    delete this.axiosInstance.defaults.headers.common['Authorization'];
  }

  /**
   * Obter token do localStorage (fallback)
   */
  private getTokenFromStorage(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('orca_session_token');
  }

  /**
   * Tratamento de erro centralizado
   */
  private handleError(error: unknown): Error {
    if (axios.isAxiosError(error)) {
      const data = error.response?.data as
        | { message?: string; error?: string; detail?: string; title?: string; errors?: Record<string, string[] | string> }
        | string
        | undefined;
      let message = error.message;

      if (typeof data === 'string') {
        message = data;
      } else if (data?.detail) {
        message = data.detail;
      } else if (data?.message) {
        message = data.message;
      } else if (data?.title) {
        message = data.title;
      } else if (data?.error) {
        message = data.error;
      } else if (data?.errors && typeof data.errors === 'object') {
        const flattened = Object.values(data.errors)
          .flatMap((v) => (Array.isArray(v) ? v : [v]))
          .filter(Boolean);
        if (flattened.length > 0) {
          message = flattened.join(' ');
        }
      }
      const httpError = new Error(message) as unknown as Record<string, unknown>;
      httpError.status = error.response?.status;
      httpError.data = error.response?.data;
      return httpError as unknown as Error;
    }
    return error as Error;
  }

  /**
   * Callback quando 401 (não autenticado)
   * Override em subclasses se precisar
   */
  protected handleUnauthorized(): void {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('orca_session_token');
      localStorage.removeItem('orca_user');
      // Trigger a custom event que o AuthContext escuta
      window.dispatchEvent(new Event('auth:unauthorized'));
    }
  }
}
