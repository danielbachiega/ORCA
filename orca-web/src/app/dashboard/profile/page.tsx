/**
 * PROFILE PAGE
 *
 * Visualização do perfil do usuário logado
 */

'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { ProtectedRoute } from '@/components/protected-route';
import { AppHeader } from '@/components/app-header';
import { useAuth } from '@/lib/contexts/auth.context';
import {
  Layout,
  Card,
  Button,
  Breadcrumb,
  Descriptions,
  Tag,
  Space,
  Alert,
} from 'antd';
import { ArrowLeftOutlined, LogoutOutlined } from '@ant-design/icons';
import styles from './profile.module.css';

const { Content } = Layout;

function ProfileContent() {
  const router = useRouter();
  const { user, roles, logout } = useAuth();

  const handleBack = () => router.back();

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  if (!user) {
    return (
      <Layout style={{ minHeight: '100vh' }}>
        <AppHeader />
        <Content style={{ padding: '24px' }}>
          <Alert
            type="error"
            showIcon
            message="Usuário não autenticado"
            description="Faça login novamente para acessar seu perfil."
            action={
              <Button type="primary" onClick={() => router.push('/login')}>
                Ir para login
              </Button>
            }
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
              { title: 'Perfil' },
            ]}
          />

          <Card style={{ marginBottom: '24px' }}>
            <div className={styles.header}>
              <div>
                <h1>Perfil do Usuário</h1>
                <p style={{ color: '#666', marginBottom: 0 }}>
                  Informações da sua conta e permissões
                </p>
              </div>
              <Button danger icon={<LogoutOutlined />} onClick={handleLogout}>
                Sair
              </Button>
            </div>
          </Card>

          <Card style={{ marginBottom: '24px' }}>
            <Descriptions title="Informações" column={2} bordered>
              <Descriptions.Item label="Nome de usuário">
                {user.username}
              </Descriptions.Item>
              <Descriptions.Item label="Email">
                {user.email}
              </Descriptions.Item>
              <Descriptions.Item label="Status">
                {user.isActive ? 'Ativo' : 'Inativo'}
              </Descriptions.Item>
              <Descriptions.Item label="ID">
                {user.id}
              </Descriptions.Item>
            </Descriptions>
          </Card>

          <Card style={{ marginBottom: '24px' }}>
            <Descriptions title="Roles" column={1} bordered>
              <Descriptions.Item label="Permissões">
                {roles && roles.length > 0 ? (
                  <Space size={[8, 8]} wrap>
                    {roles.map((role) => (
                      <Tag key={role.id} color="blue">
                        {role.name}
                      </Tag>
                    ))}
                  </Space>
                ) : (
                  'Nenhuma role atribuída'
                )}
              </Descriptions.Item>
            </Descriptions>
          </Card>

          <Card>
            <Descriptions title="Grupos LDAP" column={1} bordered>
              <Descriptions.Item label="Grupos">
                {user.ldapGroups && user.ldapGroups.length > 0 ? (
                  <Space size={[8, 8]} wrap>
                    {user.ldapGroups.map((group) => (
                      <Tag key={group}>{group}</Tag>
                    ))}
                  </Space>
                ) : (
                  'Nenhum grupo LDAP encontrado'
                )}
              </Descriptions.Item>
            </Descriptions>
          </Card>
        </div>
      </Content>
    </Layout>
  );
}

export default function ProfilePage() {
  return (
    <ProtectedRoute>
      <ProfileContent />
    </ProtectedRoute>
  );
}
