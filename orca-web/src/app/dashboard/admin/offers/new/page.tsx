/**
 * CREATE OFFER PAGE (ADMIN)
 * 
 * Formulário pra criar nova oferta
 * - Nome, descrição, tags
 * - Roles que podem ver
 * - Submissão e redirecionamento pra designer de formulário
 */

'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
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
} from 'antd';
import { ArrowLeftOutlined, SaveOutlined } from '@ant-design/icons';
import styles from './create-offer.module.css';

const { Content } = Layout;

interface CreateOfferFormValues {
  name: string;
  slug: string;
  description?: string;
  tags?: string[];
  visibleToRoles?: string[];
}

function CreateOfferContent() {
  const router = useRouter();
  const { roles } = useAuth();
  const [form] = Form.useForm();

  // Verificar permissão
  const isAdmin = roles && roles.length > 0 && roles.some((r) => r.name.toLowerCase() === 'admin' || r.name.toLowerCase() === 'superadmin');

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

  // Mutation pra criar oferta
  const {
    mutate: submitOffer,
    isPending: isSubmitting,
    isError: isSubmitError,
    error: submitError,
  } = useMutation({
    mutationFn: async (values: CreateOfferFormValues) => {
      const result = await catalogService.createOffer({
        name: values.name,
        slug: values.slug,
        description: values.description || undefined,
        tags: values.tags || [],
        active: true,
        visibleToRoles: values.visibleToRoles || [],
      });

      console.log('✅ catalogService.createOffer():', result);
      return result;
    },
    onSuccess: (data) => {
      message.success('Oferta criada com sucesso!');
      // Redirecionar pra página de designer de formulário
      setTimeout(() => {
        router.push(`/dashboard/admin/offers/${data.id}/form-designer`);
      }, 1000);
    },
    onError: (err) => {
      console.error('❌ Erro ao criar oferta:', err);
      message.error(
        err instanceof Error ? err.message : 'Erro ao criar oferta'
      );
    },
  });

  const handleSubmit = async (values: CreateOfferFormValues) => {
    submitOffer(values);
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
            description="Você não tem permissão pra criar ofertas. Apenas admins podem fazer isso."
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
                title: 'Criar Oferta',
              },
            ]}
          />

          {/* Header */}
          <Card style={{ marginBottom: '24px' }}>
            <div>
              <h1>Criar Nova Oferta</h1>
              <p style={{ color: '#666' }}>
                Preencha os detalhes da oferta e configure o formulário na próxima etapa
              </p>
            </div>
          </Card>

          {/* Erro de submissão */}
          {isSubmitError && (
            <Alert
              title="Erro ao criar"
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

          {/* Formulário */}
          <Card>
            <Spin spinning={isSubmitting} tip="Criando oferta...">
              <Form
                form={form}
                layout="vertical"
                onFinish={handleSubmit}
                disabled={isSubmitting}
              >
                {/* Nome */}
                <Form.Item
                  name="name"
                  label="Nome da Oferta"
                  rules={[
                    {
                      required: true,
                      message: 'Digite o nome da oferta',
                    },
                    {
                      min: 3,
                      message: 'Mínimo 3 caracteres',
                    },
                    {
                      max: 100,
                      message: 'Máximo 100 caracteres',
                    },
                  ]}
                >
                  <Input
                    placeholder="ex: Provisionar VM, Criar Banco de Dados"
                    disabled={isSubmitting}
                  />
                </Form.Item>

                {/* Slug */}
                <Form.Item
                  name="slug"
                  label="Slug (URL-friendly)"
                  rules={[
                    {
                      required: true,
                      message: 'Digite o slug',
                    },
                    {
                      pattern: /^[a-z0-9-]*$/,
                      message: 'Use apenas letras minúsculas, números e hífen',
                    },
                  ]}
                >
                  <Input
                    placeholder="ex: provisionar-vm, criar-banco-dados"
                    disabled={isSubmitting}
                  />
                </Form.Item>

                {/* Descrição */}
                <Form.Item
                  name="description"
                  label="Descrição (Opcional)"
                  rules={[
                    {
                      max: 500,
                      message: 'Máximo 500 caracteres',
                    },
                  ]}
                >
                  <Input.TextArea
                    placeholder="Descrição detalhada da oferta e seus benefícios..."
                    rows={4}
                    disabled={isSubmitting}
                  />
                </Form.Item>
                {/* Tags */}
                <Form.Item
                  name="tags"
                  label="Tags"
                  valuePropName="value"
                >
                  <Select
                    mode="tags"
                    placeholder="Adicione tags relevantes (ex: vm, cloud, infraestrutura)"
                    disabled={isSubmitting}
                    tokenSeparators={[',']}
                  />
                </Form.Item>

                {/* Roles Visíveis */}
                <Form.Item
                  name="visibleToRoles"
                  label="Visível para Roles"
                  tooltip="Admin sempre tem acesso. Deixe vazio para todos verem."
                >
                  <Select
                    mode="multiple"
                    placeholder="Selecione as roles que podem ver esta oferta"
                    disabled={isSubmitting || isLoadingRoles}
                    loading={isLoadingRoles}
                    options={availableRoles.map((role) => ({
                      label: `${role.name} - ${role.description || 'Sem descrição'}`,
                      value: role.name,
                    }))}
                  />
                </Form.Item>

                {/* Botões de ação */}
                <Form.Item>
                  <Space>
                    <Button
                      type="primary"
                      size="large"
                      htmlType="submit"
                      icon={<SaveOutlined />}
                      loading={isSubmitting}
                    >
                      Criar e Configurar Formulário
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

          {/* Dica */}
          <Alert
            title="Próximo Passo"
            description="Após criar a oferta, você será redirecionado para o designer de formulário, onde poderá configurar os campos que os usuários precisam preencher."
            type="info"
            showIcon
            style={{ marginTop: '24px' }}
          />
        </div>
      </Content>
    </Layout>
  );
}

export default function CreateOfferPage() {
  return (
    <ProtectedRoute requiredRoles={['admin', 'superadmin']}>
      <CreateOfferContent />
    </ProtectedRoute>
  );
}
