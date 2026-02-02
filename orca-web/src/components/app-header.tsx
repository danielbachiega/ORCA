/**
 * LAYOUT HEADER
 * 
 * Exibe informações do usuário logado e botão de logout
 */

'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/contexts/auth.context';
import { Layout, Button, Avatar, Space, Dropdown, Badge } from 'antd';
import { LogoutOutlined, UserOutlined, HomeOutlined } from '@ant-design/icons';
import type { MenuProps } from 'antd';

const { Header } = Layout;

export const AppHeader: React.FC = () => {
  const router = useRouter();
  const { user, logout, roles } = useAuth();

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  const handleHome = () => {
    router.push('/dashboard');
  };

  const menuItems: MenuProps['items'] = [
    {
      key: 'profile',
      icon: <UserOutlined />,
      label: 'Perfil',
      disabled: true,
    },
    {
      type: 'divider',
    },
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: 'Sair',
      onClick: handleLogout,
      danger: true,
    },
  ];

  return (
    <Header
      style={{
        background: '#fff',
        padding: '0 24px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
      }}
    >
      {/* Logo / Home */}
      <Space>
        <Button
          type="text"
          size="large"
          icon={<HomeOutlined />}
          onClick={handleHome}
          style={{ fontSize: '18px', fontWeight: 'bold' }}
        >
          ORCA
        </Button>
      </Space>

      {/* User Info */}
      <Space>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: '14px', fontWeight: '500' }}>
            {user?.firstName || user?.username}
          </div>
          <div style={{ fontSize: '12px', color: '#999' }}>
            <Badge
              count={roles?.length || 0}
              style={{ backgroundColor: '#52c41a' }}
            />
            {' '}
            role{(roles?.length || 0) !== 1 ? 's' : ''}
          </div>
        </div>
        <Dropdown menu={{ items: menuItems }} placement="bottomRight">
          <Avatar size="large" icon={<UserOutlined />} style={{ cursor: 'pointer' }} />
        </Dropdown>
      </Space>
    </Header>
  );
};
