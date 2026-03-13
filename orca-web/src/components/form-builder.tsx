/**
 * FORM BUILDER
 * 
 * Editor visual para criar formulários dinâmicos
 * - Adicionar campos com tipo, label, validações
 * - Configurar condições de visibilidade
 * - Preview em tempo real
 * - Gera JSON Schema automaticamente
 */

'use client';

import React, { useState } from 'react';
import {
  Card,
  Form,
  Input,
  Select,
  Button,
  Switch,
  Space,
  Modal,
  Row,
  Col,
  Tag,
  Divider,
  Tabs,
  Alert,
  theme,
} from 'antd';
import type { Rule } from 'antd/es/form';
import {
  PlusOutlined,
  DeleteOutlined,
  EditOutlined,
  EyeOutlined,
  DragOutlined,
  UpOutlined,
  DownOutlined,
} from '@ant-design/icons';

export interface FormField {
  id: string;
  key: string;
  label: string;
  type: 'text' | 'number' | 'email' | 'select' | 'checkbox' | 'textarea';
  required: boolean;
  placeholder?: string;
  description?: string;
  regexPattern?: string;
  options?: Array<{ label: string; value: string }>;
  visibilityCondition?: {
    fieldKey: string;
    operator: 'equals' | 'notEquals' | 'contains';
    value: string | boolean;
  };
}

interface FormBuilderProps {
  fields: FormField[];
  onChange: (fields: FormField[]) => void;
}

const fieldTypes = [
  { label: 'Texto', value: 'text' },
  { label: 'Número', value: 'number' },
  { label: 'Email', value: 'email' },
  { label: 'Área de Texto', value: 'textarea' },
  { label: 'Seleção', value: 'select' },
  { label: 'Checkbox', value: 'checkbox' },
];

const operators = [
  { label: 'É igual a', value: 'equals' },
  { label: 'É diferente de', value: 'notEquals' },
  { label: 'Contém', value: 'contains' },
];

const checkboxOperators = operators.filter((operator) => operator.value !== 'contains');

const normalizeVisibilityValue = (
  fieldValue: unknown,
  conditionValue: string | boolean,
): string | boolean => {
  if (typeof fieldValue === 'boolean') {
    if (typeof conditionValue === 'boolean') return conditionValue;
    return String(conditionValue).toLowerCase() === 'true';
  }

  return conditionValue;
};

const normalizeStringComparison = (value: unknown): string =>
  String(value ?? '').trim().toLowerCase();

// Componente para preview com suporte a visibilidade condicional
interface PreviewFormProps {
  fields: FormField[];
  renderFieldPreview: (field: FormField) => React.ReactNode;
  getFieldRules: (field: FormField) => Rule[];
}

const PreviewForm: React.FC<PreviewFormProps> = ({ fields, renderFieldPreview, getFieldRules }) => {
  const [previewForm] = Form.useForm();
  const previewValues = Form.useWatch([], previewForm);

  // Atualizar lógica de visibilidade baseada nos valores atuais
  const isFieldVisibleNow = (field: FormField): boolean => {
    if (!field.visibilityCondition) return true;

    const { fieldKey, operator, value } = field.visibilityCondition;
    const fieldValue = previewValues?.[fieldKey];
    const normalizedValue = normalizeVisibilityValue(fieldValue, value);
    const dependencyField = fields.find((candidate) => candidate.key === fieldKey);
    const shouldUseCaseInsensitiveComparison = dependencyField?.type === 'select';

    if (
      shouldUseCaseInsensitiveComparison
      && typeof fieldValue === 'string'
      && typeof normalizedValue === 'string'
    ) {
      const left = normalizeStringComparison(fieldValue);
      const right = normalizeStringComparison(normalizedValue);

      switch (operator) {
        case 'equals':
          return left === right;
        case 'notEquals':
          return left !== right;
        case 'contains':
          return left.includes(right);
        default:
          return true;
      }
    }

    switch (operator) {
      case 'equals':
        return fieldValue === normalizedValue;
      case 'notEquals':
        return fieldValue !== normalizedValue;
      case 'contains':
        return String(fieldValue || '').includes(String(normalizedValue));
      default:
        return true;
    }
  };

  return (
    <Form form={previewForm} layout="vertical">
      {fields.map((field) => {
        if (!isFieldVisibleNow(field)) return null;

        return (
          <Form.Item
            key={field.id}
            name={field.key}
            label={field.label}
            required={field.required}
            rules={getFieldRules(field)}
            validateTrigger={['onChange', 'onBlur']}
            help={field.description}
          >
            {renderFieldPreview(field)}
          </Form.Item>
        );
      })}
    </Form>
  );
};

