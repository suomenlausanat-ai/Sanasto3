import { useState, type FormEvent } from 'react';
import { Plus } from 'lucide-react';
import Modal from '@/components/Modal';
import { useLibrary } from '@/contexts/LibraryContext';
import { describeError } from '@/lib/errors';
import { IMPORT_TARGETS, countByStatus, type ColumnMapping, type ImportDefaults, type ImportPreviewRow, type ImportTarget, type ParsedTable } from '@/lib/wordImport';
import { type Category } from '@/lib/vocabulary';

interface ImportReviewPanelProps {
  table: ParsedTable;
  mapping: ColumnMapping;
  onMappingChange: (mapping: ColumnMapping) => void;
  defaults: ImportDefaults;
  onDefaultsChange: (defaults: ImportDefaults) => void;
  categories: Category[];
  rows: ImportPreviewRow[];
  onStart: () => void;
  onBack: () => void;
}

const PREVIEW_ROWS = 8;

const STATUS_STYLES = {
  ready: 'bg-emerald-50 text-emerald-700',
  duplicate: 'bg-amber-50 text-amber-800',
  invalid: 'bg-rose-50 text-rose-700',
} as const;

const STATUS_LABELS = {
  ready: 'Eklenecek',
  duplicate: 'Zaten var',
  invalid: 'Hatalı',
} as const;

const selectClass =
  'w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100';

