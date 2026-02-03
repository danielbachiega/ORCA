/**
 * REQUEST FORM PAGE
 * 
 * Formulário pra criar uma nova requisição
 * - Seleção da oferta (já pre-preenchida)
 * - Formulário dinâmico (JSON Schema) - TODO
 * - Submissão e confirmação
 */

'use client';

import React, { useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useQuery, useMutation } from '@tanstack/react-query';
import { catalogService, requestsService } from '@/services';
import { ProtectedRoute } from '@/components/protected-route';
import { AppHeader } from '@/components/app-header';
import { useAuth } from '@/lib/contexts/auth.context';
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
} from 'antd';
import { ArrowLeftOutlined, SendOutlined } from '@ant-design/icons';
import styles from './request-form.module.css';

const { Content } = Layout;

function RequestFormContent() {
  const router = useRouter();
  const params = useParams();
  const offerId = params.id as string;
  const { user } = useAuth();
  const [form] = Form.useForm();
  const [formData, setFormData] = useState<Record<string, unknown>>({});

  // Buscar detalhes da oferta
  const {
    data: offer,
    isLoading: isLoadingOffer,
    isError: isErrorOffer,
    error: errorOffer,
  } = useQuery({
    queryKey: ['offers', offerId],
    queryFn: () => catalogService.getOfferById(offerId),
  });

  // Mutation pra submeter requisição
  const {
    mutate: submitRequest,
    isPending: isSubmitting,
    isError: isSubmitError,
    error: submitError,
  } = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error('Usuário não autenticado');

      const result = await requestsService.createRequest({
        offerId,
        userId: user.id,
        formData,
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
          {isLoadingOffer && (
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

          {/* Formulário */}
          {offer && !isLoadingOffer && (
            <div className={styles.formContainer}>
              {/* Header */}
              <Card style={{ marginBottom: '24px' }}>
                <div>
                  <h1>Criar Requisição</h1>
                  <p style={{ color: '#666' }}>
                    Oferta: <strong>{offer.name}</strong>
                  </p>
                </div>
              </Card>

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

              {/* Formulário Ant Design */}
              <Card>
                <Spin spinning={isSubmitting} tip="Enviando...">
                  <Form
                    form={form}
                    layout="vertical"
                    onFinish={handleSubmit}
                    disabled={isSubmitting}
                  >
                    {/* TODO: Renderizar campos dinâmicos do JSON Schema */}

                    {/* Campo de exemplo - depois será dinâmico */}
                    <Form.Item
                      name="description"
                      label="Descrição da Requisição (Opcional)"
                      rules={[
                        {
                          max: 500,
                          message: 'Máximo 500 caracteres',
                        },
                      ]}
                    >
                      <Input.TextArea
                        placeholder="Descreva sua requisição..."
                        rows={4}
                        disabled={isSubmitting}
                      />
                    </Form.Item>

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

              {/* Informações úteis */}
              <Alert
                message="Dica"
                description="Após submeter, você poderá acompanhar o status da sua requisição na seção 'Minhas Requisições'."
                type="info"
                showIcon
                style={{ marginTop: '24px' }}
              />
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
