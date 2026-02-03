/**
 * MY REQUESTS PAGE
 * 
 * Listagem de requisições do usuário logado
 * - Status de cada requisição (Pendente, Em Execução, Concluída, Erro)
 * - Filtros por status
 * - Link pra detalhes
 */

'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { requestsService } from '@/services';
import { ProtectedRoute } from '@/components/protected-route';
import { AppHeader } from '@/components/app-header';
import { useAuth } from '@/lib/contexts/auth.context';
import {
  Layout,
  Card,
  Table,
  Button,
  Tag,
  Empty,
  Alert,
  Breadcrumb,
} from 'antd';
import { EyeOutlined } from '@ant-design/icons';
import { RequestStatus } from '@/lib/types';
import styles from './my-requests.module.css';

const { Content } = Layout;

const statusColors: Record<RequestStatus, string> = {
  [RequestStatus.Pending]: 'blue',
  [RequestStatus.Running]: 'processing',
  [RequestStatus.Success]: 'success',
  [RequestStatus.Failed]: 'error',
};

const statusLabels: Record<RequestStatus, string> = {
  [RequestStatus.Pending]: 'Pendente',
  [RequestStatus.Running]: 'Em Execução',
  [RequestStatus.Success]: 'Concluída',
  [RequestStatus.Failed]: 'Erro',
};

function MyRequestsContent() {
  const router = useRouter();
  const { user } = useAuth();
  const [page, setPage] = useState(1);
  const pageSize = 10;

  // Buscar requisições do usuário
  const {
    data: response,
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ['requests', 'user', user?.id, page],
    queryFn: async () => {
      if (!user?.id) {
        return { items: [], total: 0, page, pageSize };
      }

      const result = await requestsService.listRequestsByUser(user.id, page, pageSize);
      console.log('✅ requestsService.listRequestsByUser():', result);
      return result;
    },
    enabled: !!user?.id,
  });

  const handleViewDetails = (requestId: string) => {
    router.push(`/dashboard/requests/${requestId}`);
  };

  const handleBack = () => {
    router.back();
  };

  const columns = [
    {
      title: 'Oferta',
      dataIndex: 'offerName',
      key: 'offerName',
      width: 200,
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      width: 120,
      render: (status: RequestStatus) => (
        <Tag color={statusColors[status]}>
          {statusLabels[status]}
        </Tag>
      ),
    },
    {
      title: 'Criada em',
      dataIndex: 'createdAtUtc',
      key: 'createdAtUtc',
      width: 150,
      render: (date: string) =>
        new Date(date).toLocaleDateString('pt-BR'),
    },
    {
      title: 'Ações',
      key: 'actions',
      width: 100,
      render: (_: unknown, record: { id: string }) => (
        <Button
          type="primary"
          size="small"
          icon={<EyeOutlined />}
          onClick={() => handleViewDetails(record.id)}
        >
          Ver
        </Button>
      ),
    },
  ];

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <AppHeader />

      <Content style={{ padding: '24px' }}>
        <div className={styles.container}>
          {/* Breadcrumb */}
          <Breadcrumb
            style={{ marginBottom: '24px' }}
            items={[
              {
                title: <Button type="text" size="small" onClick={handleBack}>
                  Voltar
                </Button>,
              },
              {
                title: 'Minhas Requisições',
              },
            ]}
          />

          {/* Header */}
          <Card style={{ marginBottom: '24px' }}>
            <div className={styles.header}>
              <div>
                <h1>Minhas Requisições</h1>
                <p style={{ color: '#666' }}>
                  Acompanhe o status de todas as suas requisições
                </p>
              </div>
            </div>
          </Card>

          {/* Error */}
          {isError && (
            <Alert
              title="Erro ao carregar requisições"
              description={
                error instanceof Error
                  ? error.message
                  : 'Erro desconhecido'
              }
              type="error"
              showIcon
              style={{ marginBottom: '24px' }}
              action={
                <Button
                  size="small"
                  onClick={() => window.location.reload()}
                >
                  Tentar novamente
                </Button>
              }
            />
          )}

          {/* Tabela */}
          <Card loading={isLoading}>
            {!isLoading && response && (response.items?.length === 0 || response.items === undefined) ? (
              <Empty
                description="Nenhuma requisição encontrada"
                style={{ margin: '48px 0' }}
              />
            ) : (
              <Table
                columns={columns}
                dataSource={response?.items || []}
                rowKey="id"
                pagination={{
                  current: page,
                  pageSize,
                  total: response?.total || 0,
                  onChange: setPage,
                }}
                loading={isLoading}
              />
            )}
          </Card>

          {/* Info */}
          <Alert
            title="Dica"
            description="Clique em 'Ver' para acompanhar os detalhes e o histórico da sua requisição."
            type="info"
            showIcon
            style={{ marginTop: '24px' }}
          />
        </div>
      </Content>
    </Layout>
  );
}

export default function MyRequestsPage() {
  return (
    <ProtectedRoute>
      <MyRequestsContent />
    </ProtectedRoute>
  );
}
