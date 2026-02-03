/**
 * REQUEST FORM PAGE
 * 
 * Formulário pra criar uma nova requisição
 * - Seleção da oferta (já pre-preenchida)
 * - Formulário dinâmico (JSON Schema) - TODO
 * - Submissão e confirmação
 */

'use client';

import React, { useState, useMemo } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useQuery, useMutation } from '@tanstack/react-query';
import { catalogService, formsService, requestsService } from '@/services';
import { ProtectedRoute } from '@/components/protected-route';
import { AppHeader } from '@/components/app-header';
import { useAuth } from '@/lib/contexts/auth.context';
import type { FormField } from '@/components/form-builder';
import {
  Layout,
  Card,
  Button,
  Form,
  Skeleton,
  Alert,
  Spin,
  Space,
  Input,
  Breadcrumb,
  message,
  Select,
  InputNumber,
  Checkbox,
  Empty,
} from 'antd';
import { ArrowLeftOutlined, SendOutlined } from '@ant-design/icons';
import styles from './request-form.module.css';

const { Content } = Layout;

interface FormDefinition {
  id: string;
  offerId: string;
  version: number;
  isPublished: boolean;
  createdAtUtc: string;
  updatedAtUtc?: string;
  schemaJson?: string;
}

// Componente para renderizar campos com visibilidade condicional
function DynamicFormFields({ fields }: { fields: FormField[] }) {
  const form = Form.useFormInstance();
  const formValues = Form.useWatch([], form);

  const isFieldVisible = (field: FormField): boolean => {
    if (!field.visibilityCondition) return true;

    const { fieldKey, operator, value } = field.visibilityCondition;
    const fieldValue = formValues?.[fieldKey];

    switch (operator) {
      case 'equals':
        return fieldValue === value;
      case 'notEquals':
        return fieldValue !== value;
      case 'contains':
        return String(fieldValue || '').includes(String(value));
      default:
        return true;
    }
  };

  return (
    <>
      {fields.map((field) => {
        if (!isFieldVisible(field)) return null;

        // Campo de texto
        if (field.type === 'text' || field.type === 'email') {
          return (
            <Form.Item
              key={field.key}
              name={field.key}
              label={field.label}
              rules={[
                {
                  required: field.required,
                  message: `${field.label} é obrigatório`,
                },
                field.type === 'email'
                  ? {
                      type: 'email',
                      message: 'Email inválido',
                    }
                  : {},
              ]}
              tooltip={field.description}
            >
              <Input
                placeholder={field.placeholder}
                type={field.type}
              />
            </Form.Item>
          );
        }

        // Campo numérico
        if (field.type === 'number') {
          return (
            <Form.Item
              key={field.key}
              name={field.key}
              label={field.label}
              rules={[
                {
                  required: field.required,
                  message: `${field.label} é obrigatório`,
                },
              ]}
              tooltip={field.description}
            >
              <InputNumber
                placeholder={field.placeholder}
                style={{ width: '100%' }}
              />
            </Form.Item>
          );
        }

        // Campo select
        if (field.type === 'select' && field.options) {
          return (
            <Form.Item
              key={field.key}
              name={field.key}
              label={field.label}
              rules={[
                {
                  required: field.required,
                  message: `${field.label} é obrigatório`,
                },
              ]}
              tooltip={field.description}
            >
              <Select
                placeholder={field.placeholder}
                options={field.options}
              />
            </Form.Item>
          );
        }

        // Campo checkbox
        if (field.type === 'checkbox') {
          return (
            <Form.Item
              key={field.key}
              name={field.key}
              valuePropName="checked"
              tooltip={field.description}
            >
              <Checkbox>{field.label}</Checkbox>
            </Form.Item>
          );
        }

        // Campo textarea
        if (field.type === 'textarea') {
          return (
            <Form.Item
              key={field.key}
              name={field.key}
              label={field.label}
              rules={[
                {
                  required: field.required,
                  message: `${field.label} é obrigatório`,
                },
              ]}
              tooltip={field.description}
            >
              <Input.TextArea
                placeholder={field.placeholder}
                rows={4}
              />
            </Form.Item>
          );
        }

        return null;
      })}
    </>
  );
}

