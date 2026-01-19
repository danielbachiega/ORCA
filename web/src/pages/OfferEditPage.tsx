import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate, useParams } from 'react-router-dom';
import { useState } from 'react';
import { toast } from 'react-hot-toast';
import { offerService } from '../api/services';
import { OfferForm } from '../components/OfferForm';
import type { OfferInput, OfferUpdate } from '../types';

export function OfferEditPage() {
  const navigate = useNavigate();
  const { offerId } = useParams<{ offerId: string }>();
  const queryClient = useQueryClient();
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const { data: offer, isLoading, error } = useQuery({
    queryKey: ['offer', offerId],
    queryFn: async () => (await offerService.getById(offerId!)).data,
    enabled: !!offerId,
  });

  const updateMutation = useMutation({
    mutationFn: async (data: OfferInput) => {
      const body: OfferUpdate = {
        ...data,
        id: offerId!,
        createdAtUtc: offer!.createdAtUtc,
        updateAtUtc: new Date().toISOString(),
      };
      const res = await offerService.update(offerId!, body);
      return res.data;
    },
    onSuccess: (updated) => {
      queryClient.invalidateQueries({ queryKey: ['offers'] });
      queryClient.invalidateQueries({ queryKey: ['offer', offerId] });
      toast.success('Oferta atualizada');
      navigate(`/offers/${updated.id}`);
    },
    onError: (err: any) => {
      const raw = err?.response?.data;
      const apiMessage = typeof raw === 'string' ? raw : raw?.message;
      setErrorMsg(apiMessage ?? 'Erro ao salvar alterações. Verifique os dados.');
      toast.error(apiMessage ?? 'Erro ao salvar alterações.');
    },
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

  if (isLoading) {
    return <div className="p-6 text-gray-600 dark:text-gray-400">Carregando...</div>;
  }
  if (error || !offer) {
    return <div className="p-6 text-red-600 dark:text-red-400">Oferta não encontrada.</div>;
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Editar Oferta</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">Atualize os dados e salve.</p>
        </div>
        <button
          onClick={() => {
            if (confirm('Excluir esta oferta?')) deleteMutation.mutate();
          }}
          className="px-4 py-2 rounded-lg border border-red-300 text-red-700 hover:bg-red-50 dark:border-red-600 dark:text-red-400 dark:hover:bg-red-900/20"
        >
          {deleteMutation.isPending ? 'Excluindo...' : 'Excluir'}
        </button>
      </div>

      <div className="rounded-xl border border-gray-200 p-4 dark:border-gray-700">
        <OfferForm
          initial={offer}
          submitLabel={updateMutation.isPending ? 'Salvando...' : 'Salvar alterações'}
          onCancel={() => navigate(`/offers/${offer.id}`)}
          onSubmit={(data) => {
            setErrorMsg(null);
            updateMutation.mutate(data);
          }}
        />
        {(errorMsg || deleteMutation.isError) && (
          <p className="mt-3 text-sm text-red-600 dark:text-red-400">{errorMsg ?? 'Erro ao salvar alterações.'}</p>
        )}
      </div>
    </div>
  );
}
