/**
 * CONFIGURAÇÕES E CONSTANTES GLOBAIS
 *
 * Em desenvolvimento: pode usar variáveis por serviço (NEXT_PUBLIC_*_API)
 * ou uma única base de gateway (NEXT_PUBLIC_GATEWAY_API).
 */

const gatewayApiBase = process.env.NEXT_PUBLIC_GATEWAY_API;
const defaultGatewayApiBase = 'http://localhost:5000/api';

export const API_CONFIG = {
  IDENTITY: process.env.NEXT_PUBLIC_IDENTITY_API || `${gatewayApiBase || defaultGatewayApiBase}/identity`,
  CATALOG: process.env.NEXT_PUBLIC_CATALOG_API || `${gatewayApiBase || defaultGatewayApiBase}/catalog`,
  FORMS: process.env.NEXT_PUBLIC_FORMS_API || `${gatewayApiBase || defaultGatewayApiBase}/forms`,
  REQUESTS: process.env.NEXT_PUBLIC_REQUESTS_API || `${gatewayApiBase || defaultGatewayApiBase}/requests`,
  ORCHESTRATOR: process.env.NEXT_PUBLIC_ORCHESTRATOR_API || `${gatewayApiBase || defaultGatewayApiBase}/orchestrator`,
};

export const EXTERNAL_EXECUTION_CONFIG = {
  AWX_BASE_URL: process.env.NEXT_PUBLIC_AWX_BASE_URL || '',
  OO_BASE_URL: process.env.NEXT_PUBLIC_OO_BASE_URL || '',
};

// Branding
export const APP_NAME = process.env.NEXT_PUBLIC_APP_NAME || 'ORCA';
export const APP_SUBTITLE =
  process.env.NEXT_PUBLIC_APP_SUBTITLE || 'Orchestrator Catalog Application';

// Token Storage Key
export const TOKEN_STORAGE_KEY = 'orca_session_token';
export const USER_STORAGE_KEY = 'orca_user';
export const TOKEN_EXPIRES_AT_STORAGE_KEY = 'orca_session_expires_at';
export const THEME_STORAGE_KEY = 'orca_theme_mode';

// Request Status Labels (para UI)
export const REQUEST_STATUS_LABELS = {
  0: 'Pendente',
  1: 'Executando',
  2: 'Sucesso',
  3: 'Falha',
};

export const REQUEST_STATUS_COLORS = {
  0: 'default',    // Pendente
  1: 'processing', // Executando
  2: 'success',    // Sucesso
  3: 'error',      // Falha
};

// Polling
export const POLLING_INTERVAL_MS = 5000; // 5 segundos
export const POLLING_TIMEOUT_MS = 2 * 60 * 60 * 1000; // 2 horas

// Pagination
export const DEFAULT_PAGE_SIZE = 10;
