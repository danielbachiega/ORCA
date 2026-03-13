/**
 * LAYOUT HEADER
 * 
 * Exibe informações do usuário logado e botão de logout
 */

'use client';

import React from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/contexts/auth.context';
import { useThemeMode } from '@/lib/contexts/theme.context';
import { APP_NAME } from '@/lib/constants';
import { Layout, Button, Avatar, Space, Dropdown, Badge, theme } from 'antd';
import { LogoutOutlined, UserOutlined, MoonOutlined, SunOutlined } from '@ant-design/icons';
import type { MenuProps } from 'antd';

const { Header } = Layout;

interface AppHeaderProps {
  centerContent?: React.ReactNode;
}

export const AppHeader: React.FC<AppHeaderProps> = ({ centerContent }) => {
  const router = useRouter();
  const { user, logout, roles } = useAuth();
  const { themeMode, toggleThemeMode } = useThemeMode();
  const { token } = theme.useToken();
  const isDarkMode = themeMode === 'dark';

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
      onClick: () => router.push('/dashboard/profile'),
    },
  ];

  menuItems.push({
    type: 'divider',
  });

  menuItems.push({
    key: 'logout',
    icon: <LogoutOutlined />,
    label: 'Sair',
    onClick: handleLogout,
    danger: true,
  });

  return (
    <Header
      style={{
        background: token.colorBgContainer,
        padding: '0 24px',
        boxShadow: token.boxShadowSecondary,
        display: 'flex',
        alignItems: 'center',
      }}
    >
      {/* Logo / Home */}
      <Space>
        <Button
          type="text"
          size="large"
          onClick={handleHome}
          style={{ fontSize: '18px', fontWeight: 'bold' }}
        >
          <Image
            src="/brand/logo.png"
            alt={APP_NAME}
            width={36}
            height={36}
            style={{ objectFit: 'contain', marginRight: '8px' }}
          />
          {APP_NAME}
        </Button>
      </Space>

      <div style={{ flex: 1, display: 'flex', justifyContent: 'center', margin: '0 24px', minWidth: 0 }}>
        {centerContent}
      </div>

      {/* User Info */}
      <Space align="center" size="middle">
        <Button
          type="text"
          shape="circle"
          size="large"
          aria-label={isDarkMode ? 'Ativar tema claro' : 'Ativar tema escuro'}
          icon={isDarkMode ? <SunOutlined /> : <MoonOutlined />}
          onClick={toggleThemeMode}
        />
        <div style={{ textAlign: 'right', lineHeight: '1.4' }}>
          <div style={{ fontSize: '14px', fontWeight: '500', margin: '0' }}>
            {user?.firstName || user?.username}
          </div>
          <div style={{ fontSize: '12px', color: token.colorTextSecondary, display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '4px', margin: '0' }}>
            <Badge
              count={roles?.length || 0}
              style={{ backgroundColor: token.colorSuccess }}
            />
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
