/**
 * DASHBOARD PAGE
 * 
 * MVP - Lista de ofertas disponíveis
 * - Exibe ofertas em cards
 * - Link pra detalhes de cada oferta
 * - Protegida por autenticação
 */

'use client';

import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { catalogService } from '@/services';
import { ProtectedRoute } from '@/components/protected-route';
import { AppHeader } from '@/components/app-header';
import {
  Layout,
  Card,
  Row,
  Col,
  Skeleton,
  Empty,
  Alert,
  Button,
  Space,
  Badge,
} from 'antd';
import { ArrowRightOutlined, BugOutlined } from '@ant-design/icons';
import { useRouter } from 'next/navigation';
import styles from './dashboard.module.css';

const { Content } = Layout;

function DashboardContent() {
  const router = useRouter();

  // TanStack Query - Buscar ofertas
  const {
    data: offers = [],
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ['offers'],
    queryFn: async () => {
      const result = await catalogService.listOffers();
      console.log('✅ catalogService.listOffers():', result);
      return result;
    },
  });

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <AppHeader />

      <Content style={{ padding: '24px' }}>
        <div className={styles.container}>
          {/* Header */}
          <div className={styles.header}>
            <div>
              <h1>Minhas Ofertas</h1>
              <p>Selecione uma oferta para preencher formulário e criar requisição</p>
            </div>
          </div>

          {/* Erro */}
          {isError && (
            <Alert
              title="Erro ao carregar ofertas"
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

          {/* Skeleton Loading */}
          {isLoading && (
            <Row gutter={[16, 16]}>
              {Array.from({ length: 6 }).map((_, i) => (
                <Col key={i} xs={24} sm={12} lg={8}>
                  <Skeleton active paragraph={{ rows: 3 }} />
                </Col>
              ))}
            </Row>
          )}

          {/* Ofertas Grid */}
          {!isLoading && offers.length > 0 && (
            <Row gutter={[16, 16]}>
              {offers.map((offer) => (
                <Col key={offer.id} xs={24} sm={12} lg={8}>
                  <Card
                    hoverable
                    className={styles.offerCard}
                    onClick={() => router.push(`/dashboard/offers/${offer.id}`)}
                    cover={
                      <div className={styles.cardCover}>
                        <BugOutlined style={{ fontSize: '48px', color: '#1890ff' }} />
                      </div>
                    }
                  >
                    <Card.Meta
                      title={offer.name}
                      description={offer.description}
                    />

                    <div style={{ marginTop: '16px' }}>
                      <Space orientation="vertical" style={{ width: '100%' }}>
                        <Badge
                          status={offer.isPublished ? 'success' : 'default'}
                          text={
                            offer.isPublished ? 'Publicada' : 'Rascunho'
                          }
                        />
                        <Button
                          type="primary"
                          block
                          icon={<ArrowRightOutlined />}
                        >
                          Ver Detalhes
                        </Button>
                      </Space>
                    </div>
                  </Card>
                </Col>
              ))}
            </Row>
          )}

          {/* Sem Ofertas */}
          {!isLoading && offers.length === 0 && !isError && (
            <Empty
              description="Nenhuma oferta disponível"
              style={{ marginTop: '48px' }}
            />
          )}
        </div>
      </Content>
    </Layout>
  );
}

export default function DashboardPage() {
  return (
    <ProtectedRoute>
      <DashboardContent />
    </ProtectedRoute>
  );
}
