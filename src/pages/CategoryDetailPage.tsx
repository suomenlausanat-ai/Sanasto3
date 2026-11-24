import { useMemo, useRef, useState } from 'react';
import {
  ChevronDown,
  Download,
  FileUp,
  Search,
  SlidersHorizontal,
  X,
} from 'lucide-react';
import BulkExportModal from '@/components/BulkExportModal';
import StickyHeader from '@/components/StickyHeader';
import MissingImageNotice from '@/components/MissingImageNotice';
import SortDropdown from '@/components/SortDropdown';
import WordFilterBar from '@/components/WordFilterBar';
import WordImportModal from '@/components/WordImportModal';
import WordList from '@/components/WordList';
import { useDismissOnOutside } from '@/hooks/useDismissOnOutside';
import { useStoredState } from '@/hooks/useStoredState';
import { useLibrary } from '@/contexts/LibraryContext';
import { EMPTY_WORD_FILTERS, filterWords, type WordFilters } from '@/lib/wordFilters';
import { sortWordsByListMode, WORD_LIST_SORT_OPTIONS, type WordListSort } from '@/lib/wordSort';
import type { Category, Word } from '@/lib/vocabulary';
import { useAppHeader } from '@/contexts/AppHeaderContext';

const WORD_SORT_KEY = 'sanasto.wordListSort';

interface CategoryDetailPageProps {
  category: Category;
  overrideWords?: Word[];
  onBack: () => void;
}

export default function CategoryDetailPage({ category, overrideWords, onBack }: CategoryDetailPageProps) {
  const isUncategorized = category.id === '__uncategorized__';
  const { words: allWords, categories, isLoading } = useLibrary();
  const categoryWords = useMemo(
    () =>
      overrideWords ??
      allWords.filter((word) =>
        isUncategorized ? !word.category_id : word.category_id === category.id,
      ),
    [allWords, category.id, isUncategorized, overrideWords],
  );

  useAppHeader({ title: category.name, onBack });

  if (isLoading) return null;

  return (
    <div className="space-y-6">
      <CategoryWordsTab
        categoryId={category.id}
        isUncategorized={isUncategorized}
        categoryWords={categoryWords}
        allWords={allWords}
        categories={categories}
        showPageHeader={false}
      />
    </div>
  );
}

