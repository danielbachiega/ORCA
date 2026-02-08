/**
 * EXECUTION TEMPLATE MODAL
 *
 * Modal para configurar automação de uma oferta
 * Define qual sistema (AWX/OO), recurso e mapeamento de campos
 */

'use client';

import React from 'react';
import {
  Modal,
  Form,
  Input,
  Select,
  Button,
  Space,
  Spin,
  message,
  Card,
  Alert,
} from 'antd';
import { MinusCircleOutlined, PlusOutlined } from '@ant-design/icons';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

interface FieldMappingFormValue {
  payloadFieldName: string;
  sourceType: 0 | 1;
  sourceValue: string;
}

interface ExecutionTemplateFormValues {
  executionTargetType: 0 | 1;
  executionResourceType?: 0 | 1 | null;
  executionResourceId: string;
  fieldMappings?: FieldMappingFormValue[];
}

interface ExecutionTemplateModalProps {
  visible: boolean;
  onClose: () => void;
  formDefinitionId: string;
  onSaved?: () => void;
}

export const ExecutionTemplateModal: React.FC<ExecutionTemplateModalProps> = ({
  visible,
  onClose,
  formDefinitionId,
  onSaved,
}) => {
  const [form] = Form.useForm();
  const queryClient = useQueryClient();
  const formsApiBase = process.env.NEXT_PUBLIC_FORMS_API ?? 'http://localhost:5003';

  // Buscar campos do formulário
  const { data: formDefinition, isLoading: formLoading } = useQuery({
    queryKey: ['form-definition', formDefinitionId],
    queryFn: async () => {
      const response = await fetch(
        `${formsApiBase}/api/form-definitions/${formDefinitionId}`
      );
      if (!response.ok) throw new Error('Erro ao carregar formulário');
      return response.json();
    },
    enabled: visible && !!formDefinitionId,
  });

  // Extrair campos do schema
  const formFields: Array<{ key: string; label: string }> = React.useMemo(() => {
    if (!formDefinition?.schemaJson) return [];
    try {
      const schema = JSON.parse(formDefinition.schemaJson);
      return schema.fields || [];
    } catch {
      return [];
    }
  }, [formDefinition]);

  // Buscar template existente
  const {
    data: existingTemplate,
    isLoading: templateLoading,
    refetch: refetchTemplate,
  } = useQuery({
    queryKey: ['execution-template', formDefinitionId],
    queryFn: async () => {
      const response = await fetch(
        `${formsApiBase}/api/execution-templates/form-definition/${formDefinitionId}`
      );
      if (response.status === 404) return null;
      if (!response.ok) throw new Error('Erro ao carregar automação');
      return response.json();
    },
    enabled: visible && !!formDefinitionId,
  });

  React.useEffect(() => {
    if (visible && existingTemplate) {
      form.setFieldsValue({
        executionTargetType: existingTemplate.targetType,
        executionResourceType: existingTemplate.resourceType,
        executionResourceId: existingTemplate.resourceId,
        fieldMappings: existingTemplate.fieldMappings || [],
      });
    } else if (visible) {
      form.resetFields();
    }
  }, [visible, existingTemplate, form]);

  const createMutation = useMutation({
    mutationFn: async (values: ExecutionTemplateFormValues) => {
      const payload = {
        formDefinitionId,
        targetType: values.executionTargetType,
        resourceType: values.executionTargetType === 0 ? values.executionResourceType : null,
        resourceId: values.executionResourceId,
        fieldMappings: (values.fieldMappings || []).map((mapping) => ({
          payloadFieldName: mapping.payloadFieldName,
          sourceType: mapping.sourceType,
          sourceValue: mapping.sourceValue,
        })),
      };

      console.log('📤 Enviando ExecutionTemplate:', payload);

      const response = await fetch(`${formsApiBase}/api/execution-templates`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || 'Erro ao salvar automação');
      }
      return response.json();
    },
    onSuccess: () => {
      message.success('Automação configurada com sucesso!');
      queryClient.invalidateQueries({ queryKey: ['execution-template', formDefinitionId] });
      refetchTemplate();
      onSaved?.();
      onClose();
    },
    onError: (error: Error) => {
      message.error(error.message || 'Erro ao configurar automação');
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (values: ExecutionTemplateFormValues) => {
      if (!existingTemplate?.id) {
        throw new Error('ID da automação não encontrado');
      }
      const payload = {
        id: existingTemplate.id,
        formDefinitionId,
        targetType: values.executionTargetType,
        resourceType: values.executionTargetType === 0 ? values.executionResourceType : null,
        resourceId: values.executionResourceId,
        fieldMappings: (values.fieldMappings || []).map((mapping) => ({
          payloadFieldName: mapping.payloadFieldName,
          sourceType: mapping.sourceType,
          sourceValue: mapping.sourceValue,
        })),
      };

      console.log('📤 Atualizando ExecutionTemplate:', payload);

      const response = await fetch(
        `${formsApiBase}/api/execution-templates/${existingTemplate.id}`,
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        }
      );
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || 'Erro ao atualizar automação');
      }
      return response.json();
    },
    onSuccess: () => {
      message.success('Automação atualizada com sucesso!');
      queryClient.invalidateQueries({ queryKey: ['execution-template', formDefinitionId] });
      refetchTemplate();
      onSaved?.();
      onClose();
    },
    onError: (error: Error) => {
      message.error(error.message || 'Erro ao atualizar automação');
    },
  });

  const handleSave = async () => {
    try {
      const values = await form.validateFields();
      if (existingTemplate?.id) {
        updateMutation.mutate(values);
      } else {
        createMutation.mutate(values);
      }
    } catch {
      // Erro de validação já exibido pelo form
    }
  };

  const targetType = Form.useWatch('executionTargetType', form);
  const resourceId = Form.useWatch('executionResourceId', form);
  const resourceType = Form.useWatch('executionResourceType', form);

  return (
    <Modal
      title="⚙️ Configurar Automação"
      open={visible}
      onCancel={onClose}
      width={800}
      footer={
        <Space>
          <Button onClick={onClose}>Cancelar</Button>
          <Button
            type="primary"
            loading={
              createMutation.isPending ||
              updateMutation.isPending ||
              templateLoading
            }
            onClick={handleSave}
          >
            {existingTemplate ? 'Atualizar Automação' : 'Configurar Automação'}
          </Button>
        </Space>
      }
    >
      <Spin spinning={templateLoading || formLoading}>
        <Alert
          message="Configure qual sistema externo (AWX ou OO) será acionado e mapeie os campos do formulário"
          type="info"
          showIcon
          style={{ marginBottom: '24px' }}
        />

        <Form form={form} layout="vertical">
          <Form.Item
            name="executionTargetType"
            label="Sistema de Automação"
            rules={[{ required: true, message: 'Selecione um sistema' }]}
            tooltip="Sistema externo que executará o workflow"
          >
            <Select
              placeholder="Selecione AWX ou OO"
              options={[
                {
                  label: '🎯 AWX (Ansible Automation Platform)',
                  value: 0,
                },
                {
                  label: '🎯 OO (Operations Orchestration)',
                  value: 1,
                },
              ]}
            />
          </Form.Item>

          <Form.Item
            name="executionResourceType"
            label="Tipo de Recurso (AWX)"
            rules={[
              {
                validator: async (_, value) => {
                  const targetTypeValue = form.getFieldValue('executionTargetType');
                  if (targetTypeValue === 0 && (value === null || value === undefined)) {
                    return Promise.reject(new Error('Selecione JobTemplate ou Workflow'));
                  }
                  return Promise.resolve();
                },
              },
            ]}
            hidden={targetType !== 0}
            style={{ display: targetType === 0 ? 'block' : 'none' }}
          >
            <Select
              placeholder="Selecione JobTemplate ou Workflow"
              options={[
                {
                  label: '📋 Job Template',
                  value: 0,
                },
                {
                  label: '⚙️ Workflow',
                  value: 1,
                },
              ]}
            />
          </Form.Item>

          <Form.Item
            name="executionResourceId"
            label={targetType === 1 ? 'Flow UUID (OO)' : 'ID do Recurso (AWX)'}
            rules={[{ required: true, message: 'Campo obrigatório' }]}
            tooltip={
              targetType === 1
                ? 'UUID único do Flow no Operations Orchestration'
                : 'ID do Job Template ou Workflow no AWX'
            }
          >
            <Input
              placeholder={
                targetType === 1
                  ? 'c1234567-89ab-cdef-0123-456789abcdef'
                  : '12345'
              }
            />
          </Form.Item>

          {targetType !== undefined && resourceId && (
            <Card style={{ backgroundColor: '#f6ffed', marginBottom: '24px' }} size="small">
              <div style={{ fontSize: '14px' }}>
                <div style={{ marginBottom: '8px' }}>
                  <strong>✅ Resumo da Configuração:</strong>
                </div>
                <div style={{ lineHeight: '1.8' }}>
                  <div>
                    • <strong>Sistema:</strong>{' '}
                    {targetType === 0
                      ? 'AWX (Ansible Automation Platform)'
                      : 'OO (Operations Orchestration)'}
                  </div>
                  {targetType === 0 && resourceType !== undefined && (
                    <div>
                      • <strong>Tipo:</strong>{' '}
                      {resourceType === 0 ? 'Job Template' : 'Workflow'}
                    </div>
                  )}
                  <div>
                    • <strong>ID:</strong>{' '}
                    <code style={{ backgroundColor: '#f0f0f0', padding: '2px 6px' }}>
                      {resourceId}
                    </code>
                  </div>
                </div>
              </div>
            </Card>
          )}

          {/* Mapeamento de Campos */}
          <div style={{ marginTop: '32px', marginBottom: '16px' }}>
            <div style={{ fontSize: '16px', fontWeight: 600, marginBottom: '12px' }}>
              📋 Mapeamento de Campos
            </div>
            <Alert
              message="Mapeie os campos do formulário com os parâmetros do payload, ou use valores fixos"
              type="info"
              showIcon
              style={{ marginBottom: '16px' }}
            />
          </div>

          <Form.List name="fieldMappings">
            {(fields, { add, remove }) => (
              <div>
                {fields.map((field, index) => {
                  const { key, ...restField } = field;
                  return (
                  <Card key={key} size="small" style={{ marginBottom: '12px' }}>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <Form.Item
                        {...restField}
                        name={[field.name, 'payloadFieldName']}
                        dependencies={['fieldMappings']}
                        rules={[
                          {
                            required: true,
                            message: 'Nome do campo é obrigatório',
                          },
                          {
                            validator: async (_, value) => {
                              if (!value) {
                                return Promise.resolve();
                              }

                              const mappings =
                                (form.getFieldValue('fieldMappings') as
                                  | Array<{ payloadFieldName?: string }>
                                  | undefined) ?? [];

                              const normalized = String(value).trim().toLowerCase();
                              const hasDuplicate = mappings.some((mapping, mappingIndex) => {
                                if (mappingIndex === index) {
                                  return false;
                                }

                                const otherValue = String(
                                  mapping?.payloadFieldName ?? ''
                                )
                                  .trim()
                                  .toLowerCase();

                                return otherValue !== '' && otherValue === normalized;
                              });

                              if (hasDuplicate) {
                                return Promise.reject(
                                  new Error('Nome do campo do payload já foi usado')
                                );
                              }

                              return Promise.resolve();
                            },
                          },
                        ]}
                        style={{ flex: 1, margin: 0 }}
                      >
                        <Input placeholder="Nome do campo no payload (ex: username, email)" />
                      </Form.Item>

                      <Form.Item
                        {...restField}
                        name={[field.name, 'sourceType']}
                        rules={[
                          {
                            required: true,
                            message: 'Selecione tipo',
                          },
                        ]}
                        style={{ width: '150px', margin: 0 }}
                      >
                        <Select
                          placeholder="Tipo"
                          options={[
                            {
                              label: '📝 Campo Formulário',
                              value: 0,
                            },
                            {
                              label: '📌 Valor Fixo',
                              value: 1,
                            },
                          ]}
                        />
                      </Form.Item>

                      <Button
                        type="text"
                        danger
                        icon={<MinusCircleOutlined />}
                        onClick={() => remove(field.name)}
                        style={{ padding: 0 }}
                      />
                    </div>

                    {/* Campo condicional baseado no sourceType */}
                    <Form.Item
                      noStyle
                      shouldUpdate={(prev, curr) =>
                        prev.fieldMappings?.[index]?.sourceType !==
                        curr.fieldMappings?.[index]?.sourceType
                      }
                    >
                      {() => {
                        const sourceType = form.getFieldValue([
                          'fieldMappings',
                          index,
                          'sourceType',
                        ]);

                        return sourceType === 0 ? (
                          // Campo do Formulário
                          <Form.Item
                            {...restField}
                            name={[field.name, 'sourceValue']}
                            label="Selecione o campo"
                            rules={[
                              {
                                required: true,
                                message: 'Selecione um campo',
                              },
                            ]}
                            style={{ marginTop: '8px', marginBottom: 0 }}
                          >
                            <Select
                              placeholder="Escolha um campo do formulário"
                              options={formFields.map((field, index) => ({
                                label: field.key,
                                value: field.key,
                                key: `${field.key}-${index}`,
                              }))}
                            />
                          </Form.Item>
                        ) : sourceType === 1 ? (
                          // Valor Fixo
                          <Form.Item
                            {...restField}
                            name={[field.name, 'sourceValue']}
                            label="Valor fixo"
                            rules={[
                              {
                                required: true,
                                message: 'Digite um valor',
                              },
                            ]}
                            style={{ marginTop: '8px', marginBottom: 0 }}
                          >
                            <Input placeholder="Digite o valor fixo (ex: admin, IT-Manager)" />
                          </Form.Item>
                        ) : null;
                      }}
                    </Form.Item>
                  </Card>
                );
                })}

                <Button
                  type="dashed"
                  block
                  icon={<PlusOutlined />}
                  onClick={() => add()}
                  style={{ marginBottom: '16px' }}
                >
                  Adicionar Mapeamento
                </Button>
              </div>
            )}
          </Form.List>
        </Form>
      </Spin>
    </Modal>
    );
  };
