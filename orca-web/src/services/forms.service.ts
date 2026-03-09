/**
 * FORMS SERVICE
 * 
 * Abstração sobre o Orca.Forms.Api
 * Responsável por: Gerenciar formulários e templates de execução
 */

import { ApiClient } from '@/lib/utils/api-client';
import { API_CONFIG } from '@/lib/constants';

interface FormDefinition {
  id: string;
  offerId: string;
  version: number;
  schemaJson: string;
  isPublished: boolean;
  createdAtUtc: string;
  updatedAtUtc?: string;
}

interface FieldMapping {
  payloadFieldName: string;
  sourceType: 0 | 1; // 0 = form field, 1 = fixed value
  sourceValue: string;
}

interface ExecutionTemplate {
  id: string;
  formDefinitionId: string;
  targetType: 0 | 1; // 0 = AWX, 1 = OO
  resourceType?: 0 | 1 | null; // 0 = JobTemplate, 1 = Workflow (null para OO)
  resourceId: string;
  fieldMappings?: FieldMapping[];
  createdAtUtc: string;
  updatedAtUtc?: string;
}

class FormsService {
  private client: ApiClient;

  constructor() {
    this.client = new ApiClient({
      baseURL: API_CONFIG.FORMS,
    });
  }

  /**
   * GET /api/form-definitions/offer/{offerId}/published
   * Obter formulário publicado de uma oferta
   */
  async getPublishedFormByOfferId(offerId: string): Promise<FormDefinition> {
    return this.client.get<FormDefinition>(`/api/form-definitions/offer/${offerId}/published`);
  }

  /**
   * GET /api/execution-templates/form-definition/{formDefinitionId}
   * Obter template de execução de um formulário
   */
  async getExecutionTemplateByFormDefinitionId(formDefinitionId: string): Promise<ExecutionTemplate> {
    return this.client.get<ExecutionTemplate>(
      `/api/execution-templates/form-definition/${formDefinitionId}`
    );
  }

  /**
   * Aplicar field mapping aos dados do formulário
   * Transforma FormData em Payload para AWX/OO
   */
  applyFieldMapping(formData: Record<string, unknown>, fieldMappings?: FieldMapping[]): Record<string, unknown> {
    if (!fieldMappings || fieldMappings.length === 0) {
      console.log('⚠️ Nenhum field mapping definido, retornando formData original');
      return formData;
    }

    const payload: Record<string, unknown> = {};
    const mappingsByPayload = new Map<string, FieldMapping[]>();

    fieldMappings.forEach((mapping) => {
      const normalizedPayloadFieldName = String(mapping.payloadFieldName || '').trim();
      if (!normalizedPayloadFieldName) {
        return;
      }

      const currentMappings = mappingsByPayload.get(normalizedPayloadFieldName) || [];
      currentMappings.push(mapping);
      mappingsByPayload.set(normalizedPayloadFieldName, currentMappings);
    });

    mappingsByPayload.forEach((mappings, payloadFieldName) => {
      if (mappings.length === 1) {
        const [singleMapping] = mappings;

        if (singleMapping.sourceType === 0) {
          const value = formData[singleMapping.sourceValue];
          if (value !== null && value !== undefined && value !== '') {
            console.log(`📝 Mapeando campo "${singleMapping.sourceValue}" → "${payloadFieldName}":`, value);
            payload[payloadFieldName] = value;
          }
          return;
        }

        console.log(`🔒 Mapeando valor fixo "${singleMapping.sourceValue}" → "${payloadFieldName}"`);
        payload[payloadFieldName] = singleMapping.sourceValue;
        return;
      }

      const composedValue = mappings
        .map((mapping) => {
          if (mapping.sourceType === 1) {
            return String(mapping.sourceValue ?? '');
          }

          const formValue = formData[mapping.sourceValue];
          if (formValue === null || formValue === undefined || formValue === '') {
            return '';
          }

          return String(formValue);
        })
        .join('');

      if (composedValue !== '') {
        console.log(`🧩 Compondo payload "${payloadFieldName}" com ${mappings.length} mapeamentos:`, composedValue);
        payload[payloadFieldName] = composedValue;
      }
    });

    console.log('✅ Payload mapeado:', payload);
    return payload;
  }

  setToken(token: string): void {
    this.client.setToken(token);
  }

  clearToken(): void {
    this.client.clearToken();
  }
}

export const formsService = new FormsService();
