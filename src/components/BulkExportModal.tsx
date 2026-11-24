import { useMemo, useState } from 'react';
import { ChevronDown, Download, Printer } from 'lucide-react';
import Modal from '@/components/Modal';
import {
  createWordFileBlob,
  downloadWordFile,
  DEFAULT_EXPORT_FIELDS,
  EXPORT_FIELDS,
  EXPORT_FORMATS,
  getExportTable,
  selectExportWords,
  sortExportWords,
  type ExportField,
  type ExportFormat,
  type ExportWordSort,
} from '@/lib/wordExport';
import { openPrintableWordList } from '@/lib/wordPrint';
import { FAVORITES_OPTION_ID } from '@/lib/wordFilters';
import { type Category, type Word } from '@/lib/vocabulary';

interface BulkExportModalProps {
  words: Word[];
  categories: Category[];
  onClose: () => void;
  initialCategoryIds?: string[];
}

const SORT_OPTIONS: { value: ExportWordSort; label: string }[] = [
  { value: 'default', label: 'Varsayılan (Manuel Sıralama)' },
  { value: 'asc', label: "A'dan Z'ye (A-Z)" },
  { value: 'desc', label: "Z'den A'ya (Z-A)" },
];

function toggleItem<T>(list: T[], item: T): T[] {
  return list.includes(item) ? list.filter((value) => value !== item) : [...list, item];
}

