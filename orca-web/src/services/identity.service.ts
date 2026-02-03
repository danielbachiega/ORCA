/**
 * IDENTITY SERVICE
 * 
 * Abstração sobre o Orca.Identity.Api
 * Responsável por: Login, Me (whoami), Logout
 */

import { ApiClient } from '@/lib/utils/api-client';
import { API_CONFIG } from '@/lib/constants';
import { LoginResponse, AuthMeResponse, Role } from '@/lib/types';

class IdentityService {
  private client: ApiClient;

  constructor() {
    this.client = new ApiClient({
      baseURL: API_CONFIG.IDENTITY,
    });
  }

  /**
   * POST /api/auth/login
   * Body: { username: string, password: string }
   * Response: { sessionToken, user, roles, expiresAtUtc }
   */
  async login(username: string, password: string): Promise<LoginResponse> {
    return this.client.post<LoginResponse>('/api/auth/login', {
      username,
      password,
    });
  }

  /**
   * GET /api/auth/me
   * Obter dados do usuário autenticado
   */
  async getMe(): Promise<AuthMeResponse> {
    return this.client.get<AuthMeResponse>('/api/auth/me');
  }

  /**
   * POST /api/auth/logout
   * Logout (invalidar sessão no backend)
   */
  async logout(): Promise<void> {
    await this.client.post('/api/auth/logout');
  }

  /**
   * GET /api/roles
   * Listar todas as roles disponíveis
   */
  async listRoles(): Promise<Role[]> {
    return this.client.get<Role[]>('/api/roles');
  }

  /**
   * Atualizar token no cliente HTTP
   * (chamado quando login é bem-sucedido)
   */
  setToken(token: string): void {
    this.client.setToken(token);
  }

  /**
   * Limpar token
   * (chamado no logout)
   */
  clearToken(): void {
    this.client.clearToken();
  }
}

export const identityService = new IdentityService();
