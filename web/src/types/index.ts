export interface Offer {
  id: string;
  slug: string;
  name: string;
  description?: string;
  imageUrl?: string;
  tags: string[];
  active: boolean;
  createdAtUtc: string;
  updateAtUtc?: string;
}

// Payload para criação/edição no Admin
export interface OfferInput {
  slug: string;
  name: string;
  description?: string;
  imageUrl?: string;
  tags: string[];
  active: boolean;
}

export interface FormField {
  id: string;
  name: string;
  label: string;
  type: 'text' | 'email' | 'number' | 'checkbox' | 'select' | 'textarea';
  required: boolean;
  options?: string[];
  description?: string;
  visibleIf?: {
    fieldId: string;
    value: string;
  };
}

export interface FormDefinition {
  id: string;
  offerId: string;
  version: number;
  jsonSchema: string;
  uiSchema?: string;
  rules?: string;
  isPublished: boolean;
  createdAtUtc: string;
}

// Payload para criação/edição de FormDefinition
export interface FormDefinitionInput {
  offerId: string;
  version: number;
  jsonSchema: string;
  uiSchema?: string;
  rules?: string;
  isPublished?: boolean;
}

// Payload para atualização de FormDefinition no Admin
export type FormDefinitionUpdate = FormDefinitionInput & {
  id: string;
  createdAtUtc: string;
};

// Payload para atualização no Admin
export type OfferUpdate = OfferInput & {
  id: string;
  createdAtUtc: string;
  updateAtUtc: string;
};