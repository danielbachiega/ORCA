/**
 * AUTH CONTEXT - Gerenciamento de Estado de Autenticação
 * 
 * PADRÃO: React Context API (não precisa Zustand pra esse caso)
 * 
 * POR QUÊ Context API e não Zustand?
 * - Context API é mais leve para 1 estado (autenticação)
 * - Zustand é melhor pra estado UI complexo (múltiplos slices)
 * - Pode migrar pra Zustand depois se precisar
 * 
 * CICLO DE VIDA:
 * 1. Inicializa, verifica localStorage por token
 * 2. Se houver token, faz GET /api/auth/me pra restaurar user
 * 3. Disponibiliza user, roles, sessionToken pra app toda
 * 4. Login() faz POST, salva token e user em localStorage
 * 5. Logout() limpa localStorage e estado
 */

'use client';

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  ReactNode,
} from 'react';
import { identityService } from '@/services';
import {
  User,
  Role,
  AuthContextType,
  LoginResponse,
} from '@/lib/types';
import { TOKEN_STORAGE_KEY, USER_STORAGE_KEY } from '@/lib/constants';

// 1. Criar o contexto
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// 2. Provider (wrapper)
export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [roles, setRoles] = useState<Role[]>([]);
  const [sessionToken, setSessionToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Restaurar sessão ao inicializar (hydration)
  useEffect(() => {
    const restoreSession = async () => {
      try {
        const storedToken = localStorage.getItem(TOKEN_STORAGE_KEY);
        const storedUser = localStorage.getItem(USER_STORAGE_KEY);

        if (storedToken && storedUser) {
          try {
            // Token existe, validar no backend
            setSessionToken(storedToken);
            identityService.setToken(storedToken);

            const response = await identityService.getMe();
            console.log('✅ getMe response:', response);
            setUser(response);
            setRoles(response.roles || []);
          } catch (err) {
            console.error('❌ getMe error (token expirado?):', err);
            // Token expirado ou inválido, limpar
            localStorage.removeItem(TOKEN_STORAGE_KEY);
            localStorage.removeItem(USER_STORAGE_KEY);
            setSessionToken(null);
            setUser(null);
            setRoles([]);
            identityService.clearToken();
          }
        } else {
          // Sem token salvo
          setSessionToken(null);
          setUser(null);
          setRoles([]);
        }
      } catch (err) {
        console.error('Erro ao restaurar sessão:', err);
        setError('Erro ao restaurar sessão');
      } finally {
        setIsLoading(false);
      }
    };

    restoreSession();

    // Listener para evento de desautenticação (401 response)
    const handleUnauthorized = () => {
      logout();
    };

    window.addEventListener('auth:unauthorized', handleUnauthorized);
    return () =>
      window.removeEventListener('auth:unauthorized', handleUnauthorized);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Login: OIDC token → sessionToken
  const login = useCallback(async (username: string, password: string) => {
    setIsLoading(true);
    setError(null);

    try {
      const response: LoginResponse =
        await identityService.login(username, password);

      // Salvar em estado
      setSessionToken(response.sessionToken);
      setUser(response.user);
      setRoles(response.roles || response.user.roles || []);

      // Salvar em localStorage pra persistência
      localStorage.setItem(TOKEN_STORAGE_KEY, response.sessionToken);
      localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(response.user));

      // Atualizar token em todos os services
      identityService.setToken(response.sessionToken);
    } catch (err: unknown) {
      const errorMessage = 
        err instanceof Error 
          ? err.message 
          : 'Erro no login';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Logout
  const logout = useCallback(() => {
    // Limpar estado
    setUser(null);
    setRoles([]);
    setSessionToken(null);
    setError(null);

    // Limpar localStorage
    localStorage.removeItem(TOKEN_STORAGE_KEY);
    localStorage.removeItem(USER_STORAGE_KEY);

    // Limpar token em todos os services
    identityService.clearToken();
  }, []);

  const value: AuthContextType = {
    user,
    roles,
    sessionToken,
    isLoading,
    isAuthenticated: !!user && !!sessionToken,
    login,
    logout,
    error,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

// 3. Hook customizado
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    // Retornar contexto vazio em vez de throw error (fallback)
    return {
      user: null,
      roles: [],
      sessionToken: null,
      isLoading: false,
      isAuthenticated: false,
      login: async () => {
        throw new Error('useAuth deve ser usado dentro de <AuthProvider>');
      },
      logout: () => {
        throw new Error('useAuth deve ser usado dentro de <AuthProvider>');
      },
      error: 'useAuth deve ser usado dentro de <AuthProvider>',
    };
  }
  return context;
};
