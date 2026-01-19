import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { Plus, Trash2, Edit, ChevronRight, Calendar } from 'lucide-react';
import { formDefinitionService } from '../api/services';
import type { FormDefinition } from '../types';
import { toast } from 'react-hot-toast';

export function FormDefinitionListPage() {
  const navigate = useNavigate();

  const { data: formDefs = [], isLoading, error } = useQuery({
    queryKey: ['form-definitions'],
    queryFn: async () => {
      const res = await formDefinitionService.getAll();
      return res.data;
    },
  });

  const handleDelete = async (id: string) => {
    if (!window.confirm('Tem certeza que quer deletar esta definição de formulário?')) return;

    try {
      await formDefinitionService.delete(id);
      toast.success('Formulário deletado com sucesso');
      // Refetch
      window.location.reload();
    } catch {
      toast.error('Erro ao deletar formulário');
    }
  };

  if (isLoading) return <div className="p-8 text-center">Carregando...</div>;
  if (error)
    return <div className="p-8 text-center text-red-600">Erro ao carregar formulários</div>;

  return (
    <div className="max-w-6xl mx-auto p-8">
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
            Definições de Formulários
          </h1>
          <button
            onClick={() => navigate('/admin/form-definitions/create')}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-5 h-5" />
            Novo Formulário
          </button>
        </div>
      </div>

      {formDefs.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            Nenhuma definição de formulário criada
          </p>
          <button
            onClick={() => navigate('/admin/form-definitions/create')}
            className="text-blue-600 hover:text-blue-700 font-medium"
          >
            Criar primeira
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {formDefs.map((formDef: FormDefinition) => (
            <div
              key={formDef.id}
              className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 hover:shadow-lg transition-shadow"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="inline-block px-3 py-1 bg-gray-100 dark:bg-gray-700 rounded-full text-sm font-medium text-gray-700 dark:text-gray-300">
                      v{formDef.version}
                    </span>
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400 flex items-center gap-1 mb-1">
                    <Calendar className="w-4 h-4" />
                    {new Date(formDef.createdAtUtc).toLocaleDateString('pt-BR')}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-500 truncate">
                    ID: {formDef.id}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => navigate(`/admin/form-definitions/${formDef.id}`)}
                    className="p-2 text-gray-500 hover:text-blue-600 dark:hover:text-blue-400 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                    title="Visualizar"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => navigate(`/admin/form-definitions/${formDef.id}/edit`)}
                    className="p-2 text-gray-500 hover:text-amber-600 dark:hover:text-amber-400 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                    title="Editar"
                  >
                    <Edit className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => handleDelete(formDef.id)}
                    className="p-2 text-gray-500 hover:text-red-600 dark:hover:text-red-400 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                    title="Deletar"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
