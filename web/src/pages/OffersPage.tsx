import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { Search, X } from 'lucide-react';
import { offerService } from '../api/services';

const avatarColors = [
  'from-blue-500 to-indigo-500',
  'from-emerald-500 to-teal-500',
  'from-amber-500 to-orange-500',
  'from-rose-500 to-pink-500',
  'from-sky-500 to-cyan-500',
];

function getAvatarGradient(seed: string) {
  const hash = seed.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return avatarColors[hash % avatarColors.length];
}

function formatDate(dateIso?: string) {
  if (!dateIso) return '—';
  return new Date(dateIso).toLocaleDateString('pt-BR');
}

function shortText(text?: string, max = 140) {
  if (!text) return 'Sem descrição informada.';
  return text.length > max ? `${text.slice(0, max)}...` : text;
}

function LoadingGrid() {
  return (
    <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
      {Array.from({ length: 6 }).map((_, idx) => (
        <div
          key={idx}
          className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm animate-pulse dark:border-gray-700 dark:bg-gray-800"
        >
          <div className="h-40 bg-gray-200 dark:bg-gray-700" />
          <div className="p-4 space-y-3">
            <div className="h-4 w-32 bg-gray-200 rounded dark:bg-gray-700" />
            <div className="h-3 w-24 bg-gray-200 rounded dark:bg-gray-700" />
            <div className="h-3 w-full bg-gray-200 rounded dark:bg-gray-700" />
            <div className="h-3 w-2/3 bg-gray-200 rounded dark:bg-gray-700" />
            <div className="flex gap-2 pt-1">
              <div className="h-6 w-14 bg-gray-200 rounded-full dark:bg-gray-700" />
              <div className="h-6 w-16 bg-gray-200 rounded-full dark:bg-gray-700" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export function OffersPage() {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 9;

  const { data: offers = [], isLoading, error, refetch, isRefetching } = useQuery({
    queryKey: ['offers'],
    queryFn: async () => {
      const response = await offerService.getAll();
      return response.data;
    },
  });

  const allTags = useMemo(
    () => Array.from(new Set(offers.flatMap((o) => o.tags))),
    [offers]
  );

  const filtered = useMemo(() => {
    return offers.filter((offer) => {
      const matchesSearch =
        offer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        offer.description?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesTags =
        selectedTags.length === 0 || selectedTags.some((tag) => offer.tags.includes(tag));
      return matchesSearch && matchesTags;
    });
  }, [offers, searchTerm, selectedTags]);

  const totalPages = Math.ceil(filtered.length / itemsPerPage);
  const paginatedOffers = filtered.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handleTagToggle = (tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
    setCurrentPage(1);
  };

  if (isLoading) {
    return (
      <div className="p-6 space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <div className="h-6 w-32 rounded bg-gray-200 animate-pulse dark:bg-gray-700" />
            <div className="mt-2 h-4 w-40 rounded bg-gray-200 animate-pulse dark:bg-gray-700" />
          </div>
          <div className="h-10 w-24 rounded-lg bg-gray-200 animate-pulse dark:bg-gray-700" />
        </div>
        <LoadingGrid />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 text-center space-y-3">
        <div className="text-red-600 font-semibold dark:text-red-400">Erro ao carregar offers</div>
        <button
          onClick={() => refetch()}
          className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-600 transition"
        >
          Tentar novamente
        </button>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Offers</h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm">Catálogo de ofertas disponíveis</p>
        </div>
        <div className="flex items-center gap-3">
          {isRefetching && <span className="text-sm text-gray-400">Atualizando...</span>}
          <button
            onClick={() => refetch()}
            className="px-3 py-2 rounded-lg border border-gray-200 text-sm font-medium text-gray-700 hover:border-gray-300 hover:bg-gray-50 transition dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
          >
            Atualizar
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 pointer-events-none" />
        <input
          type="text"
          placeholder="Buscar por nome ou descrição..."
          value={searchTerm}
          onChange={(e) => {
            setSearchTerm(e.target.value);
            setCurrentPage(1);
          }}
          className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-200 focus:outline-none focus:border-blue-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white dark:focus:border-blue-400 transition"
        />
      </div>

      {/* Tags Filter */}
      {allTags.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Filtrar por tags:</p>
          <div className="flex flex-wrap gap-2">
            {allTags.map((tag) => (
              <button
                key={tag}
                onClick={() => handleTagToggle(tag)}
                className={`px-3 py-1 rounded-full text-xs font-medium transition ${
                  selectedTags.includes(tag)
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
                }`}
              >
                {tag}
                {selectedTags.includes(tag) && <span className="ml-1">✓</span>}
              </button>
            ))}
            {selectedTags.length > 0 && (
              <button
                onClick={() => {
                  setSelectedTags([]);
                  setCurrentPage(1);
                }}
                className="px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1 bg-gray-200 text-gray-700 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600 transition"
              >
                <X className="h-3 w-3" />
                Limpar
              </button>
            )}
          </div>
        </div>
      )}

      {/* Results count */}
      <div className="text-sm text-gray-600 dark:text-gray-400">
        {filtered.length} resultado{filtered.length !== 1 ? 's' : ''} encontrado
        {searchTerm || selectedTags.length > 0 ? 's' : ''}
      </div>

      {/* Cards Grid */}
      {paginatedOffers.length === 0 ? (
        <p className="text-gray-500 dark:text-gray-400">Nenhuma offer encontrada</p>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {paginatedOffers.map((offer) => {
            const gradient = getAvatarGradient(offer.id);
            const initials = offer.name?.slice(0, 2)?.toUpperCase() || 'OF';
            return (
              <article
                key={offer.id}
                onClick={() => navigate(`/offers/${offer.id}`)}
                className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm hover:shadow-lg hover:cursor-pointer transition dark:border-gray-700 dark:bg-gray-800"
              >
                <div className="relative aspect-[16/9] bg-gradient-to-br from-slate-100 to-slate-200 dark:from-gray-700 dark:to-gray-800">
                  {offer.imageUrl ? (
                    <img
                      src={offer.imageUrl}
                      alt={offer.name}
                      className="h-full w-full object-cover"
                      loading="lazy"
                    />
                  ) : (
                    <div
                      className={`h-full w-full bg-gradient-to-br ${gradient} flex items-center justify-center text-white text-2xl font-semibold`}
                    >
                      {initials}
                    </div>
                  )}
                  <span
                    className={`absolute right-3 top-3 rounded-full px-3 py-1 text-xs font-semibold shadow-sm ${
                      offer.active
                        ? 'bg-white/90 text-green-700 dark:bg-gray-900/90 dark:text-green-400'
                        : 'bg-white/90 text-gray-600 dark:bg-gray-900/90 dark:text-gray-400'
                    }`}
                  >
                    {offer.active ? 'Ativa' : 'Inativa'}
                  </span>
                </div>

                <div className="p-4 space-y-3">
                  <div className="space-y-1">
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                      {offer.name}
                    </h2>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Slug: {offer.slug}</p>
                  </div>

                  <p className="text-sm text-gray-700 leading-relaxed dark:text-gray-300">
                    {shortText(offer.description)}
                  </p>

                  {offer.tags.length > 0 && (
                    <div className="flex flex-wrap gap-2 pt-1">
                      {offer.tags.map((tag) => (
                        <span
                          key={tag}
                          className="px-2 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-medium dark:bg-blue-900/30 dark:text-blue-400"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}

                  <div className="flex items-center justify-between text-xs text-gray-500 pt-1 dark:text-gray-400">
                    <span>Criada em {formatDate(offer.createdAtUtc)}</span>
                    {offer.updateAtUtc && <span>Atualizada {formatDate(offer.updateAtUtc)}</span>}
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center items-center gap-2 pt-4">
          <button
            onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
            disabled={currentPage === 1}
            className="px-3 py-2 rounded-lg border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700 transition"
          >
            Anterior
          </button>
          <div className="flex gap-1">
            {Array.from({ length: totalPages }).map((_, i) => (
              <button
                key={i + 1}
                onClick={() => setCurrentPage(i + 1)}
                className={`px-2 py-1 rounded text-sm font-medium transition ${
                  currentPage === i + 1
                    ? 'bg-blue-600 text-white'
                    : 'border border-gray-200 text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700'
                }`}
              >
                {i + 1}
              </button>
            ))}
          </div>
          <button
            onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
            disabled={currentPage === totalPages}
            className="px-3 py-2 rounded-lg border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700 transition"
          >
            Próxima
          </button>
        </div>
      )}
    </div>
  );
}
