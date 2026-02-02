/**
 * CATALOG SERVICE
 * 
 * Abstração sobre o Orca.Catalog.Api
 * Responsável por: CRUD de Ofertas
 */

import { ApiClient } from '@/lib/utils/api-client';
import { API_CONFIG } from '@/lib/constants';
import { Offer, OfferDetails } from '@/lib/types';

class CatalogService {
  private client: ApiClient;

  constructor() {
    this.client = new ApiClient({
      baseURL: API_CONFIG.CATALOG,
    });
  }

  /**
   * GET /api/offers
   * Listar todas ofertas disponíveis
   */
  async listOffers(): Promise<Offer[]> {
    return this.client.get<Offer[]>('/api/offers');
  }

  /**
   * GET /api/offers/{id}
   * Obter detalhes de uma oferta específica
   * Inclui: nome, descrição, JSON Schema do formulário
   */
  async getOfferById(offerId: string): Promise<OfferDetails> {
    return this.client.get<OfferDetails>(`/api/offers/${offerId}`);
  }

  /**
   * POST /api/offers
   * Criar nova oferta (admin only)
   */
  async createOffer(offer: Omit<Offer, 'id' | 'createdAtUtc' | 'updatedAtUtc'>): Promise<Offer> {
    return this.client.post<Offer>('/api/offers', offer);
  }

  /**
   * PUT /api/offers/{id}
   * Atualizar oferta (admin only)
   */
  async updateOffer(offerId: string, offer: Partial<Offer>): Promise<Offer> {
    return this.client.put<Offer>(`/api/offers/${offerId}`, offer);
  }

  /**
   * DELETE /api/offers/{id}
   * Deletar oferta (admin only)
   */
  async deleteOffer(offerId: string): Promise<void> {
    await this.client.delete(`/api/offers/${offerId}`);
  }

  setToken(token: string): void {
    this.client.setToken(token);
  }

  clearToken(): void {
    this.client.clearToken();
  }
}

export const catalogService = new CatalogService();
