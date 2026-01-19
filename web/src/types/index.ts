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

export interface FormDefinition {
  id: string;
  offerId: string;
  version: number;
  jsonSchema: string;
  uiSchema?: string;
  rules?: string;
  createdAtUtc: string;
}