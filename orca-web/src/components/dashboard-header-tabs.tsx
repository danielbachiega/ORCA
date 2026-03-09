'use client';

import React, { useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Tabs } from 'antd';
import { useAuth } from '@/lib/contexts/auth.context';

export type DashboardHeaderTab = 'services' | 'requests' | 'manage' | 'roles';

interface DashboardHeaderTabsProps {
  activeTab: DashboardHeaderTab;
}

export const DashboardHeaderTabs: React.FC<DashboardHeaderTabsProps> = ({
  activeTab,
}) => {
  const router = useRouter();
  const { roles } = useAuth();

  const isAdmin =
    roles &&
    roles.some(
      (r) => r.name.toLowerCase() === 'admin' || r.name.toLowerCase() === 'superadmin'
    );

  const isEditor = roles && roles.some((r) => r.name.toLowerCase() === 'editor');
  const canManageCatalog = isAdmin || isEditor;

  const items = useMemo(() => {
    const result = [
      { key: 'services', label: 'Catálogo de Serviços' },
      { key: 'requests', label: 'Minhas Requisições' },
    ];

    if (canManageCatalog) {
      result.push({ key: 'manage', label: 'Gerenciar Catálogo' });
    }

    if (isAdmin) {
      result.push({ key: 'roles', label: 'Perfis de Acesso' });
    }

    return result;
  }, [canManageCatalog, isAdmin]);

  const handleTabChange = (key: string) => {
    if (key === 'services') {
      router.push('/dashboard');
      return;
    }

    if (key === 'requests') {
      router.push('/dashboard/requests');
      return;
    }

    if (key === 'manage') {
      router.push('/dashboard?tab=manage');
      return;
    }

    if (key === 'roles') {
      router.push('/dashboard/admin/roles');
    }
  };

  return (
    <Tabs
      activeKey={activeTab}
      onChange={handleTabChange}
      items={items}
      tabBarStyle={{ margin: 0 }}
    />
  );
};