function RequestFormContent() {
  const router = useRouter();
  const params = useParams();
  const offerSlug = params.id as string;
  const { user } = useAuth();
  const [form] = Form.useForm();
  const [formData, setFormData] = useState<Record<string, unknown>>({});
  const formsApiBase = process.env.NEXT_PUBLIC_FORMS_API ?? 'http://localhost:5003';

  // Buscar detalhes da oferta
  const {
    data: offer,
    isLoading: isLoadingOffer,
    isError: isErrorOffer,
    error: errorOffer,
  } = useQuery({
    queryKey: ['offers', 'slug', offerSlug],
    queryFn: async () => {
      const offers = await catalogService.listOffers();
      const found = offers.find((o) => o.slug === offerSlug || o.id === offerSlug);
      if (!found) throw new Error('Oferta não encontrada');
      return found;
    },
  });

  // Buscar formulário publicado da oferta
  const {
    data: publishedForm,
    isLoading: isLoadingForm,
    isError: isErrorForm,
    error: errorForm,
  } = useQuery({
    queryKey: ['forms', offer?.id, 'published'],
    queryFn: async () => {
      if (!offer?.id) return null;
      console.log('🔍 Buscando formulário publicado para oferta:', offer.id);
      console.log('📍 Forms API Base:', formsApiBase);
      
      const url = `${formsApiBase}/api/form-definitions/offer/${offer.id}/published`;
      console.log('🌐 URL completa:', url);
      
      const response = await fetch(url);
      
      console.log('📡 Response status:', response.status);
      console.log('📡 Response ok:', response.ok);
      
      if (response.status === 404) {
        console.log('⚠️ Nenhum formulário publicado encontrado');
        return null;
      }
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Erro na resposta:', errorText);
        throw new Error(`Erro ao buscar formulário: ${response.status} - ${errorText}`);
      }
      
      const data = await response.json();
      console.log('✅ Formulário publicado recebido:', data);
      
      return data as FormDefinition;
    },
    enabled: !!offer?.id,
  });

  // Buscar ExecutionTemplate da oferta
  const {
    data: executionTemplate,
    isLoading: isLoadingTemplate,
  } = useQuery({
    queryKey: ['execution-template', publishedForm?.id],
    queryFn: async () => {
      if (!publishedForm?.id) return null;
      console.log('🔍 Buscando ExecutionTemplate para FormDefinition:', publishedForm.id);
      try {
        const result = await formsService.getExecutionTemplateByFormDefinitionId(publishedForm.id);
        console.log('✅ ExecutionTemplate recebido:', result);
        return result;
      } catch (error) {
        console.warn('⚠️ ExecutionTemplate não encontrado:', error);
        return null;
      }
    },
    enabled: !!publishedForm?.id,
  });

  // Pegar apenas o formulário publicado (agora já vem do endpoint correto)
  const hasPublishedForm = useMemo(() => {
    console.log('📋 Formulário publicado:', publishedForm);
    console.log('📝 Schema JSON presente:', !!publishedForm?.schemaJson);
    return !!publishedForm;
  }, [publishedForm]);

  // Converter schema JSON para array de campos
  const formFields = useMemo<FormField[]>(() => {
    if (!publishedForm?.schemaJson) {
      console.log('⚠️ Sem schemaJson no formulário publicado');
      return [];
    }
    
    console.log('🔄 Convertendo schema JSON:', publishedForm.schemaJson);
    
    try {
      const schema = JSON.parse(publishedForm.schemaJson);
      console.log('📦 Schema parseado:', schema);
      
      // Verificar se é formato customizado (fields array) ou JSON Schema padrão (properties)
      if (schema.fields && Array.isArray(schema.fields)) {
        console.log('✅ Formato customizado detectado (fields array)');
        console.log('📝 Total de campos:', schema.fields.length);
        console.log('📋 Campos:', schema.fields);
        return schema.fields as FormField[];
      }
      
      // Formato JSON Schema padrão
      console.log('✅ Formato JSON Schema padrão detectado');
      const properties = schema.properties || {};
      const required = schema.required || [];
      
      console.log('🔑 Properties:', properties);
      console.log('✅ Required:', required);

      const fields = Object.entries(properties).map(([key, prop]) => {
        const property = prop as Record<string, unknown>;
        const fieldType = property.type === 'integer' ? 'number' : ((property.type as string) || 'text');

        const field = {
          id: key,
          key,
          label: (property.title as string) || key,
          type: fieldType as FormField['type'],
          required: required.includes(key),
          placeholder: (property.description as string) || '',
          description: (property.description as string) || '',
          options: property.enum
            ? (property.enum as string[]).map((value: string) => ({ label: value, value }))
            : undefined,
          visibilityCondition: property.visibilityCondition as FormField['visibilityCondition'],
        };
        
        console.log('🔨 Campo criado:', field);
        return field;
      });
      
      console.log('📝 Total de campos criados:', fields.length);
      console.log('📋 Campos finais:', fields);
      
      return fields;
    } catch (error) {
      console.error('❌ Erro ao parsear schema JSON:', error);
      return [];
    }
  }, [publishedForm]);

  // Mutation pra submeter requisição
  const {
    mutate: submitRequest,
    isPending: isSubmitting,
    isError: isSubmitError,
    error: submitError,
  } = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error('Usuário não autenticado');
      if (!offer?.id) throw new Error('Oferta inválida');
      if (!publishedForm?.id) throw new Error('Formulário não encontrado');
      if (!executionTemplate) throw new Error('Configuração de execução não encontrada');

      console.log('📋 FormData original:', formData);
      console.log('🔄 ExecutionTemplate:', executionTemplate);

      // Aplicar field mapping se existir
      let payload = formData;
      if (executionTemplate.fieldMappings && executionTemplate.fieldMappings.length > 0) {
        payload = formsService.applyFieldMapping(formData, executionTemplate.fieldMappings);
      }

      console.log('✅ Payload final:', payload);

      const result = await requestsService.createRequest({
        offerId: offer.id,
        formDefinitionId: publishedForm.id,
        userId: user.id,
        formData: payload,
        executionTargetType: executionTemplate.targetType,
        executionResourceType: executionTemplate.resourceType || undefined,
        executionResourceId: executionTemplate.resourceId,
      });

      console.log('✅ requestsService.createRequest():', result);
      return result;
    },
    onSuccess: (data) => {
      message.success('Requisição criada com sucesso!');
      // Redirecionar pra página de minhas requisições
      setTimeout(() => {
        router.push(`/dashboard/requests/${data.id}`);
      }, 1000);
    },
    onError: (err) => {
      console.error('❌ Erro ao criar requisição:', err);
      message.error(
        err instanceof Error ? err.message : 'Erro ao submeter requisição'
      );
    },
  });

  const handleSubmit = async (values: Record<string, unknown>) => {
    setFormData(values);
    submitRequest();
  };

  const handleBack = () => {
    router.back();
  };

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
                title: 'Nova Requisição',
              },
            ]}
          />

          {/* Loading */}
          {(isLoadingOffer || isLoadingForm || isLoadingTemplate) && (
            <Card loading style={{ marginBottom: '24px' }}>
              <Skeleton active paragraph={{ rows: 4 }} />
            </Card>
          )}

          {/* Error ao carregar oferta */}
          {isErrorOffer && (
            <Alert
              title="Erro ao carregar oferta"
              description={
                errorOffer instanceof Error
                  ? errorOffer.message
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

          {/* Error ao carregar formulário */}
          {isErrorForm && (
            <Alert
              title="Erro ao carregar formulário"
              description={
                errorForm instanceof Error
                  ? errorForm.message
                  : 'Erro desconhecido ao buscar formulário'
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

          {/* Warning - ExecutionTemplate não encontrado */}
          {offer && !isLoadingOffer && !isLoadingForm && !isLoadingTemplate && !executionTemplate && (
            <Alert
              title="Configuração de Execução Não Encontrada"
              description="Esta oferta não tem uma configuração de execução (ExecutionTemplate). Contate o administrador."
              type="warning"
              showIcon
              style={{ marginBottom: '24px' }}
            />
          )}

          {/* Formulário */}
          {offer && !isLoadingOffer && !isLoadingForm && !isLoadingTemplate && !isErrorForm && executionTemplate && (
            <div className={styles.formContainer}>
              {/* Header */}
              <Card style={{ marginBottom: '24px' }}>
                <div>
                  <div style={{ color: '#999', fontSize: '12px', marginBottom: '6px' }}>
                    Criar Requisição
                  </div>
                  <h1 style={{ marginBottom: '8px' }}>{offer.name}</h1>
                  {offer.description && (
                    <p style={{ color: '#666', margin: 0 }}>
                      {offer.description}
                    </p>
                  )}
                </div>
              </Card>

              {/* Sem formulário publicado */}
              {!hasPublishedForm && (
                <Alert
                  title="Formulário não publicado"
                  description="Esta oferta não possui um formulário publicado. Crie e publique um formulário na página de detalhes da oferta."
                  type="warning"
                  showIcon
                  style={{ marginBottom: '24px' }}
                  action={
                    <Button onClick={handleBack}>Voltar</Button>
                  }
                />
              )}

              {/* Erro de submissão */}
              {isSubmitError && (
                <Alert
                  title="Erro ao submeter"
                  description={
                    submitError instanceof Error
                      ? submitError.message
                      : 'Erro desconhecido'
                  }
                  type="error"
                  showIcon
                  style={{ marginBottom: '24px' }}
                />
              )}

              {/* Formulário Dinâmico */}
              {hasPublishedForm && publishedForm && formFields.length > 0 && (
                <Card>
                  <Spin spinning={isSubmitting} tip="Enviando...">
                    <Form
                      form={form}
                      layout="vertical"
                      onFinish={handleSubmit}
                      disabled={isSubmitting}
                    >
                      <DynamicFormFields fields={formFields} />

                      {/* Botões de ação */}
                      <Form.Item>
                        <Space>
                          <Button
                            type="primary"
                            size="large"
                            htmlType="submit"
                            icon={<SendOutlined />}
                            loading={isSubmitting}
                          >
                            Enviar Requisição
                          </Button>
                          <Button
                            size="large"
                            onClick={handleBack}
                            icon={<ArrowLeftOutlined />}
                            disabled={isSubmitting}
                          >
                            Cancelar
                          </Button>
                        </Space>
                      </Form.Item>
                    </Form>
                  </Spin>
                </Card>
              )}

              {/* Formulário vazio */}
              {hasPublishedForm && publishedForm && formFields.length === 0 && (
                <Empty
                  description="O formulário publicado não possui campos configurados"
                  style={{ marginTop: '48px' }}
                />
              )}

              {/* Informações úteis */}
              {hasPublishedForm && publishedForm && (
                <Alert
                  title="Dica"
                  description="Após submeter, você poderá acompanhar o status da sua requisição na seção 'Minhas Requisições'."
                  type="info"
                  showIcon
                  style={{ marginTop: '24px' }}
                />
              )}
            </div>
          )}
        </div>
      </Content>
    </Layout>
  );
}

export default function RequestFormPage() {
  return (
    <ProtectedRoute>
      <RequestFormContent />
    </ProtectedRoute>
  );
}
