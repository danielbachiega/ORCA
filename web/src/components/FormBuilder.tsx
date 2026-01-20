import { useState } from 'react';
import { Plus, Trash2, ChevronDown } from 'lucide-react';
import { toast } from 'react-hot-toast';

export interface FormField {
  id: string;
  name: string;
  label: string;
  type: 'text' | 'email' | 'number' | 'checkbox' | 'select' | 'textarea';
  required: boolean;
  options?: string[]; // Para select/radio
  description?: string;
  visibleIf?: {
    fieldId: string;
    value: string;
  };
}

interface FormBuilderProps {
  fields: FormField[];
  onFieldsChange: (fields: FormField[]) => void;
}

export function FormBuilder({ fields, onFieldsChange }: FormBuilderProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [newOption, setNewOption] = useState<Record<string, string>>({});

  const addField = () => {
    const newField: FormField = {
      id: `field-${Date.now()}`,
      name: `field_${fields.length + 1}`,
      label: `Campo ${fields.length + 1}`,
      type: 'text',
      required: false,
    };
    onFieldsChange([...fields, newField]);
    setExpandedId(newField.id);
  };

  const updateField = (id: string, updates: Partial<FormField>) => {
    onFieldsChange(
      fields.map((f) => (f.id === id ? { ...f, ...updates } : f))
    );
  };

  const removeField = (id: string) => {
    onFieldsChange(fields.filter((f) => f.id !== id));
    // Remove dependências apontando pra este campo
    onFieldsChange(
      fields
        .filter((f) => f.id !== id)
        .map((f) => ({
          ...f,
          visibleIf: f.visibleIf?.fieldId === id ? undefined : f.visibleIf,
        }))
    );
  };

  const addOption = (fieldId: string) => {
    const optionValue = newOption[fieldId]?.trim();
    if (!optionValue) {
      toast.error('Digite uma opção');
      return;
    }

    updateField(fieldId, {
      options: [...(fields.find((f) => f.id === fieldId)?.options || []), optionValue],
    });
    setNewOption({ ...newOption, [fieldId]: '' });
  };

  const removeOption = (fieldId: string, index: number) => {
    updateField(fieldId, {
      options: fields
        .find((f) => f.id === fieldId)
        ?.options?.filter((_, i) => i !== index),
    });
  };

  return (
    <div className="space-y-4">
      {/* Adicionar campo */}
      <button
        type="button"
        onClick={addField}
        className="w-full flex items-center justify-center gap-2 px-4 py-3 border-2 border-dashed border-blue-300 dark:border-blue-600 rounded-lg text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition"
      >
        <Plus className="w-5 h-5" />
        Adicionar Campo
      </button>

      {/* Lista de campos */}
      <div className="space-y-2">
        {fields.map((field) => (
          <div
            key={field.id}
            className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden"
          >
            {/* Header */}
            <div className="w-full flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/50">
              <button
                type="button"
                onClick={() =>
                  setExpandedId(expandedId === field.id ? null : field.id)
                }
                className="flex items-center gap-3 flex-1 hover:opacity-80 transition text-left"
              >
                <ChevronDown
                  className={`w-4 h-4 transition ${
                    expandedId === field.id ? 'rotate-180' : ''
                  }`}
                />
                <div>
                  <div className="font-medium text-gray-900 dark:text-gray-100">
                    {field.label}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    {field.type} {field.required && '(obrigatório)'}
                  </div>
                </div>
              </button>

              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  removeField(field.id);
                }}
                className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>

            {/* Expandido */}
            {expandedId === field.id && (
              <div className="p-4 space-y-4 border-t border-gray-200 dark:border-gray-700">
                {/* Label */}
                <div>
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Rótulo
                  </label>
                  <input
                    type="text"
                    value={field.label}
                    onChange={(e) => updateField(field.id, { label: e.target.value })}
                    className="w-full mt-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-sm"
                  />
                </div>

                {/* Name */}
                <div>
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Nome (para payload)
                  </label>
                  <input
                    type="text"
                    value={field.name}
                    onChange={(e) => updateField(field.id, { name: e.target.value })}
                    placeholder="campo_nome"
                    className="w-full mt-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-sm"
                  />
                </div>

                {/* Description */}
                <div>
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Descrição (opcional)
                  </label>
                  <textarea
                    value={field.description || ''}
                    onChange={(e) =>
                      updateField(field.id, { description: e.target.value })
                    }
                    rows={2}
                    className="w-full mt-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-sm"
                  />
                </div>

                {/* Type */}
                <div>
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Tipo
                  </label>
                  <select
                    value={field.type}
                    onChange={(e) =>
                      updateField(field.id, {
                        type: e.target.value as FormField['type'],
                        options: e.target.value === 'select' ? [''] : undefined,
                      })
                    }
                    className="w-full mt-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-sm"
                  >
                    <option value="text">Texto</option>
                    <option value="email">Email</option>
                    <option value="number">Número</option>
                    <option value="textarea">Texto longo</option>
                    <option value="checkbox">Checkbox</option>
                    <option value="select">Dropdown</option>
                  </select>
                </div>

                {/* Opções (para select) */}
                {field.type === 'select' && (
                  <div>
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Opções
                    </label>
                    <div className="space-y-2 mt-2">
                      {field.options?.map((opt, idx) => (
                        <div key={idx} className="flex gap-2">
                          <input
                            type="text"
                            value={opt}
                            readOnly
                            className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-100 dark:bg-gray-600 text-gray-900 dark:text-gray-100 text-sm"
                          />
                          <button
                            type="button"
                            onClick={() => removeOption(field.id, idx)}
                            className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      ))}

                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={newOption[field.id] || ''}
                          onChange={(e) =>
                            setNewOption({ ...newOption, [field.id]: e.target.value })
                          }
                          placeholder="Nova opção"
                          className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-sm"
                        />
                        <button
                          type="button"
                          onClick={() => addOption(field.id)}
                          className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
                        >
                          +
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Required */}
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={field.required}
                    onChange={(e) =>
                      updateField(field.id, { required: e.target.checked })
                    }
                    className="w-4 h-4"
                  />
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Campo obrigatório
                  </label>
                </div>

                {/* Visibilidade Condicional */}
                <div>
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Mostrar se:
                  </label>
                  <div className="space-y-2 mt-2">
                    <div>
                      <label className="text-xs text-gray-600 dark:text-gray-400">
                        Campo
                      </label>
                      <select
                        value={field.visibleIf?.fieldId || ''}
                        onChange={(e) => {
                          if (!e.target.value) {
                            updateField(field.id, { visibleIf: undefined });
                          } else {
                            updateField(field.id, {
                              visibleIf: {
                                fieldId: e.target.value,
                                value: field.visibleIf?.value || '',
                              },
                            });
                          }
                        }}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-sm"
                      >
                        <option value="">Nenhuma condição</option>
                        {fields
                          .filter((f) => f.id !== field.id)
                          .map((f) => (
                            <option key={f.id} value={f.id}>
                              {f.label}
                            </option>
                          ))}
                      </select>
                    </div>

                    {field.visibleIf && (
                      <div>
                        <label className="text-xs text-gray-600 dark:text-gray-400">
                          For igual a
                        </label>
                        <input
                          type="text"
                          value={field.visibleIf.value}
                          onChange={(e) =>
                            updateField(field.id, {
                              visibleIf: {
                                ...field.visibleIf!,
                                value: e.target.value,
                              },
                            })
                          }
                          placeholder="valor"
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-sm"
                        />
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {fields.length === 0 && (
        <div className="text-center py-8 text-gray-500 dark:text-gray-400">
          Nenhum campo adicionado ainda
        </div>
      )}
    </div>
  );
}

/**
 * Gera JSON Schema a partir dos campos do builder
 */
export function generateJsonSchema(fields: FormField[]): string {
  const properties: Record<string, any> = {};
  const required: string[] = [];
  const meta: Record<string, any> = {};

  fields.forEach((field) => {
    const fieldSchema: any = {
      title: field.label,
      ...(field.description && { description: field.description }),
      'x-orca': {
        id: field.id,
        ...(field.visibleIf
          ? { visibleIf: { fieldId: field.visibleIf.fieldId, value: field.visibleIf.value } }
          : {}),
      },
    };

    switch (field.type) {
      case 'text':
        fieldSchema.type = 'string';
        break;
      case 'email':
        fieldSchema.type = 'string';
        fieldSchema.format = 'email';
        break;
      case 'number':
        fieldSchema.type = 'number';
        break;
      case 'textarea':
        fieldSchema.type = 'string';
        break;
      case 'checkbox':
        fieldSchema.type = 'boolean';
        break;
      case 'select':
        fieldSchema.type = 'string';
        fieldSchema.enum = field.options || [];
        break;
    }

    properties[field.name] = fieldSchema;
    meta[field.name] = {
      id: field.id,
      ...(field.visibleIf
        ? { visibleIf: { fieldId: field.visibleIf.fieldId, value: field.visibleIf.value } }
        : {}),
    };

    if (field.required) {
      required.push(field.name);
    }
  });

  return JSON.stringify(
    {
      type: 'object',
      properties,
      'x-orca': { fields: meta },
      required: required.length > 0 ? required : undefined,
    },
    null,
    2
  );
}

/**
 * Gera UI Schema com suporte a condições de visibilidade
 */
export function generateUiSchema(fields: FormField[]): string {
  const uiSchema: any = {};

  fields.forEach((field) => {
    const meta = {
      id: field.id,
      ...(field.visibleIf
        ? { visibleIf: { fieldId: field.visibleIf.fieldId, value: field.visibleIf.value } }
        : {}),
    };

    const fieldUi: any = {
      'ui:widget': field.type === 'textarea' ? 'textarea' : undefined,
      'ui:orca:meta': meta,
    };

    if (field.visibleIf) {
      const conditionFieldName = fields.find((f) => f.id === field.visibleIf!.fieldId)?.name;
      if (conditionFieldName) {
        fieldUi['ui:help'] = `Mostrado quando ${conditionFieldName} = ${field.visibleIf.value}`;
      }
    }

    Object.keys(fieldUi).forEach((key) => fieldUi[key] === undefined && delete fieldUi[key]);

    uiSchema[field.name] = fieldUi;
  });

  return JSON.stringify(uiSchema, null, 2);
}
