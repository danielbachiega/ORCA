import { catalogClient, formsClient } from './client';
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
  getAll: () => catalogClient.get<Offer[]>('/offers'),
  getById: (id: string) => catalogClient.get<Offer>(`/offers/${id}`),
  getBySlug: (slug: string) => catalogClient.get<Offer>(`/offers/slug/${slug}`),
  create: (offer: OfferInput) => catalogClient.post<Offer>('/offers', offer),
  update: (id: string, offer: OfferUpdate) => catalogClient.put<Offer>(`/offers/${id}`, offer),
  delete: (id: string) => catalogClient.delete(`/offers/${id}`),
};

// Serviço de FormDefinitions
export const formDefinitionService = {
  getAll: () => formsClient.get<FormDefinition[]>('/form-definitions'),
  getById: (id: string) => formsClient.get<FormDefinition>(`/form-definitions/${id}`),
  getByOfferId: (offerId: string) =>
    formsClient.get<FormDefinition[]>(`/form-definitions/offer/${offerId}`),
  create: (formDef: FormDefinitionInput) =>
    formsClient.post<FormDefinition>('/form-definitions', formDef),
  update: (id: string, formDef: FormDefinitionUpdate) =>
    formsClient.put<FormDefinition>(`/form-definitions/${id}`, formDef),
  delete: (id: string) => formsClient.delete(`/form-definitions/${id}`),
  publish: (id: string) =>
    formsClient.post(`/form-definitions/${id}/publish`),
};