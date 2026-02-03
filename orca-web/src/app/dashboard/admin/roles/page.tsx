/**
 * ROLES MANAGEMENT PAGE (ADMIN)
 *
 * Criar, editar, listar e deletar roles
 */

'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { identityService } from '@/services';
import { ProtectedRoute } from '@/components/protected-route';
import { AppHeader } from '@/components/app-header';
import { useAuth } from '@/lib/contexts/auth.context';
import type { Role } from '@/lib/types';
import {
  Layout,
  Card,
  Button,
  Breadcrumb,
  Form,
  Input,
  Select,
  Checkbox,
  Space,
  Table,
  Tag,
  Alert,
  message,
  Modal,
  Pagination,
} from 'antd';
import { ArrowLeftOutlined, PlusOutlined, EditOutlined, DeleteOutlined, SearchOutlined } from '@ant-design/icons';
import styles from './roles.module.css';

const { Content } = Layout;

const ROLE_ACCESS = {
  Consumer: 1,
  Admin: 2,
  Editor: 4,
};

const accessLabels: Record<number, string> = {
  [ROLE_ACCESS.Consumer]: 'Consumer',
  [ROLE_ACCESS.Admin]: 'Admin',
  [ROLE_ACCESS.Editor]: 'Editor',
};

/**
 * Converte string ou número para array de labels
 * Suporta: número (7), string ("Consumer, Admin, Editor")
 */
function accessTypeToLabels(accessType: number | string): string[] {
  let value: number;

  if (typeof accessType === 'string') {
    // Se for string, converte de volta para número
    const parts = accessType.split(',').map((s) => s.trim());
    value = 0;
    parts.forEach((part) => {
      const key = Object.entries(accessLabels).find(([, v]) => v === part)?.[0];
      if (key) {
        value |= Number(key);
      }
    });
  } else {
    value = accessType;
  }

  return Object.entries(accessLabels)
    .filter(([numValue]) => (value & Number(numValue)) !== 0)
    .map(([, label]) => label);
}

