import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Calendar, Tag, Plus, Trash2, Edit2 } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { offerService, formDefinitionService } from '../api/services';
import { FormBuilder, generateJsonSchema, generateUiSchema } from '../components/FormBuilder';
import { FormRenderer } from '../components/FormRenderer';
import type { OfferUpdate, FormDefinitionInput, FormField } from '../types';

function formatDate(dateIso?: string) {
  if (!dateIso) return '—';
  return new Date(dateIso).toLocaleDateString('pt-BR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

function parseFieldsFromJson(jsonSchema: string, uiSchema?: string): FormField[] {
  let parsedUiSchema: Record<string, any> = {};
  try {
    parsedUiSchema = uiSchema ? JSON.parse(uiSchema) : {};
  } catch {
    parsedUiSchema = {};
  }

  try {
    const schema = JSON.parse(jsonSchema);
    const properties = schema.properties || {};
    const rootMeta =
      schema['x-orca'] && typeof schema['x-orca'] === 'object' && schema['x-orca'].fields
        ? schema['x-orca'].fields
        : {};

    // Primeiro passo: criar mapa de name -> id para resolver condições
    const nameToId: Record<string, string> = {};

    const fields = Object.keys(properties).map((key) => {
      const prop = properties[key];
      const uiField = parsedUiSchema[key] || {};

      const uiMeta =
        typeof uiField['ui:orca:meta'] === 'object' && uiField['ui:orca:meta'] !== null
          ? uiField['ui:orca:meta']
          : {};

      const schemaMeta =
        typeof prop['x-orca'] === 'object' && prop['x-orca'] !== null ? prop['x-orca'] : {};

      const rootFieldMeta =
        rootMeta && typeof rootMeta[key] === 'object' && rootMeta[key] !== null ? rootMeta[key] : {};

      let meta = { ...rootFieldMeta, ...schemaMeta, ...uiMeta };
      const fieldId = meta.id || key;

      nameToId[key] = fieldId;

      const fieldType =
        prop.type === 'string'
          ? prop.format === 'email'
            ? 'email'
            : 'text'
          : prop.type === 'number'
          ? 'number'
          : prop.type === 'boolean'
          ? 'checkbox'
          : 'text';

      return {
        id: fieldId,
        type: fieldType as any,
        label: prop.title || key,
        name: key,
        required: schema.required?.includes(key) || false,
        options: prop.enum || [],
        description: prop.description || '',
        visibleIf: meta.visibleIf,
        uiHelp: parsedUiSchema[key]?.['ui:help'],
      };
    });

    // Segundo passo: resolver ui:help para visibleIf
    const result = fields.map((field) => {
      let visibleIf = field.visibleIf;

      if (!visibleIf && field.uiHelp && typeof field.uiHelp === 'string') {
        const match = field.uiHelp.match(/Mostrado quando (\w+) = (.+)/);
        if (match) {
          const conditionFieldName = match[1];
          const conditionValue = match[2];
          const conditionFieldId = nameToId[conditionFieldName];
          if (conditionFieldId) {
            visibleIf = {
              fieldId: conditionFieldId,
              value: conditionValue,
            };
          }
        }
      }

      const { uiHelp, ...fieldWithoutUiHelp } = field;
      return {
        ...fieldWithoutUiHelp,
        visibleIf,
      };
    });

    return result;
  } catch {
    return [];
  }
}

export function OfferDetailPage() {
  const navigate = useNavigate();
  const { offerId } = useParams<{ offerId: string }>();
  const queryClient = useQueryClient();
  const [showCreateBlank, setShowCreateBlank] = useState(false);
  const [editingForm, setEditingForm] = useState<any>(null);
  const [prefillFields, setPrefillFields] = useState<FormField[] | null>(null);
  const [prefillVersion, setPrefillVersion] = useState<number | null>(null);

  const {
    data: offer,
    isLoading: offerLoading,
    error: offerError,
  } = useQuery({
    queryKey: ['offer', offerId],
    queryFn: async () => {
      const response = await offerService.getById(offerId!);
      return response.data;
    },
    enabled: !!offerId,
  });

  const {
    data: forms = [],
    isLoading: formsLoading,
  } = useQuery({
    queryKey: ['offer-forms', offerId],
    queryFn: async () => {
      const response = await formDefinitionService.getByOfferId(offerId!);
      return response.data;
    },
    enabled: !!offerId,
  });

  const deleteMutation = useMutation({
    mutationFn: () => offerService.delete(offerId!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['offers'] });
      toast.success('Oferta excluída');
      navigate('/offers');
    },
    onError: () => toast.error('Erro ao excluir a oferta.'),
  });

  const toggleActiveMutation = useMutation({
    mutationFn: async () => {
      const body: OfferUpdate = {
        id: offerId!,
        slug: offer!.slug,
        name: offer!.name,
        description: offer!.description,
        imageUrl: offer!.imageUrl,
        tags: offer!.tags,
        active: !offer!.active,
        createdAtUtc: offer!.createdAtUtc,
        updateAtUtc: new Date().toISOString(),
      };
      const res = await offerService.update(offerId!, body);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['offers'] });
      queryClient.invalidateQueries({ queryKey: ['offer', offerId] });
      toast.success('Status atualizado');
    },
    onError: () => toast.error('Erro ao atualizar status.'),
  });

  const createFormMutation = useMutation({
    mutationFn: (data: FormDefinitionInput) => formDefinitionService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['offer-forms', offerId] });
      toast.success('Nova versão criada');
      setShowCreateBlank(false);
      setEditingForm(null);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Erro ao criar versão');
    },
  });

  const updateFormMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => formDefinitionService.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['offer-forms', offerId] });
      toast.success('Versão atualizada');
      setEditingForm(null);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Erro ao atualizar versão');
    },
  });

  const publishFormMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data?: any }) => {
      if (data) {
        await formDefinitionService.update(id, data);
      }
      return formDefinitionService.publish(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['offer-forms', offerId] });
      toast.success('Versão publicada!');
      setEditingForm(null);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Erro ao publicar versão');
    },
  });

  const deleteFormMutation = useMutation({
    mutationFn: (formId: string) => formDefinitionService.delete(formId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['offer-forms', offerId] });
      toast.success('Formulário deletado');
    },
    onError: () => toast.error('Erro ao deletar formulário'),
  });

  if (offerLoading) {
    return (
      <div className="p-6 space-y-4">
        <button
          onClick={() => navigate('/offers')}
          className="flex items-center gap-2 text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
        >
          <ArrowLeft className="h-5 w-5" />
          Voltar
        </button>
        <div className="h-64 rounded-xl bg-gray-200 animate-pulse dark:bg-gray-700" />
        <div className="h-8 w-1/2 rounded bg-gray-200 animate-pulse dark:bg-gray-700" />
        <div className="h-4 w-full rounded bg-gray-200 animate-pulse dark:bg-gray-700" />
      </div>
    );
  }

  if (offerError || !offer) {
    return (
      <div className="p-6 text-center space-y-4">
        <button
          onClick={() => navigate('/offers')}
          className="flex items-center gap-2 text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 mx-auto"
        >
          <ArrowLeft className="h-5 w-5" />
          Voltar
        </button>
        <div className="text-red-600 font-semibold dark:text-red-400">Oferta não encontrada</div>
      </div>
    );
  }

  const avatarColors = [
    'from-blue-500 to-indigo-500',
    'from-emerald-500 to-teal-500',
    'from-amber-500 to-orange-500',
    'from-rose-500 to-pink-500',
    'from-sky-500 to-cyan-500',
  ];
  const hash = offer.id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const gradient = avatarColors[hash % avatarColors.length];
  const initials = offer.name?.slice(0, 2)?.toUpperCase() || 'OF';

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900">
      {/* Header */}
      <div className="border-b border-gray-200 dark:border-gray-700">
        <div className="p-6 max-w-4xl mx-auto">
          <button
            onClick={() => navigate('/offers')}
            className="flex items-center gap-2 text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 mb-4"
          >
            <ArrowLeft className="h-5 w-5" />
            Voltar para ofertas
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="p-6 max-w-4xl mx-auto space-y-8">
        {/* Hero */}
        <div className="rounded-xl overflow-hidden">
          {offer.imageUrl ? (
            <img
              src={offer.imageUrl}
              alt={offer.name}
              className="w-full h-80 object-cover"
            />
          ) : (
            <div
              className={`w-full h-80 bg-gradient-to-br ${gradient} flex items-center justify-center text-white text-6xl font-semibold`}
            >
              {initials}
            </div>
          )}
        </div>

        {/* Title and Meta */}
        <div className="space-y-4">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="text-4xl font-bold text-gray-900 dark:text-white">{offer.name}</h1>
              <p className="text-gray-500 dark:text-gray-400 mt-1">Slug: {offer.slug}</p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => navigate(`/admin/offers/${offer.id}/edit`)}
                className="px-3 py-2 rounded-lg border border-gray-200 text-gray-700 hover:bg-gray-50 transition dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-800"
              >
                Editar
              </button>
              <button
                onClick={() => {
                  if (confirm('Excluir esta oferta?')) deleteMutation.mutate();
                }}
                className="px-3 py-2 rounded-lg border border-red-300 text-red-700 hover:bg-red-50 transition dark:border-red-600 dark:text-red-400 dark:hover:bg-red-900/20"
              >
                Excluir
              </button>
            </div>
            <button
              onClick={() => toggleActiveMutation.mutate()}
              disabled={toggleActiveMutation.isPending}
              className={`px-4 py-2 rounded-full text-sm font-semibold whitespace-nowrap border transition ${
                offer.active
                  ? 'bg-green-50 text-green-700 border-green-200 hover:bg-green-100 dark:bg-green-900/30 dark:text-green-400 dark:border-green-700'
                  : 'bg-gray-100 text-gray-600 border-gray-300 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-600'
              } ${toggleActiveMutation.isPending ? 'opacity-70 cursor-not-allowed' : ''}`}
            >
              {toggleActiveMutation.isPending ? 'Salvando...' : offer.active ? 'Ativa' : 'Inativa'}
            </button>
          </div>

          <p className="text-lg text-gray-700 dark:text-gray-300 leading-relaxed">
            {offer.description || 'Sem descrição informada.'}
          </p>
        </div>

        {/* Tags */}
        {offer.tags.length > 0 && (
          <div className="space-y-3">
            <h2 className="text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-2">
              <Tag className="h-4 w-4" />
              Tags
            </h2>
            <div className="flex flex-wrap gap-2">
              {offer.tags.map((tag) => (
                <span
                  key={tag}
                  className="px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-sm font-medium dark:bg-blue-900/30 dark:text-blue-400"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Dates */}
        <div className="grid grid-cols-2 gap-4 py-4 border-y border-gray-200 dark:border-gray-700">
          <div className="space-y-1">
            <p className="text-sm font-medium text-gray-600 dark:text-gray-400 flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Criada em
            </p>
            <p className="text-gray-900 dark:text-white">{formatDate(offer.createdAtUtc)}</p>
          </div>
          {offer.updateAtUtc && (
            <div className="space-y-1">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400 flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Atualizada em
              </p>
              <p className="text-gray-900 dark:text-white">{formatDate(offer.updateAtUtc)}</p>
            </div>
          )}
        </div>

        {/* Forms Section */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              Formulário {forms.length > 0 && `(${forms.length} versões)`}
            </h2>
            <div className="flex gap-2">
              {forms.some(f => f.isPublished) && (
                <button
                  onClick={() => {
                    const publishedForm = forms.find(f => f.isPublished);
                    if (!publishedForm) return;
                    const nextVersion = forms.length > 0 ? Math.max(...forms.map(f => f.version)) + 1 : 1;
                    setPrefillFields(parseFieldsFromJson(publishedForm.jsonSchema, publishedForm.uiSchema));
                    setPrefillVersion(nextVersion);
                    setShowCreateBlank(true);
                  }}
                  className="flex items-center gap-2 px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition"
                >
                  <Edit2 className="w-4 h-4" />
                  Nova Versão com Base na Publicada
                </button>
              )}
              <button
                onClick={() => {
                  setPrefillFields(null);
                  setPrefillVersion(null);
                  setShowCreateBlank(true);
                }}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
              >
                <Plus className="w-4 h-4" />
                Nova Versão em Branco
              </button>
            </div>
          </div>

          {formsLoading ? (
            <div className="grid gap-4">
              {Array.from({ length: 2 }).map((_, i) => (
                <div
                  key={i}
                  className="p-4 rounded-lg border border-gray-200 bg-gray-50 animate-pulse dark:border-gray-700 dark:bg-gray-800"
                >
                  <div className="h-4 w-32 bg-gray-200 rounded dark:bg-gray-700" />
                </div>
              ))}
            </div>
          ) : forms.length === 0 ? (
            <p className="text-gray-600 dark:text-gray-400">
              Nenhum formulário criado. Clique em "Nova Versão em Branco" para começar.
            </p>
          ) : (
            <div className="grid gap-3">
              {forms
                .sort((a, b) => b.version - a.version)
                .map((form) => {
                  const isActive = form.isPublished;
                  const isDraft = !form.isPublished;
                  return (
                    <div
                      key={form.id}
                      className={`p-4 rounded-lg border transition ${
                        isActive
                          ? 'border-green-500 bg-green-50 dark:bg-green-900/20'
                          : 'border-amber-500 bg-amber-50 dark:bg-amber-900/20'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3">
                            <h3 className="font-semibold text-gray-900 dark:text-white">
                              Versão {form.version}
                            </h3>
                            {isActive && (
                              <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded dark:bg-green-900 dark:text-green-200">
                                Ativa
                              </span>
                            )}
                            {isDraft && (
                              <span className="px-2 py-1 text-xs font-medium bg-amber-100 text-amber-800 rounded dark:bg-amber-900 dark:text-amber-200">
                                Rascunho
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                            Criado em {formatDate(form.createdAtUtc)}
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => setEditingForm(form)}
                            className="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded transition"
                            title="Editar versão"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => deleteFormMutation.mutate(form.id)}
                            className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 rounded transition"
                            title="Deletar versão"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
            </div>
          )}
        </div>

        {/* CTA */}
        <div className="pt-4 flex gap-3">
          <button
            onClick={() => navigate('/offers')}
            className="px-6 py-3 rounded-lg border border-gray-200 text-gray-700 font-medium hover:bg-gray-50 transition dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-800"
          >
            Voltar
          </button>
          <button className="px-6 py-3 rounded-lg bg-blue-600 text-white font-medium hover:bg-blue-700 transition dark:bg-blue-700 dark:hover:bg-blue-600">
            Iniciar Formulário
          </button>
        </div>
      </div>

      {/* Modal para criar nova versão em branco */}
      {showCreateBlank && (
        <CreateFormModal
          offerId={offerId!}
          onClose={() => {
            setShowCreateBlank(false);
            setPrefillFields(null);
            setPrefillVersion(null);
          }}
          onSubmit={(data) => createFormMutation.mutate(data)}
          isLoading={createFormMutation.isPending}
          existingForms={forms}
          initialFields={prefillFields}
          presetVersion={prefillVersion}
        />
      )}

      {/* Modal para editar */}
      {editingForm && (
        <EditFormModal
          form={editingForm}
          onClose={() => setEditingForm(null)}
          onSubmit={(data) => updateFormMutation.mutate({ id: editingForm.id, data })}
          onPublish={(id, data) => publishFormMutation.mutate({ id, data })}
          isUpdating={updateFormMutation.isPending}
          isPublishing={publishFormMutation.isPending}
        />
      )}
    </div>
  );
}

interface CreateFormModalProps {
  offerId: string;
  onClose: () => void;
  onSubmit: (data: FormDefinitionInput) => void;
  isLoading: boolean;
  existingForms: any[];
  initialFields?: FormField[] | null;
  presetVersion?: number | null;
}

function CreateFormModal({ offerId, onClose, onSubmit, isLoading, existingForms, initialFields = null, presetVersion = null }: CreateFormModalProps) {
  const [fields, setFields] = useState<FormField[]>(initialFields || []);
  const [tab, setTab] = useState<'builder' | 'preview' | 'json'>('builder');
  const nextVersion = presetVersion ?? (existingForms.length > 0 ? Math.max(...existingForms.map(f => f.version)) + 1 : 1);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (fields.length === 0) {
      toast.error('Adicione pelo menos um campo');
      return;
    }

    const jsonSchema = generateJsonSchema(fields);
    const uiSchema = generateUiSchema(fields);

    onSubmit({
      offerId,
      version: nextVersion,
      jsonSchema,
      uiSchema,
      rules: '',
      isPublished: false, // Nova versão sempre começa como rascunho
    });
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">
            Nova Versão (v{nextVersion}) - Rascunho
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 text-2xl"
          >
            ×
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-200 dark:border-gray-700">
          <button
            onClick={() => setTab('builder')}
            className={`flex-1 px-4 py-3 font-medium transition ${
              tab === 'builder'
                ? 'text-blue-600 border-b-2 border-blue-600 dark:text-blue-400'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100'
            }`}
          >
            Construtor
          </button>
          <button
            onClick={() => setTab('preview')}
            className={`flex-1 px-4 py-3 font-medium transition ${
              tab === 'preview'
                ? 'text-blue-600 border-b-2 border-blue-600 dark:text-blue-400'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100'
            }`}
          >
            Pré-visualização
          </button>
          <button
            onClick={() => setTab('json')}
            className={`flex-1 px-4 py-3 font-medium transition ${
              tab === 'json'
                ? 'text-blue-600 border-b-2 border-blue-600 dark:text-blue-400'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100'
            }`}
          >
            JSON
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          {/* Tab Content */}
          {tab === 'builder' && (
            <div className="space-y-4">
              <FormBuilder fields={fields} onFieldsChange={setFields} />
            </div>
          )}

          {tab === 'preview' && (
            <div className="max-w-md">
              <h3 className="font-semibold mb-4 text-gray-900 dark:text-white">
                Como o usuário verá:
              </h3>
              <FormRenderer fields={fields} readOnly={false} />
            </div>
          )}

          {tab === 'json' && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  JSON Schema
                </label>
                <pre className="p-4 bg-gray-100 dark:bg-gray-700 rounded-lg overflow-auto max-h-64 text-xs">
                  {generateJsonSchema(fields)}
                </pre>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  UI Schema
                </label>
                <pre className="p-4 bg-gray-100 dark:bg-gray-700 rounded-lg overflow-auto max-h-64 text-xs">
                  {generateUiSchema(fields)}
                </pre>
              </div>
            </div>
          )}

          {/* Buttons */}
          <div className="flex gap-2 pt-6 border-t border-gray-200 dark:border-gray-700 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isLoading || fields.length === 0}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition"
            >
              {isLoading ? 'Criando versão...' : `Criar Versão ${nextVersion} (${fields.length} campos)`}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

interface EditFormModalProps {
  form: any;
  onClose: () => void;
  onSubmit: (data: any) => void;
  onPublish: (id: string, data?: any) => void;
  isUpdating: boolean;
  isPublishing: boolean;
}

function EditFormModal({ form, onClose, onSubmit, onPublish, isUpdating, isPublishing }: EditFormModalProps) {
  const [fields, setFields] = useState<FormField[]>(parseFieldsFromJson(form.jsonSchema, form.uiSchema));
  const [tab, setTab] = useState<'builder' | 'preview' | 'json'>('builder');
  const [hasChanges, setHasChanges] = useState(false);

  const isDraft = !form.isPublished;

  const handleFieldsChange = (newFields: FormField[]) => {
    setFields(newFields);
    setHasChanges(true);
  };

  const buildPayload = (isPublished: boolean) => {
    const jsonSchema = generateJsonSchema(fields);
    const uiSchema = generateUiSchema(fields);

    return {
      id: form.id,
      offerId: form.offerId,
      version: form.version,
      jsonSchema,
      uiSchema,
      rules: form.rules || '',
      isPublished,
    };
  };

  const handleSubmitChanges = (e: React.FormEvent) => {
    e.preventDefault();

    if (fields.length === 0) {
      toast.error('Adicione pelo menos um campo');
      return;
    }

    if (!hasChanges) {
      toast.error('Nenhuma alteração para salvar');
      return;
    }

    const payload = buildPayload(form.isPublished);
    onSubmit(payload);
  };

  const handleSaveDraft = () => {
    if (fields.length === 0) {
      toast.error('Adicione pelo menos um campo');
      return;
    }
    if (!hasChanges) {
      toast.error('Nenhuma alteração para salvar');
      return;
    }

    const payload = buildPayload(false);
    onSubmit(payload);
  };

  const handlePublish = () => {
    if (fields.length === 0) {
      toast.error('Adicione pelo menos um campo antes de publicar');
      return;
    }

    const payload = buildPayload(true);
    onPublish(form.id, payload);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
              Editar Versão {form.version}
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              {form.isPublished && (
                <span className="inline-flex items-center gap-2">
                  <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                  Versão Ativa
                </span>
              )}
              {!form.isPublished && (
                <span className="inline-flex items-center gap-2">
                  <span className="w-2 h-2 bg-amber-500 rounded-full"></span>
                  Rascunho
                </span>
              )}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 text-2xl"
          >
            ×
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-200 dark:border-gray-700">
          <button
            onClick={() => setTab('builder')}
            className={`flex-1 px-4 py-3 font-medium transition ${
              tab === 'builder'
                ? 'text-blue-600 border-b-2 border-blue-600 dark:text-blue-400'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100'
            }`}
          >
            Construtor
          </button>
          <button
            onClick={() => setTab('preview')}
            className={`flex-1 px-4 py-3 font-medium transition ${
              tab === 'preview'
                ? 'text-blue-600 border-b-2 border-blue-600 dark:text-blue-400'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100'
            }`}
          >
            Pré-visualização
          </button>
          <button
            onClick={() => setTab('json')}
            className={`flex-1 px-4 py-3 font-medium transition ${
              tab === 'json'
                ? 'text-blue-600 border-b-2 border-blue-600 dark:text-blue-400'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100'
            }`}
          >
            JSON
          </button>
        </div>

        <form onSubmit={handleSubmitChanges} className="p-6">
          {/* Tab Content */}
          {tab === 'builder' && (
            <div className="space-y-4">
              <FormBuilder fields={fields} onFieldsChange={handleFieldsChange} />
            </div>
          )}

          {tab === 'preview' && (
            <div className="max-w-md">
              <h3 className="font-semibold mb-4 text-gray-900 dark:text-white">
                Como o usuário verá:
              </h3>
              <FormRenderer fields={fields} readOnly={false} />
            </div>
          )}

          {tab === 'json' && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  JSON Schema
                </label>
                <pre className="p-4 bg-gray-100 dark:bg-gray-700 rounded-lg overflow-auto max-h-64 text-xs">
                  {generateJsonSchema(fields)}
                </pre>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  UI Schema
                </label>
                <pre className="p-4 bg-gray-100 dark:bg-gray-700 rounded-lg overflow-auto max-h-64 text-xs">
                  {generateUiSchema(fields)}
                </pre>
              </div>
            </div>
          )}

          {/* Buttons */}
          <div className="flex gap-2 pt-6 border-t border-gray-200 dark:border-gray-700 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition"
            >
              Cancelar
            </button>
            {isDraft && (
              <button
                type="button"
                onClick={handleSaveDraft}
                disabled={isUpdating || fields.length === 0 || !hasChanges}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition"
              >
                {isUpdating ? 'Salvando...' : 'Salvar rascunho'}
              </button>
            )}

            {isDraft && (
              <button
                type="button"
                onClick={handlePublish}
                disabled={isPublishing || isUpdating || fields.length === 0}
                className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 transition"
              >
                {isPublishing || isUpdating ? 'Publicando...' : 'Publicar'}
              </button>
            )}

            {!isDraft && (
              <button
                type="submit"
                disabled={isUpdating || fields.length === 0 || !hasChanges}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition"
              >
                {isUpdating ? 'Salvando...' : 'Salvar alterações'}
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
