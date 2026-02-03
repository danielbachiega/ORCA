/**
 * REQUEST DETAILS PAGE
 *
 * Detalhes de uma requisição específica
 */

'use client';

import React, { useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { catalogService, requestsService } from '@/services';
import { ProtectedRoute } from '@/components/protected-route';
import { AppHeader } from '@/components/app-header';
import { REQUEST_STATUS_COLORS, REQUEST_STATUS_LABELS } from '@/lib/constants';
import { ExecutionResultType, Request } from '@/lib/types';
import {
  Layout,
  Card,
  Button,
  Tag,
  Alert,
  Breadcrumb,
  Descriptions,
  Divider,
  List,
  Skeleton,
  Space,
  Typography,
} from 'antd';
import { ArrowLeftOutlined, ReloadOutlined } from '@ant-design/icons';
import styles from './request-details.module.css';

const { Content } = Layout;
const { Text, Title } = Typography;

const resultTypeLabels: Record<ExecutionResultType, string> = {
  [ExecutionResultType.Success]: 'Sucesso',
  [ExecutionResultType.Failed]: 'Falha',
  [ExecutionResultType.NoActionTaken]: 'Sem Ação',
};

function formatDate(date?: string) {
  if (!date) return '-';
  return new Date(date).toLocaleString('pt-BR');
}

function parseFormData(request?: Request) {
  const raw = request?.formData ?? request?.formDataJson;
  if (!raw) return null;

  try {
    const parsed = typeof raw === 'string' ? JSON.parse(raw) : raw;
    return parsed as Record<string, unknown>;
  } catch (error) {
    console.warn('⚠️ Falha ao parsear formData:', error);
    return { __raw: raw } as Record<string, unknown>;
  }
}

function RequestDetailsContent() {
  const router = useRouter();
  const params = useParams();
  const requestId = params.id as string;

  const {
    data: request,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: ['requests', requestId],
    queryFn: async () => {
      const result = await requestsService.getRequestById(requestId);
      console.log('✅ requestsService.getRequestById():', result);
      return result;
    },
    enabled: !!requestId,
    refetchInterval: (query) => {
      const data = query.state.data as Request | undefined;
      if (!data) return false;
      return data.status === 0 || data.status === 1 ? 5000 : false;
    },
  });

  const { data: offer } = useQuery({
    queryKey: ['offers', request?.offerId],
    queryFn: async () => {
      if (!request?.offerId) return null;
      return catalogService.getOfferById(request.offerId);
    },
    enabled: !!request?.offerId,
  });

  const formData = useMemo(() => parseFormData(request), [request]);

  const handleBack = () => router.back();

  const executionTargetLabel = request?.executionTargetType === 1 ? 'OO' : 'AWX';
  const executionResourceTypeLabel =
    request?.executionResourceType === 0
      ? 'JobTemplate'
      : request?.executionResourceType === 1
        ? 'Workflow'
        : '-';

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <AppHeader />

      <Content style={{ padding: '24px' }}>
        <div className={styles.container}>
          <Breadcrumb
            style={{ marginBottom: '24px' }}
            items={[
              {
                title: (
                  <Button type="text" size="small" onClick={handleBack} icon={<ArrowLeftOutlined />}>
                    Voltar
                  </Button>
                ),
              },
              { title: 'Detalhes da Requisição' },
            ]}
          />

          {(isLoading || !request) && (
            <Card loading>
              <Skeleton active paragraph={{ rows: 4 }} />
            </Card>
          )}

          {isError && (
            <Alert
              title="Erro ao carregar requisição"
              description={error instanceof Error ? error.message : 'Erro desconhecido'}
              type="error"
              showIcon
              style={{ marginBottom: '24px' }}
              action={
                <Button size="small" onClick={() => refetch()} icon={<ReloadOutlined />}>
                  Tentar novamente
                </Button>
              }
            />
          )}

          {request && (
            <>
              <Card style={{ marginBottom: '24px' }}>
                <div className={styles.header}>
                  <div>
                    <Text type="secondary">Requisição</Text>
                    <Title level={3} style={{ margin: 0 }}>
                      {offer?.name || request.offerName || request.offerId}
                    </Title>
                    <Text type="secondary">ID: {request.id}</Text>
                  </div>
                  <Space>
                    <Tag color={REQUEST_STATUS_COLORS[request.status]}>
                      {REQUEST_STATUS_LABELS[request.status]}
                    </Tag>
                    <Button onClick={() => refetch()} icon={<ReloadOutlined />}>
                      Atualizar
                    </Button>
                  </Space>
                </div>
              </Card>

              <Card style={{ marginBottom: '24px' }}>
                <Descriptions title="Resumo" column={2} bordered>
                  <Descriptions.Item label="Status">
                    <Tag color={REQUEST_STATUS_COLORS[request.status]}>
                      {REQUEST_STATUS_LABELS[request.status]}
                    </Tag>
                  </Descriptions.Item>
                  <Descriptions.Item label="Resultado">
                    {request.executionResultType !== undefined
                      ? resultTypeLabels[request.executionResultType]
                      : '-'}
                  </Descriptions.Item>
                  <Descriptions.Item label="Criada em">
                    {formatDate(request.createdAtUtc)}
                  </Descriptions.Item>
                  <Descriptions.Item label="Iniciada em">
                    {formatDate(request.startedAtUtc)}
                  </Descriptions.Item>
                  <Descriptions.Item label="Concluída em">
                    {formatDate(request.completedAtUtc)}
                  </Descriptions.Item>
                  <Descriptions.Item label="Erro">
                    {request.errorMessage || '-'}
                  </Descriptions.Item>
                </Descriptions>
              </Card>

              <Card style={{ marginBottom: '24px' }}>
                <Descriptions title="Execução" column={2} bordered>
                  <Descriptions.Item label="Target">
                    {executionTargetLabel}
                  </Descriptions.Item>
                  <Descriptions.Item label="Tipo de Recurso">
                    {executionResourceTypeLabel}
                  </Descriptions.Item>
                  <Descriptions.Item label="ID do Recurso">
                    {request.executionResourceId || '-'}
                  </Descriptions.Item>
                  <Descriptions.Item label="Execution ID">
                    {request.executionId || '-'}
                  </Descriptions.Item>
                  <Descriptions.Item label="Status AWX/OO">
                    {request.awxOoExecutionStatus || '-'}
                  </Descriptions.Item>
                </Descriptions>
              </Card>

              <Card>
                <Title level={4} style={{ marginBottom: '16px' }}>
                  Dados enviados
                </Title>
                {formData && Object.keys(formData).length > 0 ? (
                  <List
                    size="small"
                    bordered
                    dataSource={Object.entries(formData)}
                    renderItem={([key, value]) => (
                      <List.Item>
                        <Space direction="vertical" size={0}>
                          <Text strong>{key}</Text>
                          <Text type="secondary">
                            {typeof value === 'string' ? value : JSON.stringify(value)}
                          </Text>
                        </Space>
                      </List.Item>
                    )}
                  />
                ) : (
                  <Text type="secondary">Nenhum dado encontrado.</Text>
                )}
              </Card>

              <Divider />
            </>
          )}
        </div>
      </Content>
    </Layout>
  );
}

export default function RequestDetailsPage() {
  return (
    <ProtectedRoute>
      <RequestDetailsContent />
    </ProtectedRoute>
  );
}
