import { useQuery } from '@tanstack/react-query';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Calendar, Tag } from 'lucide-react';
import { offerService, formDefinitionService } from '../api/services';

function formatDate(dateIso?: string) {
  if (!dateIso) return '—';
  return new Date(dateIso).toLocaleDateString('pt-BR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

export function OfferDetailPage() {
  const navigate = useNavigate();
  const { offerId } = useParams<{ offerId: string }>();

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
            <span
              className={`px-4 py-2 rounded-full text-sm font-semibold whitespace-nowrap ${
                offer.active
                  ? 'bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                  : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'
              }`}
            >
              {offer.active ? 'Ativa' : 'Inativa'}
            </span>
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
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            Formulários ({forms.length})
          </h2>
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
            <p className="text-gray-600 dark:text-gray-400">Nenhum formulário associado a esta oferta.</p>
          ) : (
            <div className="grid gap-4">
              {forms.map((form) => (
                <div
                  key={form.id}
                  className="p-4 rounded-lg border border-gray-200 bg-gray-50 hover:bg-gray-100 transition dark:border-gray-700 dark:bg-gray-800 dark:hover:bg-gray-750"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold text-gray-900 dark:text-white">
                        Versão {form.version}
                      </h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                        Criado em {formatDate(form.createdAtUtc)}
                      </p>
                    </div>
                    <button className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-600 transition">
                      Abrir
                    </button>
                  </div>
                </div>
              ))}
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
    </div>
  );
}
