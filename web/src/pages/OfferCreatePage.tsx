import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { toast } from 'react-hot-toast';
import { offerService } from '../api/services';
import { OfferForm } from '../components/OfferForm';
import type { OfferInput } from '../types';

export function OfferCreatePage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const mutation = useMutation({
    mutationFn: (data: OfferInput) => offerService.create(data).then((r) => r.data),
    onSuccess: (created) => {
      queryClient.invalidateQueries({ queryKey: ['offers'] });
      toast.success('Oferta criada com sucesso');
      navigate(`/offers/${created.id}`);
    },
    onError: (err: any) => {
      const raw = err?.response?.data;
      const apiMessage = typeof raw === 'string' ? raw : raw?.message;
      setErrorMsg(apiMessage ?? 'Erro ao criar oferta. Verifique os dados.');
      toast.error(apiMessage ?? 'Erro ao criar oferta.');
    },
  });

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Nova Oferta</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">Preencha os dados e salve para criar.</p>
        </div>
      </div>

      <div className="rounded-xl border border-gray-200 p-4 dark:border-gray-700">
        <OfferForm
          submitLabel={mutation.isPending ? 'Salvando...' : 'Criar oferta'}
          onCancel={() => navigate('/offers')}
          onSubmit={(data) => {
            setErrorMsg(null);
            mutation.mutate(data);
          }}
        />
        {errorMsg && (
          <p className="mt-3 text-sm text-red-600 dark:text-red-400">{errorMsg}</p>
        )}
      </div>
    </div>
  );
}
