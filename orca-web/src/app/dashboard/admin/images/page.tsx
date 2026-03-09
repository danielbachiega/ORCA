'use client';

import React, { useCallback, useMemo, useRef, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { catalogService } from '@/services';
import { ProtectedRoute } from '@/components/protected-route';
import { AppHeader } from '@/components/app-header';
import { DashboardHeaderTabs } from '@/components/dashboard-header-tabs';
import { resolveImageAssetUrl } from '@/lib/utils/image-assets';
import type { ImageAsset } from '@/lib/types';
import {
  Layout,
  Card,
  Button,
  Input,
  Space,
  Table,
  Tag,
  Upload,
  Modal,
  Form,
  message,
} from 'antd';
import type { UploadFile } from 'antd/es/upload/interface';
import { ArrowLeftOutlined, DeleteOutlined, UploadOutlined, SearchOutlined } from '@ant-design/icons';
import styles from './images.module.css';

const { Content } = Layout;

function AdminImagesContent() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [uploadOpen, setUploadOpen] = useState(false);
  const [uploadFile, setUploadFile] = useState<UploadFile | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [form] = Form.useForm();
  const [isSlugManuallyEdited, setIsSlugManuallyEdited] = useState(false);
  const autoSluggingRef = useRef(false);

  const slugify = useCallback((value: string) => {
    if (!value) return '';
    return value
      .normalize('NFD')
      .replace(/\p{Diacritic}/gu, '')
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-');
  }, []);

  const handleValuesChange = (changedValues: { name?: string; slug?: string }) => {
    if (Object.prototype.hasOwnProperty.call(changedValues, 'name')) {
      const name = changedValues.name ?? '';
      if (!isSlugManuallyEdited) {
        autoSluggingRef.current = true;
        form.setFieldsValue({ slug: slugify(name) });
        autoSluggingRef.current = false;
      }
    }

    if (Object.prototype.hasOwnProperty.call(changedValues, 'slug')) {
      if (autoSluggingRef.current) return;
      const slug = changedValues.slug ?? '';
      setIsSlugManuallyEdited(Boolean(slug));
    }
  };

  const { data: assets = [], isLoading } = useQuery({
    queryKey: ['image-assets'],
    queryFn: () => catalogService.listImageAssets(),
  });

  const { data: offers = [] } = useQuery({
    queryKey: ['offers', 'all'],
    queryFn: () => catalogService.listOffers(),
  });

  const uploadMutation = useMutation({
    mutationFn: async (payload: { slug: string; name: string; file: File }) => {
      return catalogService.uploadImageAsset(payload);
    },
    onSuccess: async () => {
      message.success('Imagem adicionada');
      await queryClient.invalidateQueries({ queryKey: ['image-assets'] });
      setUploadOpen(false);
      setUploadFile(null);
      setSelectedFile(null);
      form.resetFields();
    },
    onError: (error: Error) => {
      message.error(error.message || 'Erro ao enviar imagem');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (slug: string) => {
      await catalogService.deleteImageAsset(slug);
    },
    onSuccess: async () => {
      message.success('Imagem removida');
      await queryClient.invalidateQueries({ queryKey: ['image-assets'] });
    },
    onError: (error: Error) => {
      message.error(error.message || 'Erro ao remover imagem');
    },
  });

  const columns = useMemo(
    () => [
      {
        title: 'Preview',
        dataIndex: 'url',
        key: 'preview',
        width: 90,
        render: (url: string) => (
          <div className={styles.preview}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={resolveImageAssetUrl(url)} alt="preview" />
          </div>
        ),
      },
      {
        title: 'Nome',
        dataIndex: 'name',
        key: 'name',
        render: (value: string) => <span className={styles.name}>{value}</span>,
      },
      {
        title: 'Slug',
        dataIndex: 'slug',
        key: 'slug',
        render: (value: string) => <Tag>{value}</Tag>,
      },
      {
        title: 'Tamanho',
        dataIndex: 'sizeBytes',
        key: 'sizeBytes',
        render: (value: number) => `${Math.round(value / 1024)} KB`,
      },
      {
        title: 'Acoes',
        key: 'actions',
        width: 140,
        render: (_: unknown, record: ImageAsset) => (
          <Button
            danger
            icon={<DeleteOutlined />}
            loading={deleteMutation.isPending}
            onClick={() => {
              const usedIn = offers.filter((offer) => offer.imageAssetId === record.slug);
              const inUseMessage = usedIn.length > 0
                ? `Esta imagem esta sendo usada em ${usedIn.length} oferta(s). Deseja remover mesmo assim?`
                : 'Essa acao nao pode ser desfeita.';

              Modal.confirm({
                title: 'Remover imagem?',
                content: inUseMessage,
                okText: 'Remover',
                cancelText: 'Cancelar',
                okButtonProps: { danger: true },
                onOk: () => deleteMutation.mutateAsync(record.slug),
              });
            }}
          >
            Remover
          </Button>
        ),
      },
    ],
    [deleteMutation, offers]
  );

  const handleUpload = async () => {
    const values = await form.validateFields();
    if (!selectedFile) {
      message.error('Selecione um arquivo');
      return;
    }

    uploadMutation.mutate({
      slug: values.slug,
      name: values.name,
      file: selectedFile,
    });
  };

  const filteredAssets = assets.filter((asset) => {
    if (!searchTerm.trim()) {
      return true;
    }

    const normalizedSearch = searchTerm.toLowerCase();
    return (
      asset.name.toLowerCase().includes(normalizedSearch) ||
      asset.slug.toLowerCase().includes(normalizedSearch)
    );
  });

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <AppHeader centerContent={<DashboardHeaderTabs activeTab="manage" />} />

      <Content style={{ padding: '24px' }}>
        <div className={styles.container}>
          <div className={styles.header}>
            <div>
              <h1>Imagens da Oferta</h1>
              <p>Gerencie os icones disponiveis para as ofertas.</p>
            </div>
            <Space>
              <Button
                icon={<ArrowLeftOutlined />}
                onClick={() => router.push('/dashboard')}
              >
                Voltar
              </Button>
              <Button
                type="primary"
                icon={<UploadOutlined />}
                onClick={() => setUploadOpen(true)}
              >
                Adicionar imagem
              </Button>
            </Space>
          </div>

          <Card>
            <Input
              placeholder="Pesquisar por nome ou slug da imagem..."
              prefix={<SearchOutlined />}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              allowClear
              style={{ marginBottom: '16px' }}
            />
            <Table
              rowKey="id"
              dataSource={filteredAssets}
              columns={columns}
              loading={isLoading}
              pagination={{ pageSize: 8 }}
            />
          </Card>
        </div>
      </Content>

      <Modal
        title="Nova imagem"
        open={uploadOpen}
        onCancel={() => setUploadOpen(false)}
        onOk={handleUpload}
        okText="Enviar"
        confirmLoading={uploadMutation.isPending}
      >
        <Form form={form} layout="vertical" onValuesChange={handleValuesChange}>
          <Form.Item
            name="name"
            label="Nome"
            rules={[{ required: true, message: 'Nome obrigatorio' }]}
          >
            <Input placeholder="ex: Icone de banco" />
          </Form.Item>
          <Form.Item
            name="slug"
            label="Slug"
            rules={[
              { required: true, message: 'Slug obrigatorio' },
              { pattern: /^[a-z0-9-]+$/, message: 'Use apenas letras minusculas, numeros e hifen' },
            ]}
          >
            <Input placeholder="ex: database-icon" />
          </Form.Item>
          <Form.Item label="Arquivo (PNG/JPG ate 1MB)">
            <Upload
              accept="image/png,image/jpeg"
              beforeUpload={() => false}
              maxCount={1}
              fileList={uploadFile ? [uploadFile] : []}
              onChange={(info) => {
                const nextFile = info.fileList[0] ?? null;
                setUploadFile(nextFile);
                const fileObj = (nextFile?.originFileObj ?? null) as File | null;
                setSelectedFile(fileObj);
              }}
            >
              <Button>Selecionar arquivo</Button>
            </Upload>
          </Form.Item>
        </Form>
      </Modal>
    </Layout>
  );
}

export default function AdminImagesPage() {
  return (
    <ProtectedRoute requiredRoles={['admin', 'superadmin']}>
      <AdminImagesContent />
    </ProtectedRoute>
  );
}
