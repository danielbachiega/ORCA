/**
 * PROTECTED ROUTE WRAPPER
 * 
 * Redireciona usuários não autenticados pra login
 * Mostra loading enquanto restaura sessão
 */

'use client';

import React, { ReactNode, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/contexts/auth.context';
import { Spin } from 'antd';

interface ProtectedRouteProps {
  children: ReactNode;
  requiredRoles?: string[]; // opcional: validar roles específicas
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  requiredRoles,
}) => {
  const router = useRouter();
  const { isAuthenticated, isLoading, roles } = useAuth();

  // Redirecionar se não autenticado (usando useEffect para evitar renderização durante o render)
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, isLoading, router]);

  // Ainda carregando sessão
  if (isLoading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', flexDirection: 'column', gap: '16px' }}>
        <Spin size="large" />
        <p style={{ color: '#999' }}>Carregando...</p>
      </div>
    );
  }

  // Não autenticado
  if (!isAuthenticated) {
    return null;
  }

  // Validar roles (opcional)
  if (requiredRoles && requiredRoles.length > 0) {
    console.log('🔐 Validando roles:', { requiredRoles, userRoles: roles });
    const requiredRoleNames = requiredRoles.map((role) => role.toLowerCase());
    const userRoleNames = (roles || []).map((role) => role.name.toLowerCase());
    const hasRequiredRole = userRoleNames.some((roleName) =>
      requiredRoleNames.includes(roleName)
    );

    if (!hasRequiredRole) {
      return (
        <div style={{ padding: '32px', textAlign: 'center' }}>
          <h1>Acesso Negado</h1>
          <p>Você não tem permissão para acessar esta página.</p>
        </div>
      );
    }
  }

  return <>{children}</>;
};
