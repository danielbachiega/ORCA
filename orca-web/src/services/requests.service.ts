/**
 * REQUESTS SERVICE
 * 
 * Abstração sobre o Orca.Requests.Api
 * Responsável por: Criar requisições, listar requisições, consultar status
 */

import { ApiClient } from '@/lib/utils/api-client';
import { API_CONFIG } from '@/lib/constants';
import { Request, CreateRequestDto, RequestListResponse } from '@/lib/types';

class RequestsService {
  private client: ApiClient;

  constructor() {
    this.client = new ApiClient({
      baseURL: API_CONFIG.REQUESTS,
    });
  }

  /**
   * GET /api/requests
   * Listar todas requisições (com paginação)
   */
  async listRequests(page: number = 1, pageSize: number = 10): Promise<RequestListResponse> {
    return this.client.get<RequestListResponse>('/api/requests', {
      params: { page, pageSize },
    });
  }

  /**
   * GET /api/requests/{id}
   * Obter detalhes de uma requisição
   */
  async getRequestById(requestId: string): Promise<Request> {
    return this.client.get<Request>(`/api/requests/${requestId}`);
  }

  /**
   * GET /api/requests/offer/{offerId}
   * Listar requisições de uma oferta específica
   */
  async listRequestsByOffer(
    offerId: string,
    page: number = 1,
    pageSize: number = 10
  ): Promise<RequestListResponse> {
    return this.client.get<RequestListResponse>(
      `/api/requests/offer/${offerId}`,
      { params: { page, pageSize } }
    );
  }

  /**
   * GET /api/requests/user/{userId}
   * Listar requisições de um usuário
   */
  async listRequestsByUser(
    userId: string,
    page: number = 1,
    pageSize: number = 10
  ): Promise<RequestListResponse> {
    return this.client.get<RequestListResponse>(
      `/api/requests/user/${userId}`,
      { params: { page, pageSize } }
    );
  }

  /**
   * GET /api/requests/user/{userId}/offer/{offerId}
   * Listar requisições de um usuário para uma oferta específica
   */
  async listRequestsByUserAndOffer(
    userId: string,
    offerId: string,
    page: number = 1,
    pageSize: number = 10
  ): Promise<RequestListResponse> {
    return this.client.get<RequestListResponse>(
      `/api/requests/user/${userId}/offer/${offerId}`,
      { params: { page, pageSize } }
    );
  }

  /**
   * POST /api/requests
   * Criar nova requisição (dispara evento no RabbitMQ)
   */
  async createRequest(dto: CreateRequestDto): Promise<Request> {
    return this.client.post<Request>('/api/requests', {
      offerId: dto.offerId,
      userId: dto.userId,
      formData: JSON.stringify(dto.formData), // Backend espera string JSON
    });
  }

  setToken(token: string): void {
    this.client.setToken(token);
  }

  clearToken(): void {
    this.client.clearToken();
  }
}

export const requestsService = new RequestsService();
