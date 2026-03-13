/**
 * PROVIDERS WRAPPER
 * 
 * Agrupa todos os providers (Context, QueryClient, etc)
 * Permite reutilizar em tests e em app
 */

'use client';

import React, { ReactNode } from 'react';
import { QueryClientProvider } from '@tanstack/react-query';
import { ConfigProvider, theme as antdTheme } from 'antd';
import { AuthProvider } from '@/lib/contexts/auth.context';
import { ThemeProvider, useThemeMode } from '@/lib/contexts/theme.context';
import { queryClient } from '@/lib/utils/query-client';

const ProvidersContent: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { themeMode } = useThemeMode();

  return (
    <ConfigProvider
      theme={{
        algorithm:
          themeMode === 'dark'
            ? antdTheme.darkAlgorithm
            : antdTheme.defaultAlgorithm,
      }}
    >
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          {children}
        </AuthProvider>
      </QueryClientProvider>
    </ConfigProvider>
  );
};

export const Providers: React.FC<{ children: ReactNode }> = ({ children }) => {
  return (
    <ThemeProvider>
      <ProvidersContent>{children}</ProvidersContent>
    </ThemeProvider>
  );
};
