/**
 * LOGIN PAGE
 * 
 * Integração com Identity Service
 * Fluxo:
 * 1. Usuário insere ID Token (OIDC mock por enquanto)
 * 2. Frontend envia pra Identity Service
 * 3. Identity retorna sessionToken + user + roles
 * 4. Salva em localStorage + estado
 * 5. Redireciona pra dashboard
 */

'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/contexts/auth.context';
import { Button, Input, Card, Typography, Space, Alert, Spin } from 'antd';
import { LockOutlined } from '@ant-design/icons';
import styles from './login.module.css';

const { Title, Text } = Typography;

export default function LoginPage() {
  const router = useRouter();
  const { login, isLoading, error } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!username.trim() || !password.trim()) {
      return;
    }

    setIsSubmitting(true);

    try {
      // Envia username e password diretamente
      await login(username, password);
      // Login bem-sucedido, redirecionar
      router.push('/dashboard');
    } catch (err) {
      // Erro já está em `error` do useAuth
      console.error('Login failed:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={styles.container}>
      <Card className={styles.card}>
        <Space orientation="vertical" size="large" style={{ width: '100%' }}>
          {/* Header */}
          <div className={styles.header}>
            <LockOutlined style={{ fontSize: '32px', color: '#1890ff' }} />
            <Title level={2} style={{ margin: '16px 0 8px 0' }}>
              ORCA
            </Title>
            <Text type="secondary">
              Orchestrator Catalog Application
            </Text>
          </div>

          {/* Error Alert */}
          {error && (
            <Alert
              message="Erro no Login"
              description={error}
              type="error"
              showIcon
              closable
            />
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} style={{ width: '100%' }}>
            <Space orientation="vertical" size="middle" style={{ width: '100%' }}>
              <div>
                <Text strong style={{ marginBottom: '8px', display: 'block' }}>
                  Usuário
                </Text>
                <Input
                  placeholder="Digite seu usuário"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  disabled={isSubmitting || isLoading}
                  size="large"
                  autoComplete="username"
                />
              </div>

              <div>
                <Text strong style={{ marginBottom: '8px', display: 'block' }}>
                  Senha
                </Text>
                <Input.Password
                  placeholder="Digite sua senha"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={isSubmitting || isLoading}
                  size="large"
                  autoComplete="current-password"
                />
                <Text
                  type="secondary"
                  style={{ fontSize: '12px', display: 'block', marginTop: '8px' }}
                >
                  💡 Para testes, use qualquer usuário/senha
                </Text>
              </div>

              <Button
                type="primary"
                htmlType="submit"
                block
                size="large"
                loading={isSubmitting || isLoading}
                disabled={!username.trim() || !password.trim()}
              >
                {isSubmitting ? 'Autenticando...' : 'Entrar'}
              </Button>
            </Space>
          </form>

          {/* Footer Info */}
          <div style={{ textAlign: 'center', paddingTop: '16px' }}>
            <Text type="secondary" style={{ fontSize: '12px' }}>
              <strong>Credenciais de teste:</strong><br />
              superadmin / Orca@2026<br />
              admin / admin123
            </Text>
          </div>
        </Space>
      </Card>
    </div>
  );
}
