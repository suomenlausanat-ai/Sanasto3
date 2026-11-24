import { useState } from 'react';
import { ChevronDown, Check } from 'lucide-react';
import SelectionFilterFields from '@/components/SelectionFilterFields';
import { type GameSetupConfig } from '@/lib/games/gameConfig';
import type { Category, Word } from '@/lib/vocabulary';
import type { WordListSort } from '@/lib/wordSort';

type GameSort = WordListSort | 'random';

const GAME_SORT_OPTIONS: { value: GameSort; label: string }[] = [
  { value: 'added', label: 'Eklenme sırası' },
  { value: 'finnish', label: 'Fince A-Z' },
  { value: 'turkish', label: 'Türkçe A-Z' },
  { value: 'random', label: 'Karışık' },
];

interface GameFilterFieldsProps {
  config: GameSetupConfig;
  onChange: (config: GameSetupConfig) => void;
  categories: Category[];
  words: Word[];
  hideCategoryFilter?: boolean;
  showFavoritesToggle?: boolean;
}

export default function GameFilterFields({ config, onChange, categories, words, hideCategoryFilter = false, showFavoritesToggle = false }: GameFilterFieldsProps) {
  const update = (patch: Partial<GameSetupConfig>) => onChange({ ...config, ...patch });

  const sortValue: GameSort = config.order === 'alphabetical' ? config.alphabetLanguage : config.order;
  const applySort = (value: GameSort) => {
    if (value === 'finnish' || value === 'turkish') {
      update({ order: 'alphabetical', alphabetLanguage: value });
      return;
    }
    update({ order: value });
  };

  const toggles = showFavoritesToggle
    ? [{ label: 'Sadece favoriler', checked: config.favoritesOnly, onChange: (checked: boolean) => update({ favoritesOnly: checked }) }]
    : [];
  const [sortOpen, setSortOpen] = useState(false);

  return (
    <div className="space-y-4">
      <SelectionFilterFields
        categoryLabel="Kelime Listeleri"
        categories={categories}
        words={words}
        filters={config}
        onChange={update}
        hideCategoryFilter={hideCategoryFilter}
        toggles={toggles}
      />

      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
        <button
          type="button"
          aria-expanded={sortOpen}
          onClick={() => setSortOpen((open) => !open)}
          className="flex w-full items-center justify-between gap-3 bg-sky-100/70 px-4 py-4 text-left text-sm font-bold text-slate-900 transition hover:bg-sky-100"
        >
          <span>Kelime sıralaması</span>
          <ChevronDown className={`h-5 w-5 shrink-0 transition ${sortOpen ? 'rotate-180' : ''}`} aria-hidden="true" />
        </button>
        {sortOpen && (
          <div className="space-y-2 border-t border-slate-100 p-4">
            {GAME_SORT_OPTIONS.map((option) => {
              const active = sortValue === option.value;
              return (
                <button
                  key={option.value}
                  type="button"
                  aria-pressed={active}
                  onClick={() => applySort(option.value)}
                  className={`flex w-full items-center justify-between rounded-xl border px-3 py-3 text-left text-sm font-semibold transition ${
                    active ? 'border-blue-600 bg-blue-50 text-blue-950' : 'border-slate-200 bg-white text-slate-800 hover:border-slate-300'
                  }`}
                >
                  {option.label}
                  {active && <Check className="h-4 w-4 text-blue-700" aria-hidden="true" />}
                </button>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
