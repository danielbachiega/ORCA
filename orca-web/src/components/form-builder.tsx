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
} from 'antd';
import {
  PlusOutlined,
  DeleteOutlined,
  EditOutlined,
  EyeOutlined,
  DragOutlined,
} from '@ant-design/icons';

export interface FormField {
  id: string;
  key: string;
  label: string;
  type: 'text' | 'number' | 'email' | 'select' | 'checkbox' | 'textarea';
  required: boolean;
  placeholder?: string;
  description?: string;
  options?: Array<{ label: string; value: string }>;
  visibilityCondition?: {
    fieldKey: string;
    operator: 'equals' | 'notEquals' | 'contains';
    value: string;
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

// Componente para preview com suporte a visibilidade condicional
interface PreviewFormProps {
  fields: FormField[];
  renderFieldPreview: (field: FormField) => React.ReactNode;
}

const PreviewForm: React.FC<PreviewFormProps> = ({ fields, renderFieldPreview }) => {
  const [previewForm] = Form.useForm();
  const previewValues = Form.useWatch([], previewForm);

  // Atualizar lógica de visibilidade baseada nos valores atuais
  const isFieldVisibleNow = (field: FormField): boolean => {
    if (!field.visibilityCondition) return true;

    const { fieldKey, operator, value } = field.visibilityCondition;
    const fieldValue = previewValues?.[fieldKey];

    switch (operator) {
      case 'equals':
        return fieldValue === value;
      case 'notEquals':
        return fieldValue !== value;
      case 'contains':
        return String(fieldValue || '').includes(String(value));
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
  const [editingField, setEditingField] = useState<FormField | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [form] = Form.useForm();
  const [activeTab, setActiveTab] = useState('builder');

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
      options: field.options?.map((opt) => opt.label).join(', '),
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

  const handleSaveField = async () => {
    try {
      const values = await form.validateFields();
      
      const updatedField: FormField = {
        ...editingField!,
        key: values.key,
        label: values.label,
        type: values.type,
        required: values.required || false,
        placeholder: values.placeholder,
        description: values.description,
        options: values.type === 'select' && values.options 
          ? values.options.split(',').map((opt: string) => {
              const trimmed = opt.trim();
              return { label: trimmed, value: trimmed.toLowerCase() };
            })
          : undefined,
        visibilityCondition: values.visibilityFieldKey
          ? {
              fieldKey: values.visibilityFieldKey,
              operator: values.visibilityOperator,
              value: values.visibilityValue,
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
                    {fields.map((field) => (
                      <Card
                        key={field.id}
                        size="small"
                        style={{ marginBottom: '8px' }}
                        hoverable
                      >
                        <div
                          style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                          }}
                        >
                          <Space>
                            <DragOutlined style={{ color: '#999', cursor: 'move' }} />
                            <div>
                              <div style={{ fontWeight: 500 }}>{field.label}</div>
                              <Space size={4}>
                                <Tag color="blue">{fieldTypes.find(t => t.value === field.type)?.label}</Tag>
                                {field.required && <Tag color="red">Obrigatório</Tag>}
                                {field.visibilityCondition && (
                                  <Tag color="orange">Condicional</Tag>
                                )}
                              </Space>
                            </div>
                          </Space>

                          <Space>
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
              <Card title="Preview do Formulário" style={{ backgroundColor: '#fafafa' }}>
                {fields.length === 0 ? (
                  <Alert
                    message="Adicione campos no editor para ver o preview"
                    type="info"
                    showIcon
                  />
                ) : (
                  <PreviewForm fields={fields} renderFieldPreview={renderFieldPreview} />
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

          <Form.Item name="placeholder" label="Placeholder">
            <Input placeholder="usuario@exemplo.com" />
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
              if (type === 'select') {
                return (
                  <Form.Item
                    name="options"
                    label="Opções (separadas por vírgula)"
                    rules={[{ required: true, message: 'Adicione pelo menos uma opção' }]}
                  >
                    <Input placeholder="TI, RH, Financeiro, Operações" />
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
                  options={fields
                    .filter((f) => f.id !== editingField?.id)
                    .map((f) => ({ label: f.label, value: f.key }))}
                />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="visibilityOperator" label="Operador">
                <Select placeholder="Condição" options={operators} />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="visibilityValue" label="Valor">
                <Input placeholder="valor" />
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Modal>
    </div>
  );
};
