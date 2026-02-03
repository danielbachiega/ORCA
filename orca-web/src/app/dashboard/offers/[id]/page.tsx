/**
 * OFFER DETAILS PAGE
 * 
 * Exibe detalhes completos de uma oferta
 * - Descrição completa
 * - Tags
 * - Formulário (quando disponível)
 * - Botão pra submeter requisição
 */

'use client';

import React from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { catalogService } from '@/services';
import { ProtectedRoute } from '@/components/protected-route';
import { AppHeader } from '@/components/app-header';
import { useAuth } from '@/lib/contexts/auth.context';
import {
  Layout,
  Card,
  Button,
  Skeleton,
  Alert,
  Tag,
  Space,
  Divider,
  Row,
  Col,
} from 'antd';
import { SendOutlined, EditOutlined, CalendarOutlined, TagOutlined } from '@ant-design/icons';
import styles from './offer-details.module.css';

const { Content } = Layout;

function OfferDetailsContent() {
  const router = useRouter();
  const params = useParams();
  const offerId = params.id as string;
  const { roles } = useAuth();

  const isAdmin = roles && roles.length > 0 && roles.some((r) =>
    r.name.toLowerCase() === 'admin' || r.name.toLowerCase() === 'superadmin'
  );

  // Buscar detalhes da oferta
  const {
    data: offer,
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ['offers', offerId],
    queryFn: async () => {
      const result = await catalogService.getOfferById(offerId);
      console.log('✅ catalogService.getOfferById():', result);
      return result;
    },
  });

  const handleCreateRequest = () => {
    // TODO: Implementar formulário de requisição
    // Por enquanto, vai pra página de submissão
    router.push(`/dashboard/offers/${offerId}/request`);
  };

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <AppHeader />

      <Content style={{ padding: '24px' }}>
        <div className={styles.container}>
          {/* Loading */}
          {isLoading && (
            <Card loading style={{ marginBottom: '24px' }}>
              <Skeleton active paragraph={{ rows: 4 }} />
            </Card>
          )}

          {/* Error */}
          {isError && (
            <Alert
              title="Erro ao carregar oferta"
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

          {/* Detalhes */}
          {offer && !isLoading && (
            <div className={styles.detailsContainer}>
              {/* Header com título e ações */}
              <Card style={{ marginBottom: '24px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                  <div style={{ flex: 1 }}>
                    <Space orientation="vertical" size={4}>
                      <h1 style={{ margin: 0, fontSize: '28px', fontWeight: 600 }}>
                        {offer.name}
                      </h1>
                      <Space size={8}>
                        <Tag color={offer.active ? 'green' : 'default'}>
                          {offer.active ? 'Ativa' : 'Inativa'}
                        </Tag>
                        <span style={{ color: '#999', fontSize: '14px' }}>
                          ID: {offer.id}
                        </span>
                      </Space>
                    </Space>
                  </div>
                  
                  {/* Ações no topo */}
                  <Space size="middle">
                    {isAdmin && (
                      <Button
                        icon={<EditOutlined />}
                        onClick={() => router.push(`/dashboard/admin/offers/${offerId}/edit`)}
                      >
                        Editar
                      </Button>
                    )}
                    <Button
                      type="primary"
                      size="large"
                      icon={<SendOutlined />}
                      onClick={handleCreateRequest}
                    >
                      Criar Requisição
                    </Button>
                  </Space>
                </div>

                {/* Descrição inline no mesmo card */}
                {offer.description && (
                  <>
                    <Divider style={{ margin: '16px 0' }} />
                    <div>
                      <h3 style={{ fontSize: '16px', marginBottom: '12px', color: '#666' }}>
                        Descrição
                      </h3>
                      <p style={{ fontSize: '15px', lineHeight: '1.6', color: '#333' }}>
                        {offer.description}
                      </p>
                    </div>
                  </>
                )}

                {/* Tags */}
                {offer.tags && offer.tags.length > 0 && (
                  <>
                    <Divider style={{ margin: '16px 0' }} />
                    <div>
                      <Space size={[0, 8]} wrap>
                        <TagOutlined style={{ color: '#999', fontSize: '14px' }} />
                        {offer.tags.map((tag) => (
                          <Tag key={tag} color="blue">
                            {tag}
                          </Tag>
                        ))}
                      </Space>
                    </div>
                  </>
                )}

                {/* Informações de data */}
                <Divider style={{ margin: '16px 0' }} />
                <Row gutter={[24, 16]}>
                  <Col xs={24} sm={12}>
                    <Space orientation="vertical" size={4}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <CalendarOutlined style={{ color: '#999', fontSize: '14px' }} />
                        <span style={{ fontSize: '13px', color: '#999' }}>Criada em</span>
                      </div>
                      <span style={{ fontSize: '15px', fontWeight: 500 }}>
                        {new Date(offer.createdAtUtc).toLocaleDateString('pt-BR', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                        })}
                      </span>
                    </Space>
                  </Col>
                  
                  {offer.updatedAtUtc && (
                    <Col xs={24} sm={12}>
                      <Space orientation="vertical" size={4}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <CalendarOutlined style={{ color: '#999', fontSize: '14px' }} />
                          <span style={{ fontSize: '13px', color: '#999' }}>Última atualização</span>
                        </div>
                        <span style={{ fontSize: '15px', fontWeight: 500 }}>
                          {new Date(offer.updatedAtUtc).toLocaleDateString('pt-BR', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                          })}
                        </span>
                      </Space>
                    </Col>
                  )}
                </Row>
              </Card>

              {/* Description */}
              {offer.description && (
                <Card
                  title="Descrição"
                  style={{ marginBottom: '24px' }}
                  className={styles.descriptionCard}
                >
                  <p>{offer.description}</p>
                </Card>
              )}

              {/* Metadata */}
              <Card title="Informações" style={{ marginBottom: '24px' }}>
                <div className={styles.metadata}>
                  <div className={styles.metadataItem}>
                    <span className={styles.label}>Criada em:</span>
                    <span>
                      {new Date(offer.createdAtUtc).toLocaleDateString(
                        'pt-BR',
                        {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                        }
                      )}
                    </span>
                  </div>
                  {offer.updatedAtUtc && (
                    <div className={styles.metadataItem}>
                      <span className={styles.label}>Atualizada em:</span>
                      <span>
                        {new Date(offer.updatedAtUtc).toLocaleDateString(
                          'pt-BR',
                          {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                          }
                        )}
                      </span>
                    </div>
                  )}
                </div>
              </Card>

              {/* JSON Schema */}
              {offer.formSchemaJson && (
                <Card title="Formulário" style={{ marginBottom: '24px' }}>
                  <Alert
                    message="Formulário dinâmico"
                    description="Será renderizado aqui (JSON Schema → Uniforms)"
                    type="info"
                    showIcon
                  />
                  {/* TODO: Renderizar formulário aqui */}
                </Card>
              )}
            </div>
          )}
        </div>
      </Content>
    </Layout>
  );
}

export default function OfferDetailsPage() {
  return (
    <ProtectedRoute>
      <OfferDetailsContent />
    </ProtectedRoute>
  );
}
