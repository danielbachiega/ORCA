import { apiClient } from './client';
import type {
  Offer,
  OfferInput,
  OfferUpdate,
  FormDefinition,
  FormDefinitionInput,
  FormDefinitionUpdate,
} from '../types';

// Serviço de Offers
export const offerService = {
  getAll: () => apiClient.get<Offer[]>('/offers'),
  getById: (id: string) => apiClient.get<Offer>(`/offers/${id}`),
  getBySlug: (slug: string) => apiClient.get<Offer>(`/offers/slug/${slug}`),
  create: (offer: OfferInput) => apiClient.post<Offer>('/offers', offer),
  update: (id: string, offer: OfferUpdate) => apiClient.put<Offer>(`/offers/${id}`, offer),
  delete: (id: string) => apiClient.delete(`/offers/${id}`),
};

// Serviço de FormDefinitions
export const formDefinitionService = {
  getAll: () => apiClient.get<FormDefinition[]>('/form-definitions'),
  getById: (id: string) => apiClient.get<FormDefinition>(`/form-definitions/${id}`),
  getByOfferId: (offerId: string) =>
    apiClient.get<FormDefinition[]>(`/form-definitions/offer/${offerId}`),
  create: (formDef: FormDefinitionInput) =>
    apiClient.post<FormDefinition>('/form-definitions', formDef),
  update: (id: string, formDef: FormDefinitionUpdate) =>
    apiClient.put<FormDefinition>(`/form-definitions/${id}`, formDef),
  delete: (id: string) => apiClient.delete(`/form-definitions/${id}`),
  publish: (id: string) =>
    apiClient.post(`/form-definitions/${id}/publish`),
};