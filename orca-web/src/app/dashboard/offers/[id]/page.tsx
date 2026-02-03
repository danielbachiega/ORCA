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

import React, { useMemo, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useQuery, useMutation } from '@tanstack/react-query';
import { catalogService } from '@/services';
import { ProtectedRoute } from '@/components/protected-route';
import { AppHeader } from '@/components/app-header';
import { FormsManagementModal } from '@/components/forms-management-modal';
import type { FormField } from '@/components/form-builder';
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
  Empty,
  Badge,
  Modal,
  message,
} from 'antd';
import { SendOutlined, EditOutlined, CalendarOutlined, TagOutlined, FileTextOutlined, UploadOutlined, DeleteOutlined } from '@ant-design/icons';
import styles from './offer-details.module.css';

const { Content } = Layout;

interface FormDefinition {
  id: string;
  offerId: string;
  version: number;
  isPublished: boolean;
  createdAtUtc: string;
  updatedAtUtc?: string;
  schemaJson?: string;
  executionTargetType?: 0 | 1 | null;
  executionResourceType?: 0 | 1 | null;
  executionResourceId?: string | null;
}

function OfferDetailsContent() {
  const router = useRouter();
  const params = useParams();
  const offerId = params.id as string;
  const { roles } = useAuth();
  const [formsModalVisible, setFormsModalVisible] = useState(false);
  const [formsModalMode, setFormsModalMode] = useState<'create' | 'edit'>('create');
  const [editingForm, setEditingForm] = useState<FormDefinition | null>(null);
  const [modalFields, setModalFields] = useState<FormField[]>([]);
  const [modalLoading, setModalLoading] = useState(false);
  const [executionTargetType, setExecutionTargetType] = useState<0 | 1 | null>(null);
  const [executionResourceType, setExecutionResourceType] = useState<0 | 1 | null>(null);
  const [executionResourceId, setExecutionResourceId] = useState<string | null>(null);
  const formsApiBase = process.env.NEXT_PUBLIC_FORMS_API ?? 'http://localhost:5003';

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

  // Formularios da oferta
  const {
    data: forms = [],
    isLoading: formsLoading,
    refetch: refetchForms,
  } = useQuery({
    queryKey: ['forms', offerId],
    queryFn: async () => {
      const response = await fetch(
        `${formsApiBase}/api/form-definitions/offer/${offerId}`
      );
      if (!response.ok) throw new Error('Erro ao buscar formulários');
      return response.json();
    },
    enabled: Boolean(offerId),
  });

  const publishMutation = useMutation({
    mutationFn: async (formId: string) => {
      const response = await fetch(
        `${formsApiBase}/api/form-definitions/${formId}/publish`,
        { method: 'POST' }
      );
      if (!response.ok) throw new Error('Erro ao publicar formulário');
      return response.json();
    },
    onSuccess: () => {
      refetchForms();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (formId: string) => {
      const response = await fetch(
        `${formsApiBase}/api/form-definitions/${formId}`,
        { method: 'DELETE' }
      );
      if (!response.ok) throw new Error('Erro ao deletar formulário');
      return response.json();
    },
    onSuccess: () => {
      refetchForms();
    },
  });

  const orderedForms = useMemo(() => {
    const publishedForm = forms.find((f: FormDefinition) => f.isPublished);
    const drafts = forms.filter((f: FormDefinition) => !f.isPublished);
    return [publishedForm, ...drafts].filter(Boolean);
  }, [forms]);

  const nextVersion = useMemo(() => {
    if (forms.length === 0) return 1;
    const maxVersion = Math.max(...forms.map((f: FormDefinition) => f.version));
    return maxVersion + 1;
  }, [forms]);

  const handleOpenCreateForm = () => {
    setEditingForm(null);
    setFormsModalMode('create');
    setModalFields([]);
    setExecutionTargetType(null);
    setExecutionResourceType(null);
    setExecutionResourceId(null);
    setFormsModalVisible(true);
  };

  const parseFieldsFromSchema = (schemaJson?: string): FormField[] => {
    if (!schemaJson) return [];
    try {
      const parsed = JSON.parse(schemaJson);
      if (Array.isArray(parsed?.fields)) {
        return parsed.fields as FormField[];
      }
      message.warning('Schema atual não está no formato do builder visual');
      return [];
    } catch {
      message.error('Erro ao ler o schema do formulário');
      return [];
    }
  };

  const handleOpenEditForm = async (formDef: FormDefinition) => {
    try {
      setModalLoading(true);
      const response = await fetch(
        `${formsApiBase}/api/form-definitions/${formDef.id}`
      );
      if (!response.ok) throw new Error('Erro ao carregar formulário');
      const details = await response.json();

      setEditingForm({
        ...formDef,
        version: details?.version ?? formDef.version,
        isPublished: details?.isPublished ?? formDef.isPublished,
      });
      setModalFields(parseFieldsFromSchema(details?.schemaJson));
      setExecutionTargetType(details?.executionTargetType ?? null);
      setExecutionResourceType(details?.executionResourceType ?? null);
      setExecutionResourceId(details?.executionResourceId ?? null);
      setFormsModalMode('edit');
      setFormsModalVisible(true);
    } catch {
      message.error('Não foi possível carregar o formulário');
    } finally {
      setModalLoading(false);
    }
  };

  const handleDeleteForm = (formDef: FormDefinition) => {
    Modal.confirm({
      title: 'Excluir formulário?',
      content: formDef.isPublished
        ? 'Este formulário está publicado. Tem certeza que deseja excluir?'
        : 'Esta ação não pode ser desfeita.',
      okText: 'Excluir',
      cancelText: 'Cancelar',
      okButtonProps: { danger: true },
      onOk: async () => {
        await deleteMutation.mutateAsync(formDef.id);
      },
    });
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
                      <>
                        <Button
                          icon={<EditOutlined />}
                          onClick={() => router.push(`/dashboard/admin/offers/${offerId}/edit`)}
                        >
                          Editar
                        </Button>
                      </>
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

              {/* Formulários da Oferta */}
              {isAdmin && (
                <Card
                  title={
                    <Space>
                      <FileTextOutlined />
                      <span>Formulários da Oferta</span>
                      <Badge
                        count={forms.length}
                        style={{ backgroundColor: '#1890ff' }}
                      />
                    </Space>
                  }
                  extra={
                    <Button
                      type="primary"
                      onClick={handleOpenCreateForm}
                    >
                      Criar Formulário
                    </Button>
                  }
                  style={{ marginBottom: '24px' }}
                >
                  {formsLoading ? (
                    <Skeleton active paragraph={{ rows: 3 }} />
                  ) : forms.length === 0 ? (
                    <Empty description="Nenhum formulário criado" />
                  ) : (
                    <div>
                      {orderedForms.map((formDef: FormDefinition) => (
                        <div
                          key={formDef.id}
                          style={{
                            padding: '12px',
                            marginBottom: '12px',
                            border: '1px solid #e8e8e8',
                            borderRadius: '4px',
                            backgroundColor: formDef.isPublished ? '#fafafa' : '#ffffff',
                          }}
                        >
                          <div
                            style={{
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'center',
                            }}
                          >
                            <Space>
                              {formDef.isPublished && (
                                <Tag color="green">Ativo</Tag>
                              )}
                              {!formDef.isPublished && <Tag>Draft</Tag>}
                              <span style={{ fontWeight: 500 }}>
                                v{formDef.version}
                              </span>
                              <span style={{ color: '#999', fontSize: '12px' }}>
                                {new Date(formDef.createdAtUtc).toLocaleDateString(
                                  'pt-BR'
                                )}
                              </span>
                            </Space>

                            <Space size="small">
                              <Button
                                size="small"
                                icon={<EditOutlined />}
                                onClick={() => handleOpenEditForm(formDef)}
                              >
                                Editar
                              </Button>
                              {!formDef.isPublished && (
                                <Button
                                  type="primary"
                                  size="small"
                                  icon={<UploadOutlined />}
                                  loading={publishMutation.isPending}
                                  onClick={() => publishMutation.mutate(formDef.id)}
                                >
                                  Publicar
                                </Button>
                              )}
                              <Button
                                danger
                                size="small"
                                icon={<DeleteOutlined />}
                                loading={deleteMutation.isPending}
                                onClick={() => handleDeleteForm(formDef)}
                              />
                            </Space>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </Card>
              )}
            </div>
          )}

          {/* Forms Management Modal */}
          <FormsManagementModal
            visible={formsModalVisible}
            onClose={() => {
              setFormsModalVisible(false);
              setExecutionTargetType(null);
              setExecutionResourceType(null);
              setExecutionResourceId(null);
            }}
            offerId={offerId}
            mode={formsModalMode}
            editingFormId={editingForm?.id ?? null}
            editingFormVersion={editingForm?.version ?? null}
            editingIsPublished={editingForm?.isPublished ?? false}
            nextVersion={nextVersion}
            fields={modalFields}
            onChange={setModalFields}
            isLoading={modalLoading}
            onSaved={() => refetchForms()}
            executionTargetType={executionTargetType}
            onExecutionTargetTypeChange={setExecutionTargetType}
            executionResourceType={executionResourceType}
            onExecutionResourceTypeChange={setExecutionResourceType}
            executionResourceId={executionResourceId}
            onExecutionResourceIdChange={setExecutionResourceId}
          />
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
