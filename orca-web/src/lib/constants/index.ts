/**
 * CONFIGURAÇÕES E CONSTANTES GLOBAIS
 */

// API Base URLs (microserviços)
export const API_CONFIG = {
  IDENTITY: process.env.NEXT_PUBLIC_IDENTITY_API || 'http://localhost:5002',
  CATALOG: process.env.NEXT_PUBLIC_CATALOG_API || 'http://localhost:5001',
  FORMS: process.env.NEXT_PUBLIC_FORMS_API || 'http://localhost:5003',
  REQUESTS: process.env.NEXT_PUBLIC_REQUESTS_API || 'http://localhost:5004',
  ORCHESTRATOR: process.env.NEXT_PUBLIC_ORCHESTRATOR_API || 'http://localhost:5005',
};

// Token Storage Key
export const TOKEN_STORAGE_KEY = 'orca_session_token';
export const USER_STORAGE_KEY = 'orca_user';

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