export default function ImportReviewPanel({
  table,
  mapping,
  onMappingChange,
  defaults,
  onDefaultsChange,
  categories,
  rows,
  onStart,
  onBack,
}: ImportReviewPanelProps) {
  const { addCategory } = useLibrary();
  const [isCreatingCategory, setIsCreatingCategory] = useState(false);
  const [categoryName, setCategoryName] = useState('');
  const [categoryError, setCategoryError] = useState<string | null>(null);
  const [isSavingCategory, setIsSavingCategory] = useState(false);
  const counts = countByStatus(rows);
  const requiredMapped = mapping.finnish !== undefined && mapping.turkish !== undefined;
  const canStart = requiredMapped && counts.ready > 0;

  const handleCreateCategory = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmed = categoryName.trim();
    if (!trimmed) {
      setCategoryError('Lütfen bir kelime listesi adı girin.');
      return;
    }
    if (categories.some((category) => category.name.toLocaleLowerCase('tr-TR') === trimmed.toLocaleLowerCase('tr-TR'))) {
      setCategoryError('Bu isimde bir kelime listesi zaten var.');
      return;
    }
    setIsSavingCategory(true);
    setCategoryError(null);
    try {
      const created = await addCategory(trimmed);
      if (created) {
        onDefaultsChange({ ...defaults, categoryId: created.id });
        setCategoryName('');
        setIsCreatingCategory(false);
      }
    } catch (error) {
      setCategoryError(describeError(error));
    } finally {
      setIsSavingCategory(false);
    }
  };

  const setColumn = (target: ImportTarget, value: string) => {
    const next = { ...mapping };
    if (value === '') delete next[target];
    else next[target] = Number(value);
    onMappingChange(next);
  };

  return (
    <div className="space-y-6">
      <section className="space-y-3">
        <h3 className="text-xs font-bold uppercase tracking-wide text-slate-500">1. Sütunları eşleştirin</h3>
        <div className="grid gap-3 sm:grid-cols-2">
          {IMPORT_TARGETS.map((target) => (
            <label key={target.key} className="block space-y-1.5">
              <span className="text-sm font-semibold text-slate-700">
                {target.label}
                {target.required && <span className="text-rose-600"> *</span>}
              </span>
              <select
                className={selectClass}
                value={mapping[target.key] === undefined ? '' : String(mapping[target.key])}
                onChange={(event) => setColumn(target.key, event.target.value)}
              >
                <option value="">Bu bilgi yok</option>
                {table.headers.map((header, index) => (
                  <option key={index} value={index}>
                    {header.trim() || `Sütun ${index + 1}`}
                  </option>
                ))}
              </select>
            </label>
          ))}
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
            <label className="block space-y-1.5">
              <span className="text-sm font-semibold text-slate-700">Kelime listeleri <span className="text-rose-600">*</span></span>
              <select
                className={selectClass}
                value={defaults.categoryId ?? ''}
                onChange={(event) => onDefaultsChange({ ...defaults, categoryId: event.target.value || null })}
              >
                <option value="">Kelime listesi seçin</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
              <button
                type="button"
                onClick={() => { setCategoryError(null); setIsCreatingCategory(true); }}
                className="inline-flex items-center gap-1.5 text-sm font-semibold text-blue-700 transition hover:text-blue-900"
              >
                <Plus className="h-4 w-4" /> Yeni Liste Ekle
              </button>
            </label>
        </div>
      </section>

      <section className="space-y-3 border-t border-slate-200 pt-5">
        <h3 className="text-xs font-bold uppercase tracking-wide text-slate-500">2. Önizleme</h3>
        <div className="flex flex-wrap gap-3 text-sm font-semibold">
          <span className="rounded-full bg-emerald-50 px-3 py-1 text-emerald-700">{counts.ready} eklenecek</span>
          <span className="rounded-full bg-amber-50 px-3 py-1 text-amber-800">{counts.duplicate} zaten kayıtlı</span>
          <span className="rounded-full bg-rose-50 px-3 py-1 text-rose-700">{counts.invalid} hatalı</span>
        </div>
        <p className="text-xs text-slate-500">
          Zaten kayıtlı olan ve hatalı satırlar eklenmez. Dosyada tekrar eden kelimeler yalnızca bir kez eklenir.
        </p>
        <div className="overflow-x-auto rounded-xl border border-slate-200">
          <table className="w-full min-w-[520px] text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-3 py-2">Kayıt</th>
                <th className="px-3 py-2">Fince</th>
                <th className="px-3 py-2">Türkçe</th>
                <th className="px-3 py-2">Durum</th>
                <th className="px-3 py-2">Not</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {rows.slice(0, PREVIEW_ROWS).map((row) => (
                <tr key={row.recordNumber}>
                  <td className="px-3 py-2 text-slate-500">{row.recordNumber}</td>
                  <td className="px-3 py-2 font-semibold text-slate-900">{row.values?.finnish ?? '-'}</td>
                  <td className="px-3 py-2 text-slate-700">{row.values?.turkish ?? '-'}</td>
                  <td className="px-3 py-2">
                    <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${STATUS_STYLES[row.status]}`}>
                      {STATUS_LABELS[row.status]}
                    </span>
                  </td>
                  <td className="px-3 py-2 text-xs text-slate-600">{row.issues.join(', ')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {rows.length > PREVIEW_ROWS && (
          <p className="text-xs text-slate-500">İlk {PREVIEW_ROWS} kayıt gösteriliyor. Toplam {rows.length} kayıt var.</p>
        )}
      </section>

      <div className="flex flex-col-reverse gap-3 border-t border-slate-200 pt-5 sm:flex-row sm:justify-between">
        <button
          type="button"
          onClick={onBack}
          className="rounded-xl border border-slate-300 px-5 py-3 font-semibold text-slate-700 transition hover:bg-slate-50"
        >
          Geri dön
        </button>
        <button
          type="button"
          onClick={onStart}
          disabled={!canStart}
          className="rounded-xl bg-blue-700 px-6 py-3 font-semibold text-white shadow-sm transition hover:bg-blue-800 disabled:opacity-50"
        >
          {counts.ready} kelimeyi ekle
        </button>
      </div>
      {isCreatingCategory && (
        <Modal title="Yeni Liste Ekle" onClose={() => setIsCreatingCategory(false)}>
          <form onSubmit={handleCreateCategory} className="space-y-5">
            <div>
              <label htmlFor="import-new-category" className="mb-1.5 block text-sm font-semibold text-slate-700">
                Kelime listesi adı *
              </label>
              <input
                id="import-new-category"
                value={categoryName}
                onChange={(event) => setCategoryName(event.target.value)}
                maxLength={60}
                autoFocus
                className={selectClass}
                placeholder="Örn. Yiyecek ve içecek"
              />
            </div>
            {categoryError && <p className="rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-700">{categoryError}</p>}
            <div className="flex justify-end gap-3 border-t border-slate-200 pt-5">
              <button type="button" onClick={() => setIsCreatingCategory(false)} className="rounded-xl border border-slate-300 px-5 py-3 font-semibold text-slate-700">
                Vazgeç
              </button>
              <button type="submit" disabled={isSavingCategory} className="rounded-xl bg-blue-700 px-6 py-3 font-semibold text-white disabled:opacity-50">
                {isSavingCategory ? 'Oluşturuluyor...' : 'Oluştur'}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
