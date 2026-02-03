/**
 * DASHBOARD PAGE
 * 
 * MVP - Lista de ofertas disponíveis
 * - Exibe ofertas em cards
 * - Link pra detalhes de cada oferta
 * - Protegida por autenticação
 */

'use client';

import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { catalogService } from '@/services';
import { ProtectedRoute } from '@/components/protected-route';
import { AppHeader } from '@/components/app-header';
import { useAuth } from '@/lib/contexts/auth.context';
import { Offer } from '@/lib/types';
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
  Input,
  Segmented,
  List,
  Collapse,
  Tag,
} from 'antd';
import { ArrowRightOutlined, BugOutlined, SearchOutlined, AppstoreOutlined, UnorderedListOutlined, TagsOutlined } from '@ant-design/icons';
import { useRouter } from 'next/navigation';
import styles from './dashboard.module.css';

const { Content } = Layout;

type ViewMode = 'cards' | 'list' | 'tags';

function DashboardContent() {
  const router = useRouter();
  const { roles } = useAuth();
  const [viewMode, setViewMode] = useState<ViewMode>('cards');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTag, setSelectedTag] = useState<string | null>(null);

  const isAdmin = roles && roles.length > 0 && roles.some((r) =>
    r.name.toLowerCase() === 'admin' || r.name.toLowerCase() === 'superadmin'
  );

  const isEditor = roles && roles.length > 0 && roles.some((r) =>
    r.name.toLowerCase() === 'editor'
  );

  const isConsumer = !isAdmin && !isEditor;

  const canViewDetails = isAdmin || isEditor;

  // TanStack Query - Buscar ofertas baseado em roles
  const {
    data: offers = [],
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: ['offers', roles],
    queryFn: async () => {
      if (!roles || roles.length === 0) {
        console.log('⚠️ Nenhuma role encontrada, retornando lista vazia');
        return [];
      }

      const roleNames = roles.map(r => r.name);
      console.log('📋 Buscando ofertas para roles:', roleNames);
      
      const result = await catalogService.listOffersByRoles(roleNames);
      console.log('✅ catalogService.listOffersByRoles():', result);
      result.forEach(offer => {
        console.log(`  - ${offer.name}: active=${offer.active}, visibleToRoles=${JSON.stringify(offer.visibleToRoles)}`);
      });
      return result;
    },
    staleTime: 0,
    enabled: !!roles && roles.length > 0,
  });

  // Refetch ao entrar na página (garantir dados frescos)
  React.useEffect(() => {
    console.log('🔍 Dashboard - isConsumer:', isConsumer);
    console.log('👤 Roles do usuário:', roles?.map(r => r.name).join(', '));
    refetch();
  }, [refetch, isConsumer, roles]);

  // Filtrar ofertas baseado em busca e tag selecionada
  const filteredOffers = useMemo(() => {
    return offers.filter((offer) => {
      // Consumers não veem ofertas inativas
      if (isConsumer && !offer.active) {
        console.log(`⏭️ Filtrando oferta inativa para consumer: ${offer.name} (active: ${offer.active})`);
        return false;
      }

      const matchesSearch =
        searchTerm === '' ||
        offer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (offer.description &&
          offer.description.toLowerCase().includes(searchTerm.toLowerCase()));

      const matchesTag =
        selectedTag === null ||
        (offer.tags && offer.tags.includes(selectedTag));

      return matchesSearch && matchesTag;
    });
  }, [offers, searchTerm, selectedTag, isConsumer]);

  // Agrupar ofertas por tags
  const offersByTag = useMemo(() => {
    const grouped: Record<string, typeof offers> = {};
    filteredOffers.forEach((offer) => {
      const tags = offer.tags && Array.isArray(offer.tags) ? offer.tags : ['Sem tag'];
      tags.forEach((tag) => {
        if (!grouped[tag]) {
          grouped[tag] = [];
        }
        grouped[tag].push(offer);
      });
    });
    return Object.entries(grouped).sort(([a], [b]) => a.localeCompare(b));
  }, [filteredOffers]);

  // Renderizar card individual
  const renderOfferCard = (offer: Offer) => (
    <Card
      key={offer.id}
      hoverable
      className={styles.offerCard}
      onClick={() => {
        if (canViewDetails) {
          router.push(`/dashboard/offers/${offer.id}`);
        }
      }}
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
      <div style={{ marginTop: '12px', marginBottom: '12px' }}>
        {offer.tags && offer.tags.length > 0 && (
          <Space size={4} wrap>
            {offer.tags.map((tag: string) => (
              <Tag key={tag} onClick={(e) => { e.stopPropagation(); setSelectedTag(tag); }}>
                {tag}
              </Tag>
            ))}
          </Space>
        )}
      </div>
      <div>
        <Space orientation="vertical" style={{ width: '100%' }}>
          <Badge
            status={offer.active ? 'success' : 'default'}
            text={offer.active ? 'Ativa' : 'Inativa'}
          />
          {canViewDetails && (
            <Button
              type="primary"
              block
              icon={<ArrowRightOutlined />}
              onClick={(e) => {
                e.stopPropagation();
                router.push(`/dashboard/offers/${offer.id}`);
              }}
            >
              Ver Detalhes
            </Button>
          )}
          {isConsumer && (
            <Button
              type="primary"
              block
              onClick={(e) => {
                e.stopPropagation();
                router.push(`/dashboard/offers/${offer.slug}/request`);
              }}
            >
              Solicitar
            </Button>
          )}
        </Space>
      </div>
    </Card>
  );

  // Renderizar linha da lista
  const renderListItem = (offer: Offer) => (
    <List.Item
      key={offer.id}
      style={{ cursor: 'pointer', padding: '16px', borderRadius: '4px' }}
      onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#fafafa')}
      onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
    >
      <List.Item.Meta
        avatar={<BugOutlined style={{ fontSize: '24px', color: '#1890ff' }} />}
        title={offer.name}
        description={
          <div>
            <p style={{ marginBottom: '8px' }}>{offer.description}</p>
            {offer.tags && offer.tags.length > 0 && (
              <Space size={4} wrap>
                {offer.tags.map((tag: string) => (
                  <Tag
                    key={tag}
                    onClick={(e) => { e.stopPropagation(); setSelectedTag(tag); }}
                  >
                    {tag}
                  </Tag>
                ))}
              </Space>
            )}
          </div>
        }
      />
      <div style={{ textAlign: 'right' }}>
        <Space>
          <Badge
            status={offer.active ? 'success' : 'default'}
            text={offer.active ? 'Ativa' : 'Inativa'}
          />
          {canViewDetails && (
            <Button
              type="primary"
              icon={<ArrowRightOutlined />}
              onClick={() => router.push(`/dashboard/offers/${offer.id}`)}
            >
              Ver Detalhes
            </Button>
          )}
          {isConsumer && (
            <Button
              type="primary"
              onClick={() => router.push(`/dashboard/offers/${offer.slug}/request`)}
            >
              Solicitar
            </Button>
          )}
        </Space>
      </div>
    </List.Item>
  );

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
            <Space>
              {isAdmin && (
                <Button
                  type="default"
                  onClick={() => router.push('/dashboard/admin/offers/new')}
                >
                  Criar Nova Oferta
                </Button>
              )}
              <Button
                type="primary"
                onClick={() => router.push('/dashboard/requests')}
              >
                Minhas Requisições
              </Button>
            </Space>
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

          {/* Controles de Filtro */}
          {!isLoading && offers.length > 0 && (
            <Card style={{ marginBottom: '24px' }}>
              <Space style={{ width: '100%' }} size="large" direction="vertical">
                {/* Barra de Busca */}
                <Input
                  placeholder="Buscar ofertas por nome ou descrição..."
                  prefix={<SearchOutlined />}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  allowClear
                  size="large"
                />

                {/* Modo de Visualização */}
                <div>
                  <div style={{ marginBottom: '8px', fontWeight: 500 }}>
                    Visualização:
                  </div>
                  <Segmented
                    value={viewMode}
                    onChange={(value) => setViewMode(value as ViewMode)}
                    options={[
                      {
                        label: 'Cards',
                        value: 'cards',
                        icon: <AppstoreOutlined />,
                      },
                      {
                        label: 'Lista',
                        value: 'list',
                        icon: <UnorderedListOutlined />,
                      },
                      {
                        label: 'Por Tags',
                        value: 'tags',
                        icon: <TagsOutlined />,
                      },
                    ]}
                  />
                </div>

                {/* Resultado da Busca */}
                {searchTerm && (
                  <div style={{ color: '#666' }}>
                    Encontradas <strong>{filteredOffers.length}</strong> oferta(s)
                  </div>
                )}
              </Space>
            </Card>
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

          {/* Visualização: Cards */}
          {!isLoading && filteredOffers.length > 0 && viewMode === 'cards' && (
            <Row gutter={[16, 16]}>
              {filteredOffers.map((offer) => (
                <Col key={offer.id} xs={24} sm={12} lg={8}>
                  {renderOfferCard(offer)}
                </Col>
              ))}
            </Row>
          )}

          {/* Visualização: Lista */}
          {!isLoading && filteredOffers.length > 0 && viewMode === 'list' && (
            <List
              dataSource={filteredOffers}
              renderItem={(offer) => renderListItem(offer)}
            />
          )}

          {/* Visualização: Agrupado por Tags */}
          {!isLoading && filteredOffers.length > 0 && viewMode === 'tags' && (
            <Collapse
              items={offersByTag.map(([tag, tagOffers]) => ({
                key: tag,
                label: (
                  <div>
                    <strong>{tag}</strong>
                    <Badge
                      count={tagOffers.length}
                      style={{ marginLeft: '8px', backgroundColor: '#1890ff' }}
                    />
                  </div>
                ),
                children: (
                  <Row gutter={[16, 16]}>
                    {tagOffers.map((offer) => (
                      <Col key={offer.id} xs={24} sm={12} lg={8}>
                        {renderOfferCard(offer)}
                      </Col>
                    ))}
                  </Row>
                ),
              }))}
            />
          )}

          {/* Sem Ofertas / Sem Resultados */}
          {!isLoading && offers.length === 0 && !isError && (
            <Empty
              description="Nenhuma oferta disponível"
              style={{ marginTop: '48px' }}
            />
          )}

          {!isLoading && offers.length > 0 && filteredOffers.length === 0 && !isError && (
            <Empty
              description="Nenhuma oferta encontrada com os filtros selecionados"
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
