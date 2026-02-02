/**
 * TANSTACK QUERY CONFIG
 * 
 * POR QUÊ TanStack Query?
 * - Gerencia cache de requisições automaticamente
 * - Deduplicação de requisições simultâneas
 * - Refetch automático em background
 * - Não precisa de Redux/Zustand pra server state
 * - Rastreamento de loading/error/success
 * 
 * PADRÃO:
 * - useQuery para GET (leitura)
 * - useMutation para POST/PUT/DELETE (escrita)
 */

import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutos
      gcTime: 1000 * 60 * 10, // 10 minutos (antes: cacheTime)
      retry: 1,
      refetchOnWindowFocus: true,
      refetchOnReconnect: true,
    },
    mutations: {
      retry: 1,
    },
  },
});
