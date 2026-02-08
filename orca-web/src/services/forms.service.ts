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

    const formMappings = fieldMappings.filter((mapping) => mapping.sourceType === 0);
    const fixedMappings = fieldMappings.filter((mapping) => mapping.sourceType === 1);

    formMappings.forEach((mapping) => {
      const { payloadFieldName, sourceValue } = mapping;
      // Source Type 0: valor vem do campo do formulário
      const value = formData[sourceValue];
      console.log(`📝 Mapeando campo "${sourceValue}" → "${payloadFieldName}":`, value);
      payload[payloadFieldName] = value;
    });

    fixedMappings.forEach((mapping) => {
      const { payloadFieldName, sourceValue } = mapping;
      // Source Type 1: valor fixo (prioridade sobre valores do formulário)
      if (payloadFieldName in payload) {
        console.log(`⚠️ Sobrescrevendo "${payloadFieldName}" com valor fixo "${sourceValue}"`);
      }
      console.log(`🔒 Mapeando valor fixo "${sourceValue}" → "${payloadFieldName}"`);
      payload[payloadFieldName] = sourceValue;
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
