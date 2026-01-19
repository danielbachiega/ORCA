import { useQuery, useMutation } from '@tanstack/react-query';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Edit, Trash2, Copy } from 'lucide-react';
import { formDefinitionService, offerService } from '../api/services';
import type { Offer } from '../types';
import { toast } from 'react-hot-toast';

export function FormDefinitionDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const { data: formDef, isLoading, error } = useQuery({
    queryKey: ['form-definition', id],
    queryFn: async () => {
      const res = await formDefinitionService.getById(id!);
      return res.data;
    },
  });

  const { data: offers = [] } = useQuery({
    queryKey: ['offers'],
    queryFn: async () => {
      const res = await offerService.getAll();
      return res.data;
    },
  });

  const deleteMutation = useMutation({
    mutationFn: () => formDefinitionService.delete(id!),
    onSuccess: () => {
      toast.success('Formulário deletado com sucesso');
      navigate('/admin/form-definitions');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Erro ao deletar');
    },
  });

  const handleDelete = () => {
    if (!window.confirm('Tem certeza que quer deletar esta definição de formulário?')) return;
    deleteMutation.mutate();
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Copiado para clipboard');
  };

  if (isLoading) return <div className="p-8 text-center">Carregando...</div>;
  if (error || !formDef) return <div className="p-8 text-center text-red-600">Erro ao carregar</div>;

  const offer = offers.find((o: Offer) => o.id === formDef.offerId);

  return (
    <div className="max-w-4xl mx-auto p-8">
      <button
        onClick={() => navigate('/admin/form-definitions')}
        className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 mb-8"
      >
        <ArrowLeft className="w-5 h-5" />
        Voltar
      </button>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8">
        <div className="flex items-start justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">
              Formulário v{formDef.version}
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              {offer ? `Oferta: ${offer.name}` : 'Oferta não encontrada'}
            </p>
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => navigate(`/admin/form-definitions/${id}/edit`)}
              className="flex items-center gap-2 px-4 py-2 text-amber-600 hover:bg-amber-50 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              <Edit className="w-5 h-5" />
              Editar
            </button>
            <button
              onClick={handleDelete}
              disabled={deleteMutation.isPending}
              className="flex items-center gap-2 px-4 py-2 text-red-600 hover:bg-red-50 dark:hover:bg-gray-700 rounded-lg transition-colors disabled:opacity-50"
            >
              <Trash2 className="w-5 h-5" />
              Deletar
            </button>
          </div>
        </div>

        <div className="space-y-8">
          {/* ID e Timestamps */}
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Info</h2>
            <div className="grid gap-4">
              <div>
                <label className="text-sm font-medium text-gray-600 dark:text-gray-400">ID</label>
                <div className="flex items-center gap-2 mt-1">
                  <code className="flex-1 px-3 py-2 bg-gray-100 dark:bg-gray-700 rounded text-xs break-all">
                    {formDef.id}
                  </code>
                  <button
                    onClick={() => handleCopy(formDef.id)}
                    className="p-2 text-gray-500 hover:text-blue-600 rounded"
                  >
                    <Copy className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Criado em
                </label>
                <div className="mt-1 text-gray-900 dark:text-gray-100">
                  {new Date(formDef.createdAtUtc).toLocaleString('pt-BR')}
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Oferta ID
                </label>
                <div className="flex items-center gap-2 mt-1">
                  <code className="flex-1 px-3 py-2 bg-gray-100 dark:bg-gray-700 rounded text-xs break-all">
                    {formDef.offerId}
                  </code>
                  <button
                    onClick={() => handleCopy(formDef.offerId)}
                    className="p-2 text-gray-500 hover:text-blue-600 rounded"
                  >
                    <Copy className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* JSON Schema */}
          <div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
              JSON Schema
            </h2>
            <pre className="bg-gray-100 dark:bg-gray-700 p-4 rounded-lg overflow-auto max-h-80 text-xs">
              {JSON.stringify(JSON.parse(formDef.jsonSchema), null, 2)}
            </pre>
          </div>

          {/* UI Schema */}
          {formDef.uiSchema && (
            <div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
                UI Schema
              </h2>
              <pre className="bg-gray-100 dark:bg-gray-700 p-4 rounded-lg overflow-auto max-h-80 text-xs">
                {JSON.stringify(JSON.parse(formDef.uiSchema), null, 2)}
              </pre>
            </div>
          )}

          {/* Rules */}
          {formDef.rules && (
            <div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
                Regras
              </h2>
              <pre className="bg-gray-100 dark:bg-gray-700 p-4 rounded-lg overflow-auto max-h-80 text-xs">
                {JSON.stringify(JSON.parse(formDef.rules), null, 2)}
              </pre>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
