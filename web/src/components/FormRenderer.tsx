import { useState, useMemo } from 'react';
import type { FormField } from './FormBuilder';

interface FormRendererProps {
  fields: FormField[];
  onSubmit?: (data: Record<string, any>) => void;
  readOnly?: boolean;
}

export function FormRenderer({ fields, readOnly = false }: FormRendererProps) {
  const [formData, setFormData] = useState<Record<string, any>>({});

  const visibleFields = useMemo(() => {
    return fields.filter((field) => {
      if (!field.visibleIf) return true;

      const dependencyField = fields.find((f) => f.id === field.visibleIf!.fieldId);
      if (!dependencyField) return true;

      return formData[dependencyField.name] === field.visibleIf.value;
    });
  }, [fields, formData]);

  const handleChange = (name: string, value: any) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  return (
    <div className="space-y-6">
      {visibleFields.length === 0 ? (
        <div className="text-center py-8 text-gray-500 dark:text-gray-400">
          Nenhum campo visível
        </div>
      ) : (
        visibleFields.map((field) => (
          <div key={field.id} className="space-y-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              {field.label}
              {field.required && <span className="text-red-500 ml-1">*</span>}
            </label>

            {field.description && (
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {field.description}
              </p>
            )}

            {field.type === 'text' && (
              <input
                type="text"
                value={formData[field.name] || ''}
                onChange={(e) => handleChange(field.name, e.target.value)}
                required={field.required}
                readOnly={readOnly}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 disabled:opacity-50"
              />
            )}

            {field.type === 'email' && (
              <input
                type="email"
                value={formData[field.name] || ''}
                onChange={(e) => handleChange(field.name, e.target.value)}
                required={field.required}
                readOnly={readOnly}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 disabled:opacity-50"
              />
            )}

            {field.type === 'number' && (
              <input
                type="number"
                value={formData[field.name] || ''}
                onChange={(e) =>
                  handleChange(field.name, e.target.value ? parseFloat(e.target.value) : '')
                }
                required={field.required}
                readOnly={readOnly}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 disabled:opacity-50"
              />
            )}

            {field.type === 'textarea' && (
              <textarea
                value={formData[field.name] || ''}
                onChange={(e) => handleChange(field.name, e.target.value)}
                required={field.required}
                readOnly={readOnly}
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 disabled:opacity-50"
              />
            )}

            {field.type === 'checkbox' && (
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={formData[field.name] || false}
                  onChange={(e) => handleChange(field.name, e.target.checked)}
                  disabled={readOnly}
                  className="w-4 h-4"
                />
                <span className="text-sm text-gray-700 dark:text-gray-300">Sim</span>
              </label>
            )}

            {field.type === 'select' && (
              <select
                value={formData[field.name] || ''}
                onChange={(e) => handleChange(field.name, e.target.value)}
                required={field.required}
                disabled={readOnly}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 disabled:opacity-50"
              >
                <option value="">Selecione...</option>
                {field.options?.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
            )}
          </div>
        ))
      )}
    </div>
  );
}
