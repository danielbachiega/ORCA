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
  roles?: Role[];
  ldapGroups?: string[];
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
  roles?: Role[];
  expiresAtUtc: string;
}

export type AuthMeResponse = User;

// ============================================
// CATALOG SERVICE TYPES
// ============================================

export interface Offer {
  id: string;
  slug: string;
  name: string;
  description?: string;
  tags: string[];
  active: boolean;
  createdAtUtc: string;
  updatedAtUtc?: string;
  formSchemaJson?: string; // TODO: adicionar ao backend
  visibleToRoles?: string[]; // Role names que podem ver a oferta
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
  offerName?: string;
  formData?: string;
  formDataJson?: string; // Compatibilidade
  executionTargetType?: number;
  executionResourceType?: number | null;
  executionResourceId?: string;
  executionId?: string;
  awxOoExecutionStatus?: string;
  executionResultType?: ExecutionResultType;
  errorMessage?: string;
  createdAtUtc: string;
  updatedAtUtc?: string;
  startedAtUtc?: string;
  completedAtUtc?: string;
}

export interface CreateRequestDto {
  offerId: string;
  formDefinitionId: string;
  userId: string;
  formData: Record<string, unknown>; // Dados do formulário preenchidos
  executionTargetType: number; // 0 = AWX, 1 = OO
  executionResourceType?: number | null; // 0 = JobTemplate, 1 = Workflow (null para OO)
  executionResourceId: string; // ID do job/workflow/flow
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
