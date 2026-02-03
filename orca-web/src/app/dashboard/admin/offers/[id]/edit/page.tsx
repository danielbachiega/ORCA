/**
 * EDIT OFFER PAGE (ADMIN)
 *
 * Formulário para editar oferta existente
 */

'use client';

import React, { useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useMutation, useQuery } from '@tanstack/react-query';
import { catalogService, identityService } from '@/services';
import { ProtectedRoute } from '@/components/protected-route';
import { AppHeader } from '@/components/app-header';
import { useAuth } from '@/lib/contexts/auth.context';
import {
  Layout,
  Card,
  Button,
  Form,
  Input,
  Select,
  Space,
  Alert,
  Spin,
  message,
  Breadcrumb,
  Switch,
} from 'antd';
import { ArrowLeftOutlined, SaveOutlined } from '@ant-design/icons';
import styles from './edit-offer.module.css';

const { Content } = Layout;

interface EditOfferFormValues {
  name: string;
  slug: string;
  description?: string;
  tags?: string[];
  active: boolean;
  visibleToRoles?: string[];
}

function EditOfferContent() {
  const router = useRouter();
  const params = useParams();
  const offerId = params.id as string;
  const { roles } = useAuth();
  const [form] = Form.useForm<EditOfferFormValues>();

  const isAdmin = roles && roles.length > 0 && roles.some((r) =>
    r.name.toLowerCase() === 'admin' || r.name.toLowerCase() === 'superadmin'
  );

  // Buscar roles disponíveis
  const {
    data: availableRoles = [],
    isLoading: isLoadingRoles,
  } = useQuery({
    queryKey: ['roles'],
    queryFn: async () => {
      const result = await identityService.listRoles();
      return result;
    },
  });

  const {
    data: offer,
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ['offers', offerId],
    queryFn: async () => {
      const result = await catalogService.getOfferById(offerId);
      return result;
    },
    enabled: !!offerId,
  });

  useEffect(() => {
    if (offer) {
      form.setFieldsValue({
        name: offer.name,
        slug: offer.slug,
        description: offer.description,
        tags: offer.tags || [],
        active: offer.active,
        visibleToRoles: offer.visibleToRoles || [],
      });
    }
  }, [offer, form]);

  const {
    mutate: submitUpdate,
    isPending: isSubmitting,
    isError: isSubmitError,
    error: submitError,
  } = useMutation({
    mutationFn: async (values: EditOfferFormValues) => {
      const result = await catalogService.updateOffer(offerId, {
        id: offerId,
        name: values.name,
        slug: values.slug,
        description: values.description || undefined,
        tags: values.tags || [],
        active: values.active,
        visibleToRoles: values.visibleToRoles || [],
      });

      return result;
    },
    onSuccess: (data) => {
      message.success('Oferta atualizada com sucesso!');
      router.push(`/dashboard/offers/${data.id}`);
    },
    onError: (err) => {
      console.error('❌ Erro ao atualizar oferta:', err);
      message.error(
        err instanceof Error ? err.message : 'Erro ao atualizar oferta'
      );
    },
  });

  const handleSubmit = async (values: EditOfferFormValues) => {
    submitUpdate(values);
  };

  const handleBack = () => {
    router.back();
  };

  if (!isAdmin) {
    return (
      <Layout style={{ minHeight: '100vh' }}>
        <AppHeader />
        <Content style={{ padding: '24px' }}>
          <Alert
            title="Acesso Negado"
            description="Você não tem permissão para editar ofertas."
            type="error"
            showIcon
          />
        </Content>
      </Layout>
    );
  }

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <AppHeader />

      <Content style={{ padding: '24px' }}>
        <div className={styles.container}>
          <Breadcrumb
            style={{ marginBottom: '24px' }}
            items={[
              {
                title: <Button type="text" size="small" onClick={handleBack}>
                  Voltar
                </Button>,
              },
              {
                title: 'Editar Oferta',
              },
            ]}
          />

          <Card style={{ marginBottom: '24px' }}>
            <div>
              <h1>Editar Oferta</h1>
              <p style={{ color: '#666' }}>
                Atualize as informações da oferta
              </p>
            </div>
          </Card>

          {isError && (
            <Alert
              title="Erro ao carregar oferta"
              description={
                error instanceof Error ? error.message : 'Erro desconhecido'
              }
              type="error"
              showIcon
              style={{ marginBottom: '24px' }}
            />
          )}

          {isSubmitError && (
            <Alert
              title="Erro ao salvar"
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

          <Card>
            <Spin spinning={isSubmitting || isLoading} tip="Carregando oferta...">
              <Form
                form={form}
                layout="vertical"
                onFinish={handleSubmit}
                disabled={isSubmitting || isLoading || !offer}
              >
                <Form.Item
                  name="name"
                  label="Nome da Oferta"
                  rules={[
                    { required: true, message: 'Digite o nome da oferta' },
                    { min: 3, message: 'Mínimo 3 caracteres' },
                    { max: 100, message: 'Máximo 100 caracteres' },
                  ]}
                >
                  <Input
                    placeholder="ex: Provisionar VM, Criar Banco de Dados"
                    disabled={isSubmitting || isLoading}
                  />
                </Form.Item>

                <Form.Item
                  name="slug"
                  label="Slug (URL-friendly)"
                  rules={[
                    { required: true, message: 'Digite o slug' },
                    {
                      pattern: /^[a-z0-9-]*$/,
                      message: 'Use apenas letras minúsculas, números e hífen',
                    },
                  ]}
                >
                  <Input
                    placeholder="ex: provisionar-vm, criar-banco-dados"
                    disabled={isSubmitting || isLoading}
                  />
                </Form.Item>

                <Form.Item
                  name="description"
                  label="Descrição (Opcional)"
                  rules={[{ max: 500, message: 'Máximo 500 caracteres' }]}
                >
                  <Input.TextArea
                    placeholder="Descrição detalhada da oferta e seus benefícios..."
                    rows={4}
                    disabled={isSubmitting || isLoading}
                  />
                </Form.Item>

                <Form.Item name="tags" label="Tags" valuePropName="value">
                  <Select
                    mode="tags"
                    placeholder="Adicione tags relevantes (ex: vm, cloud, infraestrutura)"
                    disabled={isSubmitting || isLoading}
                    tokenSeparators={[',']}
                  />
                </Form.Item>

                <Form.Item
                  name="visibleToRoles"
                  label="Visível para Roles"
                  tooltip="Admin sempre tem acesso. Deixe vazio para todos verem."
                >
                  <Select
                    mode="multiple"
                    placeholder="Selecione as roles que podem ver esta oferta"
                    disabled={isSubmitting || isLoading || isLoadingRoles}
                    loading={isLoadingRoles}
                    options={availableRoles.map((role) => ({
                      label: `${role.name} - ${role.description || 'Sem descrição'}`,
                      value: role.name,
                    }))}
                  />
                </Form.Item>

                <Form.Item
                  name="active"
                  label="Oferta Ativa"
                  valuePropName="checked"
                >
                  <Switch disabled={isSubmitting || isLoading} />
                </Form.Item>

                <Form.Item>
                  <Space>
                    <Button
                      type="primary"
                      size="large"
                      htmlType="submit"
                      icon={<SaveOutlined />}
                      loading={isSubmitting}
                    >
                      Salvar Alterações
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
        </div>
      </Content>
    </Layout>
  );
}

export default function EditOfferPage() {
  return (
    <ProtectedRoute requiredRoles={['admin', 'superadmin']}>
      <EditOfferContent />
    </ProtectedRoute>
  );
}
