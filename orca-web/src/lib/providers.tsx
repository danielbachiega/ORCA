/**
 * PROVIDERS WRAPPER
 * 
 * Agrupa todos os providers (Context, QueryClient, etc)
 * Permite reutilizar em tests e em app
 */

'use client';

import React, { ReactNode } from 'react';
import { QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from '@/lib/contexts/auth.context';
import { queryClient } from '@/lib/utils/query-client';

export const Providers: React.FC<{ children: ReactNode }> = ({ children }) => {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        {children}
      </AuthProvider>
    </QueryClientProvider>
  );
};
