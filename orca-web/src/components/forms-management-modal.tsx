/**
 * FORMS MANAGEMENT MODAL
 *
 * Modal para criar/editar formulários dinâmicos de uma oferta
 */

'use client';

import React from 'react';
import {
  Modal,
  Button,
  Space,
  Spin,
  message,
} from 'antd';
import { useMutation } from '@tanstack/react-query';
import { FormBuilder, type FormField } from './form-builder';

interface FormsManagementModalProps {
  visible: boolean;
  onClose: () => void;
  offerId: string;
  mode: 'create' | 'edit';
  editingFormId?: string | null;
  editingFormVersion?: number | null;
  editingIsPublished?: boolean;
  nextVersion?: number;
  fields: FormField[];
  onChange: (fields: FormField[]) => void;
  isLoading?: boolean;
  onSaved?: () => void;
  executionTargetType?: 0 | 1 | null;
  onExecutionTargetTypeChange?: (type: 0 | 1 | null) => void;
  executionResourceType?: 0 | 1 | null;
  onExecutionResourceTypeChange?: (type: 0 | 1 | null) => void;
  executionResourceId?: string | null;
  onExecutionResourceIdChange?: (id: string | null) => void;
}

export const FormsManagementModal: React.FC<FormsManagementModalProps> = ({
  visible,
  onClose,
  offerId,
  mode,
  editingFormId,
  editingFormVersion,
  editingIsPublished,
  nextVersion,
  fields,
  onChange,
  isLoading = false,
  onSaved,
  executionTargetType = null,
  onExecutionTargetTypeChange,
  executionResourceType = null,
  onExecutionResourceTypeChange,
  executionResourceId = null,
  onExecutionResourceIdChange,
}) => {
  const formsApiBase = process.env.NEXT_PUBLIC_FORMS_API ?? 'http://localhost:5003';
  const isEditing = mode === 'edit' && Boolean(editingFormId);
  const currentVersion = editingFormVersion ?? nextVersion ?? 1;
  const currentIsPublished = editingIsPublished ?? false;

  const createMutation = useMutation({
    mutationFn: async () => {
      if (fields.length === 0) {
        throw new Error('Adicione pelo menos um campo ao formulário');
      }

      if (!nextVersion) {
        throw new Error('Versão inválida para criação');
      }

      const schemaJson = JSON.stringify({
        title: 'Formulário Dinâmico',
        fields,
      });

      const response = await fetch(
        `${formsApiBase}/api/form-definitions`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            offerId,
            version: nextVersion,
            schemaJson,
            isPublished: false,
            executionTargetType: executionTargetType ?? undefined,
            executionResourceType: executionResourceType ?? undefined,
            executionResourceId: executionResourceId ?? undefined,
          }),
        }
      );
      if (!response.ok) throw new Error('Erro ao criar formulário');
      return response.json();
    },
    onSuccess: () => {
      message.success('Formulário criado com sucesso!');
      onSaved?.();
      onChange([]);
      onClose();
    },
    onError: (error: Error) => {
      message.error(error.message || 'Erro ao criar formulário');
    },
  });

  const updateMutation = useMutation({
    mutationFn: async () => {
      if (!editingFormId) {
        throw new Error('Formulário inválido para edição');
      }
      if (fields.length === 0) {
        throw new Error('Adicione pelo menos um campo ao formulário');
      }

      const schemaJson = JSON.stringify({
        title: 'Formulário Dinâmico',
        fields,
      });

      const response = await fetch(
        `${formsApiBase}/api/form-definitions/${editingFormId}`,
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: editingFormId,
            offerId,
            version: currentVersion,
            schemaJson,
            isPublished: currentIsPublished,
            executionTargetType: executionTargetType ?? undefined,
            executionResourceType: executionResourceType ?? undefined,
            executionResourceId: executionResourceId ?? undefined,
          }),
        }
      );
      if (!response.ok) throw new Error('Erro ao atualizar formulário');
      return response.json();
    },
    onSuccess: () => {
      message.success('Formulário atualizado com sucesso!');
      onSaved?.();
      onChange([]);
      onClose();
    },
    onError: (error: Error) => {
      message.error(error.message || 'Erro ao atualizar formulário');
    },
  });

  const handleSave = () => {
    if (fields.length === 0) {
      message.warning('Adicione pelo menos um campo ao formulário');
      return;
    }
    if (isEditing) {
      updateMutation.mutate();
    } else {
      createMutation.mutate();
    }
  };

  return (
    <Modal
      title={isEditing ? 'Editar Formulário' : 'Criar Novo Formulário'}
      open={visible}
      onCancel={() => {
        onChange([]);
        onExecutionTargetTypeChange?.(null);
        onExecutionResourceTypeChange?.(null);
        onExecutionResourceIdChange?.(null);
        onClose();
      }}
      width={1000}
      footer={
        <Space>
          <Button onClick={onClose}>Cancelar</Button>
          <Button
            type="primary"
            loading={createMutation.isPending || updateMutation.isPending}
            onClick={handleSave}
          >
            {isEditing ? 'Salvar Alterações' : 'Salvar Formulário'}
          </Button>
        </Space>
      }
    >
      <Spin spinning={isLoading}>
        <FormBuilder
          fields={fields}
          onChange={onChange}
          executionTargetType={executionTargetType}
          onExecutionTargetTypeChange={onExecutionTargetTypeChange}
          executionResourceType={executionResourceType}
          onExecutionResourceTypeChange={onExecutionResourceTypeChange}
          executionResourceId={executionResourceId}
          onExecutionResourceIdChange={onExecutionResourceIdChange}
        />
      </Spin>
    </Modal>
  );
};