function Accordion({
  title,
  open,
  onToggle,
  children,
}: {
  title: string;
  open: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200">
      <button
        type="button"
        aria-expanded={open}
        onClick={onToggle}
        className="flex w-full items-center justify-between bg-sky-100/70 px-4 py-3 text-left font-bold text-slate-900 transition hover:bg-sky-100"
      >
        <span>{title}</span>
        <ChevronDown className={`h-4 w-4 shrink-0 transition ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && <div className="border-t border-slate-100 bg-white p-4">{children}</div>}
    </div>
  );
}

function FilterChip({ active, label, onClick }: { active: boolean; label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`rounded-full px-3.5 py-1.5 text-sm font-semibold transition ${
        active ? 'bg-blue-700 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
      }`}
    >
      {label}
    </button>
  );
}

export default function BulkExportModal({ words, categories, onClose, initialCategoryIds = [] }: BulkExportModalProps) {
  const [categoryOpen, setCategoryOpen] = useState(false);
  const [formatOpen, setFormatOpen] = useState(false);
  const [fieldsOpen, setFieldsOpen] = useState(false);
  const [sort, setSort] = useState<ExportWordSort>('default');
  const [format, setFormat] = useState<ExportFormat>('pdf');
  const [fields, setFields] = useState<ExportField[]>(DEFAULT_EXPORT_FIELDS);
  const [categoryIds, setCategoryIds] = useState<string[]>(initialCategoryIds);
  const [isExporting, setIsExporting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [exportError, setExportError] = useState<string | null>(null);

  const visibleCategories = useMemo(() => {
    if (sort === 'default') return categories;
    const collator = new Intl.Collator('tr', { sensitivity: 'base' });
    return [...categories].sort((a, b) => sort === 'asc' ? collator.compare(a.name, b.name) : collator.compare(b.name, a.name));
  }, [categories, sort]);

  const selected = useMemo(
    () =>
      sortExportWords(
        selectExportWords(words, {
          categoryIds,
          learningStatuses: [],
          favoritesOnly: false,
          limit: null,
        }),
        sort,
      ),
    [words, categoryIds, sort],
  );

  const orderedFields = EXPORT_FIELDS.map((field) => field.value).filter((field) => fields.includes(field));
  const canExport = selected.length > 0 && orderedFields.length > 0 && !isExporting;

  const handleExport = async () => {
    if (!canExport) return;
    setMessage(null);
    setExportError(null);

    if (format === 'pdf') {
      const opened = openPrintableWordList(getExportTable(selected, orderedFields, categories));
      if (!opened) {
        setExportError('Yazdırma penceresi açılamadı. Tarayıcının açılır pencere engelini kaldırıp tekrar deneyin.');
      }
      return;
    }

    setIsExporting(true);
    try {
      const blob = await createWordFileBlob(selected, orderedFields, format, categories);
      downloadWordFile(blob, format);
      setMessage(`${selected.length} kelime dosyaya aktarıldı.`);
    } catch {
      setExportError('Dosya oluşturulurken bir sorun oluştu. Lütfen tekrar deneyin.');
    } finally {
      setIsExporting(false);
    }
  };

  const isPdf = format === 'pdf';

  return (
    <Modal title="Dışa aktar" onClose={onClose} maxWidthClass="max-w-3xl">
      <div className="space-y-6">
        <Accordion title="1. Kelime Listeleri" open={categoryOpen} onToggle={() => setCategoryOpen((open) => !open)}>
          <div className="space-y-4">
            <div className="space-y-2">
              <p className="text-sm font-semibold text-slate-700">Sıralama</p>
              <div className="flex flex-col gap-2">
                {SORT_OPTIONS.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setSort(option.value)}
                    aria-pressed={sort === option.value}
                    className={`rounded-xl border-2 px-4 py-2.5 text-left text-sm font-semibold transition ${
                      sort === option.value
                        ? 'border-blue-600 bg-blue-50 text-blue-950'
                        : 'border-slate-200 text-slate-700 hover:border-slate-300'
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>
            {visibleCategories.length === 0 && (
              <p className="text-sm text-slate-500">Henüz kelime listesi yok; tüm kelimeler seçilir.</p>
            )}
            <div className="flex flex-col gap-2">
              <FilterChip
                label="Favoriler"
                active={categoryIds.includes(FAVORITES_OPTION_ID)}
                onClick={() => setCategoryIds((current) => toggleItem(current, FAVORITES_OPTION_ID))}
              />
              {visibleCategories.map((category) => (
                <FilterChip
                  key={category.id}
                  label={category.name}
                  active={categoryIds.includes(category.id)}
                  onClick={() => setCategoryIds((current) => toggleItem(current, category.id))}
                />
              ))}
            </div>
          </div>
        </Accordion>

        <Accordion title="2. Dosya Biçimi" open={formatOpen} onToggle={() => setFormatOpen((open) => !open)}>
          <div className="grid gap-3 sm:grid-cols-3">
            {EXPORT_FORMATS.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => setFormat(option.value)}
                aria-pressed={format === option.value}
                className={`rounded-xl border-2 px-4 py-3 text-left transition ${
                  format === option.value ? 'border-blue-600 bg-blue-50' : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                <span className="block font-bold text-slate-900">{option.label}</span>
                <span className="block text-xs leading-snug text-slate-600">{option.description}</span>
              </button>
            ))}
          </div>
        </Accordion>

        <Accordion title="3. Eklenecek Bilgiler" open={fieldsOpen} onToggle={() => setFieldsOpen((open) => !open)}>
          <div className="grid gap-2 sm:grid-cols-2">
            {EXPORT_FIELDS.map((field) => (
              <label key={field.value} className="flex items-center gap-3 rounded-xl px-2 py-2 text-sm text-slate-700 hover:bg-slate-50">
                <input
                  type="checkbox"
                  checked={fields.includes(field.value)}
                  onChange={() => setFields((current) => toggleItem(current, field.value))}
                  className="h-4 w-4 accent-blue-700"
                />
                {field.label}
              </label>
            ))}
          </div>
          <p className="mt-3 text-xs leading-relaxed text-slate-500">
            Ä, Ö ve Å gibi Fince harfler tüm biçimlerde korunur. CSV dosyasında sütunlar noktalı virgülle ayrılır.
          </p>
        </Accordion>

        <div className="flex flex-col gap-3 border-t border-slate-200 pt-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-1">
            <p className="text-sm font-semibold text-slate-800">{selected.length} kelime dışa aktarılacak</p>
            {message && <p className="text-sm font-medium text-emerald-700">{message}</p>}
            {exportError && <p className="text-sm font-medium text-rose-700">{exportError}</p>}
            {selected.length === 0 && (
              <p className="text-sm text-amber-700">Seçtiğiniz filtrelere uyan kelime yok.</p>
            )}
          </div>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-slate-300 px-5 py-3 font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              Kapat
            </button>
            <button
              type="button"
              onClick={handleExport}
              disabled={!canExport}
              className="inline-flex items-center gap-2 rounded-xl bg-blue-700 px-6 py-3 font-semibold text-white shadow-sm transition hover:bg-blue-800 disabled:opacity-50"
            >
              {isPdf ? <Printer className="h-4 w-4" aria-hidden="true" /> : <Download className="h-4 w-4" aria-hidden="true" />}
              {isExporting ? 'Hazırlanıyor...' : isPdf ? 'PDF olarak yazdır' : 'Dosyayı indir'}
            </button>
          </div>
        </div>
      </div>
    </Modal>
  );
}