function RolesContent() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { roles: userRoles } = useAuth();
  const [form] = Form.useForm();
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRole, setEditingRole] = useState<Role | null>(null);
  const [searchText, setSearchText] = useState('');
  const [page, setPage] = useState(1);
  const pageSize = 10;

  const isAdmin = userRoles && userRoles.some((r) =>
    r.name.toLowerCase() === 'admin' || r.name.toLowerCase() === 'superadmin'
  );

  const {
    data: allRoles = [],
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ['roles'],
    queryFn: async () => identityService.listRoles(),
    enabled: isAdmin,
  });

  // Filtrar e paginar
  const filteredRoles = allRoles.filter((role) =>
    role.name.toLowerCase().includes(searchText.toLowerCase()) ||
    role.description?.toLowerCase().includes(searchText.toLowerCase())
  );

  const paginatedRoles = filteredRoles.slice(
    (page - 1) * pageSize,
    page * pageSize
  );

  const { mutate: createOrUpdateRole, isPending } = useMutation({
    mutationFn: async (values: {
      name: string;
      description?: string;
      ldapGroups?: string[];
      access: number[];
    }) => {
      const accessType = values.access.reduce((acc, value) => acc + value, 0);
      const dto = {
        name: values.name,
        description: values.description,
        ldapGroups: values.ldapGroups || [],
        accessType,
      };

      if (editingRole) {
        return identityService.updateRole(editingRole.id, dto);
      } else {
        return identityService.createRole(dto);
      }
    },
    onSuccess: async () => {
      message.success(editingRole ? 'Role atualizada com sucesso' : 'Role criada com sucesso');
      form.resetFields();
      setIsModalOpen(false);
      setEditingRole(null);
      await queryClient.invalidateQueries({ queryKey: ['roles'] });
    },
    onError: (err) => {
      message.error(err instanceof Error ? err.message : 'Erro ao salvar role');
    },
  });

  const { mutate: deleteRole, isPending: isDeleting } = useMutation({
    mutationFn: (roleId: string) => identityService.deleteRole(roleId),
    onSuccess: async () => {
      message.success('Role deletada com sucesso');
      await queryClient.invalidateQueries({ queryKey: ['roles'] });
    },
    onError: (err) => {
      message.error(err instanceof Error ? err.message : 'Erro ao deletar role');
    },
  });

  const handleOpenModal = (role?: Role) => {
    if (role) {
      setEditingRole(role);
      // Converte accessType (string ou número) para array de números
      const labels = accessTypeToLabels(role.accessType);
      const access = labels.map(
        (label) =>
          Object.entries(accessLabels).find(([, v]) => v === label)?.[0] || 0
      );

      form.setFieldsValue({
        name: role.name,
        description: role.description,
        ldapGroups: role.ldapGroups || [],
        access: access.map(Number),
      });
    } else {
      setEditingRole(null);
      form.resetFields();
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingRole(null);
    form.resetFields();
  };

  const handleDeleteRole = (role: Role) => {
    Modal.confirm({
      title: 'Deletar Role',
      content: `Tem certeza que deseja deletar a role "${role.name}"?`,
      okText: 'Deletar',
      okType: 'danger',
      cancelText: 'Cancelar',
      onOk: () => deleteRole(role.id),
    });
  };

  const handleBack = () => router.back();

  if (!isAdmin) {
    return (
      <Layout style={{ minHeight: '100vh' }}>
        <AppHeader />
        <Content style={{ padding: '24px' }}>
          <Alert
            type="error"
            showIcon
            message="Acesso negado"
            description="Você não tem permissão para gerenciar roles."
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
                title: (
                  <Button type="text" size="small" onClick={handleBack} icon={<ArrowLeftOutlined />}>
                    Voltar
                  </Button>
                ),
              },
              { title: 'Gerenciar Roles' },
            ]}
          />

          <Card style={{ marginBottom: '24px' }}>
            <div className={styles.header}>
              <div>
                <h1>Gerenciar Roles</h1>
                <p style={{ color: '#666', marginBottom: 0 }}>
                  Crie, edite e remova roles do sistema
                </p>
              </div>
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={() => handleOpenModal()}
              >
                Nova Role
              </Button>
            </div>
          </Card>

          <Card>
            <Space style={{ marginBottom: '16px', width: '100%' }} direction="vertical">
              <Input
                placeholder="Pesquisar por nome ou descrição..."
                prefix={<SearchOutlined />}
                value={searchText}
                onChange={(e) => {
                  setSearchText(e.target.value);
                  setPage(1);
                }}
                allowClear
              />
            </Space>

            {isError && (
              <Alert
                type="error"
                showIcon
                message="Erro ao carregar roles"
                description={error instanceof Error ? error.message : 'Erro desconhecido'}
                style={{ marginBottom: '16px' }}
              />
            )}

            <Table
              rowKey="id"
              dataSource={paginatedRoles}
              loading={isLoading || isDeleting}
              pagination={false}
              columns={[
                {
                  title: 'Nome',
                  dataIndex: 'name',
                  key: 'name',
                },
                {
                  title: 'Descrição',
                  dataIndex: 'description',
                  key: 'description',
                  render: (desc) => desc || '-',
                },
                {
                  title: 'Grupos LDAP',
                  dataIndex: 'ldapGroups',
                  key: 'ldapGroups',
                  render: (groups: string[] | undefined) =>
                    groups && groups.length > 0 ? (
                      <Space size={[4, 4]} wrap>
                        {groups.map((group) => (
                          <Tag key={group}>{group}</Tag>
                        ))}
                      </Space>
                    ) : (
                      '-'
                    ),
                },
                {
                  title: 'Acessos',
                  dataIndex: 'accessType',
                  key: 'accessType',
                  render: (accessType: number) => (
                    <Space size={[4, 4]} wrap>
                      {accessTypeToLabels(accessType).map((label) => (
                        <Tag color="blue" key={label}>
                          {label}
                        </Tag>
                      ))}
                    </Space>
                  ),
                },
                {
                  title: 'Ações',
                  key: 'actions',
                  width: 100,
                  render: (_, record: Role) => (
                    <Space size="small">
                      <Button
                        icon={<EditOutlined />}
                        size="small"
                        onClick={() => handleOpenModal(record)}
                      />
                      <Button
                        icon={<DeleteOutlined />}
                        size="small"
                        danger
                        onClick={() => handleDeleteRole(record)}
                      />
                    </Space>
                  ),
                },
              ]}
            />

            {filteredRoles.length > pageSize && (
              <Pagination
                current={page}
                pageSize={pageSize}
                total={filteredRoles.length}
                onChange={setPage}
                style={{ marginTop: '16px', textAlign: 'right' }}
              />
            )}
          </Card>

          {/* Modal de Criação/Edição */}
          <Modal
            title={editingRole ? 'Editar Role' : 'Nova Role'}
            open={isModalOpen}
            onCancel={handleCloseModal}
            footer={[
              <Button key="cancel" onClick={handleCloseModal}>
                Cancelar
              </Button>,
              <Button
                key="submit"
                type="primary"
                loading={isPending}
                onClick={() => form.submit()}
              >
                {editingRole ? 'Atualizar' : 'Criar'}
              </Button>,
            ]}
          >
            <Form
              form={form}
              layout="vertical"
              onFinish={(values) => createOrUpdateRole(values)}
              initialValues={{ access: [ROLE_ACCESS.Consumer] }}
            >
              <Form.Item
                label="Nome"
                name="name"
                rules={[{ required: true, message: 'Informe o nome da role' }]}
              >
                <Input placeholder="Ex: Viewer" />
              </Form.Item>

              <Form.Item label="Descrição" name="description">
                <Input placeholder="Descrição opcional" />
              </Form.Item>

              <Form.Item label="Grupos LDAP" name="ldapGroups">
                <Select mode="tags" placeholder="Ex: Users, Admins" />
              </Form.Item>

              <Form.Item
                label="Acessos"
                name="access"
                rules={[{ required: true, message: 'Selecione ao menos um acesso' }]}
              >
                <Checkbox.Group>
                  <Space direction="vertical">
                    <Checkbox value={ROLE_ACCESS.Consumer}>Consumer</Checkbox>
                    <Checkbox value={ROLE_ACCESS.Editor}>Editor</Checkbox>
                    <Checkbox value={ROLE_ACCESS.Admin}>Admin</Checkbox>
                  </Space>
                </Checkbox.Group>
              </Form.Item>
            </Form>
          </Modal>
        </div>
      </Content>
    </Layout>
  );
}

export default function RolesPage() {
  return (
    <ProtectedRoute>
      <RolesContent />
    </ProtectedRoute>
  );
}