export const FormBuilder: React.FC<FormBuilderProps> = ({ fields, onChange }) => {
  const { token } = theme.useToken();
  const [editingField, setEditingField] = useState<FormField | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [form] = Form.useForm();
  const [activeTab, setActiveTab] = useState('builder');
  const [draggingFieldId, setDraggingFieldId] = useState<string | null>(null);
  const [dragOverFieldId, setDragOverFieldId] = useState<string | null>(null);

  const handleAddField = () => {
    const newField: FormField = {
      id: `field_${Date.now()}`,
      key: `campo_${fields.length + 1}`,
      label: `Campo ${fields.length + 1}`,
      type: 'text',
      required: false,
    };
    setEditingField(newField);
    form.setFieldsValue(newField);
    setModalVisible(true);
  };

  const handleEditField = (field: FormField) => {
    setEditingField(field);
    form.setFieldsValue({
      ...field,
      regexPattern: field.regexPattern,
      options: field.options?.map((opt) => opt.label) || [],
      visibilityFieldKey: field.visibilityCondition?.fieldKey,
      visibilityOperator: field.visibilityCondition?.operator,
      visibilityValue: field.visibilityCondition?.value,
    });
    setModalVisible(true);
  };

  const handleDeleteField = (fieldId: string) => {
    Modal.confirm({
      title: 'Deletar campo?',
      content: 'Esta ação não pode ser desfeita.',
      okText: 'Deletar',
      cancelText: 'Cancelar',
      okButtonProps: { danger: true },
      onOk: () => {
        onChange(fields.filter((f) => f.id !== fieldId));
      },
    });
  };

  const handleMoveField = (fieldId: string, direction: 'up' | 'down') => {
    const currentIndex = fields.findIndex((field) => field.id === fieldId);
    if (currentIndex === -1) return;

    const targetIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
    if (targetIndex < 0 || targetIndex >= fields.length) return;

    const updatedFields = [...fields];
    const [movedField] = updatedFields.splice(currentIndex, 1);
    updatedFields.splice(targetIndex, 0, movedField);

    onChange(updatedFields);
  };

  const handleDropOnField = (sourceFieldId: string, targetFieldId: string) => {
    if (sourceFieldId === targetFieldId) return;

    const sourceIndex = fields.findIndex((field) => field.id === sourceFieldId);
    const targetIndex = fields.findIndex((field) => field.id === targetFieldId);
    if (sourceIndex === -1 || targetIndex === -1) return;

    const updatedFields = [...fields];
    const [movedField] = updatedFields.splice(sourceIndex, 1);
    const adjustedTargetIndex = sourceIndex < targetIndex ? targetIndex - 1 : targetIndex;
    updatedFields.splice(adjustedTargetIndex, 0, movedField);

    onChange(updatedFields);
  };

  const handleSaveField = async () => {
    try {
      const values = await form.validateFields();
      const visibilityTargetField = fields.find((field) => field.key === values.visibilityFieldKey);
      const isCheckboxVisibility = visibilityTargetField?.type === 'checkbox';
      const parsedVisibilityValue = isCheckboxVisibility
        ? values.visibilityValue === true || values.visibilityValue === 'true'
        : values.visibilityValue;

      const parsedOptions = values.type === 'select' && Array.isArray(values.options)
        ? values.options
            .map((opt: string) => String(opt).trim())
            .filter((opt: string) => opt.length > 0)
            .filter((opt: string, index: number, arr: string[]) => arr.indexOf(opt) === index)
            .map((opt: string) => ({ label: opt, value: opt }))
        : undefined;
      
      const updatedField: FormField = {
        ...editingField!,
        key: values.key,
        label: values.label,
        type: values.type,
        required: values.required || false,
        placeholder: values.placeholder,
        description: values.description,
        regexPattern: values.type === 'text' && values.regexPattern
          ? values.regexPattern.trim()
          : undefined,
        options: parsedOptions,
        visibilityCondition: values.visibilityFieldKey
          ? {
              fieldKey: values.visibilityFieldKey,
              operator: values.visibilityOperator,
              value: parsedVisibilityValue,
            }
          : undefined,
      };

      if (fields.find((f) => f.id === updatedField.id)) {
        // Editar existente
        onChange(fields.map((f) => (f.id === updatedField.id ? updatedField : f)));
      } else {
        // Adicionar novo
        onChange([...fields, updatedField]);
      }

      setModalVisible(false);
      form.resetFields();
      setEditingField(null);
    } catch (error) {
      console.error('Erro ao salvar campo:', error);
    }
  };

  const renderFieldPreview = (field: FormField) => {
    const commonProps = {
      placeholder: field.placeholder,
      style: { width: '100%' },
    };

    switch (field.type) {
      case 'text':
      case 'email':
        return <Input {...commonProps} type={field.type} />;
      case 'number':
        return <Input {...commonProps} type="number" />;
      case 'textarea':
        return <Input.TextArea {...commonProps} rows={3} />;
      case 'select':
        return (
          <Select {...commonProps} options={field.options} />
        );
      case 'checkbox':
        return <Switch />;
      default:
        return <Input {...commonProps} />;
    }
  };

  const getFieldRules = (field: FormField): Rule[] => {
    const rules: Rule[] = [];

    if (field.required) {
      rules.push({
        required: true,
        message: `${field.label} é obrigatório`,
      });
    }

    if (field.type === 'email') {
      rules.push({
        type: 'email',
        message: 'Email inválido',
      });
    }

    if (field.type === 'text' && field.regexPattern) {
      try {
        rules.push({
          pattern: new RegExp(field.regexPattern),
          message: `${field.label} não está no formato esperado`,
        });
      } catch {
        // Ignora regex inválida no preview para não quebrar renderização
      }
    }

    return rules;
  };

  const availableVisibilityFields = fields.filter((field) => field.id !== editingField?.id);
  const selectedVisibilityFieldKey = Form.useWatch('visibilityFieldKey', form);
  const selectedVisibilityField = availableVisibilityFields.find(
    (field) => field.key === selectedVisibilityFieldKey,
  );
  const isCheckboxVisibilityField = selectedVisibilityField?.type === 'checkbox';

  const generateJsonSchema = () => {
    const schema = {
      title: 'Formulário Dinâmico',
      type: 'object',
      properties: {} as Record<string, unknown>,
      required: [] as string[],
    };

    fields.forEach((field) => {
      const fieldSchema: Record<string, unknown> = {
        title: field.label,
        description: field.description,
      };

      switch (field.type) {
        case 'text':
        case 'email':
        case 'textarea':
          fieldSchema.type = 'string';
          if (field.type === 'text' && field.regexPattern) {
            fieldSchema.pattern = field.regexPattern;
          }
          if (field.type === 'email') {
            fieldSchema.format = 'email';
          }
          break;
        case 'number':
          fieldSchema.type = 'number';
          break;
        case 'select':
          fieldSchema.type = 'string';
          fieldSchema.enum = field.options?.map((o) => o.value);
          fieldSchema.enumNames = field.options?.map((o) => o.label);
          break;
        case 'checkbox':
          fieldSchema.type = 'boolean';
          break;
      }

      schema.properties[field.key] = fieldSchema;

      if (field.required) {
        schema.required.push(field.key);
      }
    });

    return JSON.stringify(schema, null, 2);
  };

  return (
    <div>
      <Tabs
        activeKey={activeTab}
        onChange={setActiveTab}
        items={[
          {
            key: 'builder',
            label: (
              <span>
                <EditOutlined /> Editor
              </span>
            ),
            children: (
              <div>
                <Button
                  type="primary"
                  icon={<PlusOutlined />}
                  onClick={handleAddField}
                  style={{ marginBottom: '16px' }}
                >
                  Adicionar Campo
                </Button>

                {fields.length === 0 ? (
                  <Alert
                    message="Nenhum campo adicionado"
                    description="Clique em 'Adicionar Campo' para começar a criar seu formulário"
                    type="info"
                    showIcon
                  />
                ) : (
                  <div>
                    {fields.map((field, index) => (
                      <div
                        key={field.id}
                        draggable
                        onDragStart={(event) => {
                          setDraggingFieldId(field.id);
                          event.dataTransfer.effectAllowed = 'move';
                        }}
                        onDragOver={(event) => {
                          event.preventDefault();
                          event.dataTransfer.dropEffect = 'move';
                          if (dragOverFieldId !== field.id) {
                            setDragOverFieldId(field.id);
                          }
                        }}
                        onDragLeave={() => {
                          if (dragOverFieldId === field.id) {
                            setDragOverFieldId(null);
                          }
                        }}
                        onDrop={(event) => {
                          event.preventDefault();
                          if (draggingFieldId) {
                            handleDropOnField(draggingFieldId, field.id);
                          }
                          setDraggingFieldId(null);
                          setDragOverFieldId(null);
                        }}
                        onDragEnd={() => {
                          setDraggingFieldId(null);
                          setDragOverFieldId(null);
                        }}
                        style={{
                          marginBottom: '8px',
                          opacity: draggingFieldId === field.id ? 0.65 : 1,
                        }}
                      >
                        <Card
                          size="small"
                          hoverable
                          style={{
                            borderColor: dragOverFieldId === field.id ? token.colorPrimary : undefined,
                            borderWidth: dragOverFieldId === field.id ? 2 : undefined,
                          }}
                        >
                          <div
                            style={{
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'center',
                            }}
                          >
                            <Space>
                              <DragOutlined style={{ color: token.colorTextSecondary, cursor: 'move' }} />
                              <div>
                                <div style={{ fontWeight: 500 }}>{field.label}</div>
                                <Space size={4}>
                                  <Tag color="blue">{fieldTypes.find(t => t.value === field.type)?.label}</Tag>
                                  {field.required && <Tag color="red">Obrigatório</Tag>}
                                  {field.type === 'text' && field.regexPattern && <Tag color="purple">Regex</Tag>}
                                  {field.visibilityCondition && (
                                    <Tag color="orange">Condicional</Tag>
                                  )}
                                </Space>
                              </div>
                            </Space>

                            <Space>
                              <Button
                                type="text"
                                icon={<UpOutlined />}
                                disabled={index === 0}
                                onClick={() => handleMoveField(field.id, 'up')}
                              />
                              <Button
                                type="text"
                                icon={<DownOutlined />}
                                disabled={index === fields.length - 1}
                                onClick={() => handleMoveField(field.id, 'down')}
                              />
                              <Button
                                type="text"
                                icon={<EditOutlined />}
                                onClick={() => handleEditField(field)}
                              />
                              <Button
                                type="text"
                                danger
                                icon={<DeleteOutlined />}
                                onClick={() => handleDeleteField(field.id)}
                              />
                            </Space>
                          </div>
                        </Card>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ),
          },
          {
            key: 'preview',
            label: (
              <span>
                <EyeOutlined /> Preview
              </span>
            ),
            children: (
              <Card title="Preview do Formulário" style={{ backgroundColor: token.colorFillAlter }}>
                {fields.length === 0 ? (
                  <Alert
                    message="Adicione campos no editor para ver o preview"
                    type="info"
                    showIcon
                  />
                ) : (
                  <PreviewForm fields={fields} renderFieldPreview={renderFieldPreview} getFieldRules={getFieldRules} />
                )}
              </Card>
            ),
          },
          {
            key: 'json',
            label: 'JSON Schema',
            children: (
              <Card>
                <Alert
                  message="Este JSON será gerado automaticamente"
                  type="info"
                  showIcon
                  style={{ marginBottom: '16px' }}
                />
                <Input.TextArea
                  value={generateJsonSchema()}
                  readOnly
                  rows={15}
                  style={{ fontFamily: 'monospace', fontSize: '12px' }}
                />
              </Card>
            ),
          },
        ]}
      />

      {/* Modal de Edição de Campo */}
      <Modal
        title={editingField?.id && fields.find(f => f.id === editingField.id) ? 'Editar Campo' : 'Novo Campo'}
        open={modalVisible}
        onCancel={() => {
          setModalVisible(false);
          form.resetFields();
          setEditingField(null);
        }}
        onOk={handleSaveField}
        width={700}
        okText="Salvar"
        cancelText="Cancelar"
      >
        <Form form={form} layout="vertical">
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="key"
                label="Chave (ID do campo)"
                rules={[
                  { required: true, message: 'Chave obrigatória' },
                  { pattern: /^[a-z_][a-z0-9_]*$/i, message: 'Use apenas letras, números e _' },
                ]}
              >
                <Input placeholder="email_usuario" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="type"
                label="Tipo de Campo"
                rules={[{ required: true, message: 'Tipo obrigatório' }]}
              >
                <Select options={fieldTypes} />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            name="label"
            label="Rótulo (Label)"
            rules={[{ required: true, message: 'Rótulo obrigatório' }]}
          >
            <Input placeholder="Email do Usuário" />
          </Form.Item>

          <Form.Item noStyle shouldUpdate={(prev, curr) => prev.type !== curr.type}>
            {() => {
              const type = form.getFieldValue('type');

              if (type === 'textarea') {
                return (
                  <Form.Item name="placeholder" label="Placeholder">
                    <Input.TextArea placeholder="Digite o placeholder do campo" rows={3} />
                  </Form.Item>
                );
              }

              return (
                <Form.Item name="placeholder" label="Placeholder">
                  <Input placeholder="usuario@exemplo.com" />
                </Form.Item>
              );
            }}
          </Form.Item>

          <Form.Item name="description" label="Descrição (Help Text)">
            <Input.TextArea placeholder="Texto de ajuda opcional" rows={2} />
          </Form.Item>

          <Form.Item name="required" valuePropName="checked" label="Campo Obrigatório">
            <Switch />
          </Form.Item>

          <Form.Item noStyle shouldUpdate={(prev, curr) => prev.type !== curr.type}>
            {() => {
              const type = form.getFieldValue('type');
              if (type === 'text') {
                return (
                  <Form.Item
                    name="regexPattern"
                    label="Regex de Validação (Opcional)"
                    rules={[
                      {
                        validator: async (_, value) => {
                          if (!value || !String(value).trim()) return;
                          try {
                            new RegExp(String(value));
                          } catch {
                            throw new Error('Regex inválida');
                          }
                        },
                      },
                    ]}
                  >
                    <Input placeholder="Ex.: ^[A-Z]{3}-\\d{4}$" />
                  </Form.Item>
                );
              }

              if (type === 'select') {
                return (
                  <Form.Item
                    name="options"
                    label="Opções"
                    rules={[{ required: true, message: 'Adicione pelo menos uma opção' }]}
                  >
                    <Select
                      mode="tags"
                      placeholder="Digite uma opção e pressione Enter (ou use ;)"
                      tokenSeparators={[';']}
                      open={false}
                    />
                  </Form.Item>
                );
              }
              return null;
            }}
          </Form.Item>

          <Divider>Condição de Visibilidade (Opcional)</Divider>

          <Alert
            message="Este campo só aparecerá quando a condição for atendida"
            type="info"
            showIcon
            style={{ marginBottom: '16px' }}
          />

          <Row gutter={16}>
            <Col span={8}>
              <Form.Item name="visibilityFieldKey" label="Campo">
                <Select
                  placeholder="Selecione um campo"
                  allowClear
                  onChange={() => {
                    form.setFieldValue('visibilityOperator', undefined);
                    form.setFieldValue('visibilityValue', undefined);
                  }}
                  options={availableVisibilityFields.map((field) => ({
                    label: field.key,
                    value: field.key,
                  }))}
                />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="visibilityOperator" label="Operador">
                <Select
                  placeholder="Condição"
                  options={isCheckboxVisibilityField ? checkboxOperators : operators}
                />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item noStyle shouldUpdate={(prev, curr) => prev.visibilityFieldKey !== curr.visibilityFieldKey}>
                {() => {
                  if (isCheckboxVisibilityField) {
                    return (
                      <Form.Item
                        name="visibilityValue"
                        label="Valor"
                        rules={[{ required: true, message: 'Selecione true ou false' }]}
                      >
                        <Select
                          placeholder="Selecione"
                          options={[
                            { label: 'True', value: true },
                            { label: 'False', value: false },
                          ]}
                        />
                      </Form.Item>
                    );
                  }

                  return (
                    <Form.Item name="visibilityValue" label="Valor">
                      <Input placeholder="valor" />
                    </Form.Item>
                  );
                }}
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Modal>
    </div>
  );
};