function CategoryWordsTab({
  categoryId,
  isUncategorized,
  categoryWords,
  allWords,
  categories,
  showPageHeader,
}: {
  categoryId: string;
  isUncategorized: boolean;
  categoryWords: Word[];
  allWords: Word[];
  categories: Category[];
  showPageHeader: boolean;
}) {
  const [filters, setFilters] = useState<WordFilters>(EMPTY_WORD_FILTERS);
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const filterContainerRef = useRef<HTMLDivElement>(null);
  useDismissOnOutside(filterContainerRef, showFilters, () => setShowFilters(false));
  const [sortSettings, setSortSettings] = useStoredState<{ mode: WordListSort }>(WORD_SORT_KEY, { mode: 'added' });
  const sortMode = sortSettings.mode;

  const scopedFilters = useMemo<WordFilters>(
    () => ({ ...filters, categoryIds: [categoryId] }),
    [filters, categoryId],
  );

  const visibleWords = useMemo(
    () => sortWordsByListMode(filterWords(categoryWords, scopedFilters), sortMode),
    [categoryWords, scopedFilters, sortMode],
  );

  const hasNonCategoryFilters =
    filters.search !== '' ||
    filters.statuses.length > 0 ||
    filters.favoritesOnly ||
    filters.noImage;

  return (
    <div className="space-y-4">
      {showPageHeader && <StickyHeader title="Kelime ekle ve düzenle" onBack={() => {}} />}
      <div className="grid w-full grid-cols-1 gap-2 sm:max-w-xs">
        <button
          type="button"
          onClick={() => setIsExporting(true)}
          className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-blue-200 bg-blue-50 px-3 py-2.5 text-sm font-semibold text-blue-800 shadow-sm transition hover:bg-blue-100"
        >
          <Download className="h-4 w-4 shrink-0" /> <span>Dışa aktar</span>
        </button>
        <button
          type="button"
          onClick={() => setIsImporting(true)}
          className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-blue-200 bg-blue-50 px-3 py-2.5 text-sm font-semibold text-blue-800 shadow-sm transition hover:bg-blue-100"
        >
          <FileUp className="h-4 w-4 shrink-0" /> <span>Yeni Kelime Ekle</span>
        </button>
      </div>

      <MissingImageNotice
        count={categoryWords.filter((word) => !word.image_url).length}
        onShow={() => setFilters({ ...EMPTY_WORD_FILTERS, noImage: true })}
      />

      <div className="relative">
        <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
        <input
          type="search"
          value={filters.search}
          onChange={(event) => setFilters((current) => ({ ...current, search: event.target.value }))}
          placeholder={`${categoryWords.length} kelime içinde ara...`}
          aria-label="Kelime listesindeki kelimelerde ara"
          className="w-full rounded-xl border border-slate-200 bg-white py-3 pl-12 pr-4 text-slate-900 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
        />
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div ref={filterContainerRef} className="w-full">
          <div className="grid w-full grid-cols-2 gap-2">
            <div className="relative min-w-0">
              <div className={`flex min-w-0 items-center rounded-xl border text-sm font-semibold transition ${
                hasNonCategoryFilters
                  ? 'border-teal-400 bg-teal-100 text-teal-900'
                  : 'border-teal-200 bg-teal-50 text-teal-800'
              }`}>
                <button
                  type="button"
                  aria-label="Filtrele"
                  aria-expanded={showFilters}
                  onClick={() => setShowFilters((open) => !open)}
                  className="flex min-w-0 flex-1 items-center justify-between gap-2 px-3 py-2.5 text-left outline-none focus:ring-4 focus:ring-blue-100"
                >
                  <span className="flex min-w-0 items-center gap-2 truncate">
                    <SlidersHorizontal className="h-4 w-4 shrink-0 text-slate-500" />
                    <span className="truncate">{hasNonCategoryFilters ? 'Filtrele (aktif)' : 'Filtrele'}</span>
                  </span>
                  <ChevronDown className={`h-4 w-4 shrink-0 text-slate-500 transition ${showFilters ? 'rotate-180' : ''}`} aria-hidden="true" />
                </button>
                {hasNonCategoryFilters && (
                  <button
                    type="button"
                    onClick={() => setFilters(EMPTY_WORD_FILTERS)}
                    className="shrink-0 px-2 text-xs font-semibold text-blue-700 transition hover:text-blue-900"
                  >
                    <X className="h-3.5 w-3.5" aria-label="Filtreleri temizle" />
                  </button>
                )}
              </div>
            </div>
            <div className="min-w-0">
              <SortDropdown
                label="Kelime sıralaması"
                options={WORD_LIST_SORT_OPTIONS}
                value={sortMode}
                buttonClassName="flex min-w-0 w-full items-center justify-between gap-2 rounded-xl border border-teal-200 bg-teal-50 px-3 py-2.5 text-left text-sm font-semibold text-teal-800 transition hover:border-teal-300 hover:bg-teal-100 focus:border-teal-400 focus:outline-none focus:ring-4 focus:ring-teal-100"
                onChange={(mode) => setSortSettings({ mode })}
              />
            </div>
          </div>
          {showFilters && (
            <div className="mt-2">
              <CategoryWordFilterBar filters={filters} onChange={setFilters} />
            </div>
          )}
        </div>
      </div>

      <WordList
        words={visibleWords}
        emptyTitle={hasNonCategoryFilters ? 'Bu filtrelere uyan kelime yok' : 'Bu kelime listesinde henüz kelime yok'}
        emptyText={
          hasNonCategoryFilters
            ? 'Filtreleri temizleyerek bütün kelimeleri tekrar görebilirsiniz.'
            : 'Yukarıdaki "Yeni Kelime Ekle" butonuyla ilk kelimenizi ekleyin.'
        }
      />

      {isExporting && (
        <BulkExportModal
          words={allWords}
          categories={categories}
          initialCategoryIds={isUncategorized ? [] : [categoryId]}
          onClose={() => setIsExporting(false)}
        />
      )}
      {isImporting && (
        <WordImportModal
          onClose={() => setIsImporting(false)}
          defaultCategoryId={isUncategorized ? null : categoryId}
        />
      )}
    </div>
  );
}

function CategoryWordFilterBar({ filters, onChange }: { filters: WordFilters; onChange: (filters: WordFilters) => void }) {
  return <WordFilterBar filters={filters} onChange={onChange} hideCategoryFilter hideSearch />;
}
