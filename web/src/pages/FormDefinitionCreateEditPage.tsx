import { useEffect, useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { formDefinitionService, offerService } from '../api/services';
import type { FormDefinitionInput, FormDefinitionUpdate, Offer } from '../types';
import { toast } from 'react-hot-toast';

export function FormDefinitionCreateEditPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditing = !!id;

  const [formData, setFormData] = useState<FormDefinitionInput>({
    offerId: '',
    version: 1,
    jsonSchema: '',
    uiSchema: '',
    rules: '',
  });

  const [loading, setLoading] = useState(false);

  // Get offers for dropdown
  const { data: offers = [] } = useQuery({
    queryKey: ['offers'],
    queryFn: async () => {
      const res = await offerService.getAll();
      return res.data;
    },
  });

  // Get form definition if editing
  const { data: formDef } = useQuery({
    queryKey: ['form-definition', id],
    queryFn: async () => {
      if (!id) return null;
      const res = await formDefinitionService.getById(id);
      return res.data;
    },
    enabled: isEditing,
  });

  useEffect(() => {
    if (formDef) {
      setFormData({
        offerId: formDef.offerId,
        version: formDef.version,
        jsonSchema: formDef.jsonSchema,
        uiSchema: formDef.uiSchema || '',
        rules: formDef.rules || '',
      });
    }
  }, [formDef]);

  const createMutation = useMutation({
    mutationFn: (data: FormDefinitionInput) => formDefinitionService.create(data),
    onSuccess: () => {
      toast.success('Formulário criado com sucesso');
      navigate('/admin/form-definitions');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Erro ao criar formulário');
    },
  });

  const updateMutation = useMutation({
    mutationFn: (data: FormDefinitionUpdate) => formDefinitionService.update(id!, data),
    onSuccess: () => {
      toast.success('Formulário atualizado com sucesso');
      navigate('/admin/form-definitions');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Erro ao atualizar formulário');
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.offerId) {
      toast.error('Selecione uma oferta');
      return;
    }

    if (!formData.jsonSchema.trim()) {
      toast.error('Preencha o JSON Schema');
      return;
    }

    // Validate JSON
    try {
      JSON.parse(formData.jsonSchema);
    } catch {
      toast.error('JSON Schema inválido');
      return;
    }

    if (formData.uiSchema) {
      try {
        JSON.parse(formData.uiSchema);
      } catch {
        toast.error('UI Schema inválido');
        return;
      }
    }

    if (formData.rules) {
      try {
        JSON.parse(formData.rules);
      } catch {
        toast.error('Rules inválido');
        return;
      }
    }

    setLoading(true);

    if (isEditing) {
      await updateMutation.mutateAsync({
        ...formData,
        id: id!,
        createdAtUtc: formDef?.createdAtUtc || new Date().toISOString(),
      });
    } else {
      await createMutation.mutateAsync(formData);
    }

    setLoading(false);
  };

  return (
    <div className="max-w-2xl mx-auto p-8">
      <button
        onClick={() => navigate('/admin/form-definitions')}
        className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 mb-8"
      >
        <ArrowLeft className="w-5 h-5" />
        Voltar
      </button>

      <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-8">
        {isEditing ? 'Editar Definição de Formulário' : 'Criar Definição de Formulário'}
      </h1>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Oferta */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Oferta *
          </label>
          <select
            value={formData.offerId}
            onChange={(e) => setFormData({ ...formData, offerId: e.target.value })}
            disabled={isEditing}
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <option value="">Selecione uma oferta</option>
            {offers.map((offer: Offer) => (
              <option key={offer.id} value={offer.id}>
                {offer.name}
              </option>
            ))}
          </select>
        </div>

        {/* Version */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Versão *
          </label>
          <input
            type="number"
            min="1"
            value={formData.version}
            onChange={(e) => setFormData({ ...formData, version: parseInt(e.target.value) })}
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
          />
        </div>

        {/* JSON Schema */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            JSON Schema *
          </label>
          <textarea
            value={formData.jsonSchema}
            onChange={(e) => setFormData({ ...formData, jsonSchema: e.target.value })}
            rows={8}
            placeholder='{"type": "object", "properties": {...}}'
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 font-mono text-sm"
          />
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
            Schema JSON válido (validado ao salvar)
          </p>
        </div>

        {/* UI Schema */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            UI Schema
          </label>
          <textarea
            value={formData.uiSchema}
            onChange={(e) => setFormData({ ...formData, uiSchema: e.target.value })}
            rows={6}
            placeholder='{"ui:order": [...]}'
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 font-mono text-sm"
          />
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
            Opcional - Schema JSON válido (validado ao salvar)
          </p>
        </div>

        {/* Rules */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Regras
          </label>
          <textarea
            value={formData.rules}
            onChange={(e) => setFormData({ ...formData, rules: e.target.value })}
            rows={6}
            placeholder='{"conditions": [...]}'
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 font-mono text-sm"
          />
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
            Opcional - Schema JSON válido (validado ao salvar)
          </p>
        </div>

        {/* Buttons */}
        <div className="flex gap-4 pt-4">
          <button
            type="button"
            onClick={() => navigate('/admin/form-definitions')}
            className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={loading}
            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? 'Salvando...' : isEditing ? 'Atualizar' : 'Criar'}
          </button>
        </div>
      </form>
    </div>
  );
}
