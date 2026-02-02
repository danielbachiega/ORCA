/**
 * TYPES CENTRALIZADOS DO ORCA FRONTEND
 * 
 * Organização:
 * - API Responses (do backend)
 * - DTOs (transferência de dados)
 * - Domain Models (lógica de negócio)
 */

// ============================================
// IDENTITY SERVICE TYPES
// ============================================

export interface User {
  id: string;
  username: string;
  email: string;
  firstName?: string;
  lastName?: string;
  isActive: boolean;
}

export interface Role {
  id: string;
  name: string;
  description?: string;
  accessType: number; // [Flags] RoleAccessType
}

export interface LoginRequest {
  idToken: string;
}

export interface LoginResponse {
  sessionToken: string;
  user: User;
  roles: Role[];
  expiresAtUtc: string;
}

export interface AuthMeResponse {
  user: User;
  roles: Role[];
}

// ============================================
// CATALOG SERVICE TYPES
// ============================================

export interface Offer {
  id: string;
  name: string;
  description: string;
  formSchemaJson: string; // JSON Schema stringified
  isPublished: boolean;
  createdAtUtc: string;
  updatedAtUtc: string;
}

export interface OfferDetails extends Offer {
  executionTemplate?: ExecutionTemplate;
}

export interface ExecutionTemplate {
  id: string;
  offerId: string;
  executionType: 'AWX' | 'OO'; // AWX = Ansible, OO = Operations Orchestration
  targetIdentifier: string; // JobTemplate ID ou Flow UUID
  baseUrl: string;
  credentialsJson?: string; // Armazenado encriptado
}

// ============================================
// REQUESTS SERVICE TYPES
// ============================================

export enum RequestStatus {
  Pending = 0,
  Running = 1,
  Success = 2,
  Failed = 3,
}

export enum ExecutionResultType {
  Success = 0,
  Failed = 1,
  NoActionTaken = 2,
}

export interface Request {
  id: string;
  offerId: string;
  userId: string;
  status: RequestStatus;
  formDataJson: string; // Dados preenchidos
  executionResultType?: ExecutionResultType;
  errorMessage?: string;
  createdAtUtc: string;
  updatedAtUtc: string;
}

export interface CreateRequestDto {
  offerId: string;
  userId: string;
  formData: Record<string, unknown>; // Dados do formulário preenchidos
}

export interface RequestListResponse {
  items: Request[];
  total: number;
  page: number;
  pageSize: number;
}

// ============================================
// ORCHESTRATOR SERVICE TYPES
// ============================================

export enum ExecutionStatus {
  Pending = 0,
  Running = 1,
  Success = 2,
  Failed = 3,
}

export interface JobExecution {
  id: string;
  requestId: string;
  offerId: string;
  executionType: 'AWX' | 'OO';
  externalJobId?: string;
  status: ExecutionStatus;
  statusJson?: string;
  pollingAttemptsCount: number;
  lastPolledAtUtc?: string;
  sentToAwxOoAtUtc?: string;
  createdAtUtc: string;
  updatedAtUtc: string;
  completedAtUtc?: string;
}

// ============================================
// CONTEXT E HOOKS
// ============================================

export interface AuthContextType {
  user: User | null;
  roles: Role[];
  sessionToken: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
  error: string | null;
}
