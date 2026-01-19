import { useMemo, useState } from 'react';
import type { Offer, OfferInput } from '../types';

function slugify(value: string) {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '');
}

export type OfferFormProps = {
  initial?: Partial<Offer>;
  submitLabel?: string;
  onSubmit: (data: OfferInput) => Promise<void> | void;
  onCancel?: () => void;
};

export function OfferForm({ initial, submitLabel = 'Salvar', onSubmit, onCancel }: OfferFormProps) {
  const [name, setName] = useState(initial?.name ?? '');
  const [slug, setSlug] = useState(initial?.slug ?? '');
  const [description, setDescription] = useState(initial?.description ?? '');
  const [imageUrl, setImageUrl] = useState(initial?.imageUrl ?? '');
  const [tagsInput, setTagsInput] = useState((initial?.tags ?? []).join(', '));
  const [active, setActive] = useState(initial?.active ?? true);
  const [slugTouched, setSlugTouched] = useState(false);

  const tags = useMemo(
    () => tagsInput.split(',').map((t) => t.trim()).filter(Boolean),
    [tagsInput]
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload: OfferInput = {
      name: name.trim(),
      slug: slug.trim(),
      description: description.trim() || undefined,
      imageUrl: imageUrl.trim() || undefined,
      tags,
      active,
    };
    await onSubmit(payload);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Nome</label>
          <input
            value={name}
            onChange={(e) => {
              const val = e.target.value;
              setName(val);
              if (!slugTouched) setSlug(slugify(val));
            }}
            required
            className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 dark:border-gray-600 dark:bg-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Minha oferta"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Slug</label>
          <input
            value={slug}
            onChange={(e) => { setSlug(e.target.value); setSlugTouched(true); }}
            required
            className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 dark:border-gray-600 dark:bg-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="minha-oferta"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Descrição</label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={4}
          className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 dark:border-gray-600 dark:bg-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Descreva sua oferta"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">URL da imagem (opcional)</label>
          <input
            value={imageUrl}
            onChange={(e) => setImageUrl(e.target.value)}
            className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 dark:border-gray-600 dark:bg-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="https://..."
          />
          {imageUrl && (
            <img src={imageUrl} alt="Pré-visualização" className="mt-3 h-32 rounded-lg object-cover border border-gray-200 dark:border-gray-700" />
          )}
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Tags (separadas por vírgula)</label>
          <input
            value={tagsInput}
            onChange={(e) => setTagsInput(e.target.value)}
            className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 dark:border-gray-600 dark:bg-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="ex: vendas, premium"
          />
          {tags.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-2">
              {tags.map((t) => (
                <span key={t} className="px-2.5 py-1 rounded-full text-xs bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">{t}</span>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="flex items-center gap-3">
        <input id="active" type="checkbox" checked={active} onChange={(e) => setActive(e.target.checked)} className="h-4 w-4" />
        <label htmlFor="active" className="text-sm text-gray-700 dark:text-gray-300">Ativa</label>
      </div>

      <div className="flex gap-3">
        <button type="button" onClick={onCancel} className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-800">Cancelar</button>
        <button type="submit" className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700">{submitLabel}</button>
      </div>
    </form>
  );
}
