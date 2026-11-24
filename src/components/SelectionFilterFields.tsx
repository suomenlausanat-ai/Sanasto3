import { useState, type ReactNode } from 'react';
import { ChevronDown } from 'lucide-react';
import LearningBattery from '@/components/LearningBattery';
import { getCategoryOptions } from '@/lib/learningProgress';
import { LEARNING_STATUS_OPTIONS, type Category, type LearningStatus, type Word } from '@/lib/vocabulary';
import type { WordSelectionFilters } from '@/lib/wordFilters';

export interface SelectionToggle {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}

interface SelectionFilterFieldsProps {
  categoryLabel: string;
  categories: Category[];
  words: Word[];
  filters: WordSelectionFilters;
  onChange: (patch: Partial<WordSelectionFilters>) => void;
  toggles: SelectionToggle[];
  hideCategoryFilter?: boolean;
}

function FilterAccordion({
  title,
  open,
  onToggle,
  children,
}: {
  title: string;
  open: boolean;
  onToggle: () => void;
  children: ReactNode;
}) {
  return (
    <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
      <button
        type="button"
        aria-expanded={open}
        onClick={onToggle}
        className="flex w-full items-center justify-between gap-3 bg-sky-100/70 px-4 py-4 text-left text-sm font-bold text-slate-900 transition hover:bg-sky-100"
      >
        <span>{title}</span>
        <ChevronDown className={`h-5 w-5 shrink-0 transition ${open ? 'rotate-180' : ''}`} aria-hidden="true" />
      </button>
      {open && <div className="space-y-3 border-t border-slate-100 p-4">{children}</div>}
    </section>
  );
}

function SelectionButton({
  selected,
  label,
  description,
  onClick,
  children,
}: {
  selected: boolean;
  label: string;
  description?: string;
  onClick: () => void;
  children?: ReactNode;
}) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      onClick={onClick}
      className={`w-full rounded-xl border p-3 text-left transition ${
        selected
          ? 'border-blue-600 bg-blue-50 text-blue-950 shadow-sm'
          : 'border-slate-200 bg-white text-slate-900 hover:border-slate-300 hover:bg-slate-50'
      }`}
    >
      <span className="block font-semibold">{label}</span>
      {description && <span className="mt-1 block text-xs text-slate-600">{description}</span>}
      {children}
    </button>
  );
}

export default function SelectionFilterFields({
  categoryLabel,
  categories,
  words,
  filters,
  onChange,
  toggles,
  hideCategoryFilter = false,
}: SelectionFilterFieldsProps) {
  const [categoryOpen, setCategoryOpen] = useState(false);
  const [statusOpen, setStatusOpen] = useState(false);
  const categoryOptions = getCategoryOptions(categories, words);

  const toggleCategory = (value: string) => {
    const next = filters.categoryIds.includes(value)
      ? filters.categoryIds.filter((item) => item !== value)
      : [...filters.categoryIds, value];
    onChange({ categoryIds: next });
  };

  const toggleStatus = (value: LearningStatus) => {
    const next = filters.learningStatuses.includes(value)
      ? filters.learningStatuses.filter((item) => item !== value)
      : [...filters.learningStatuses, value];
    if (next.length > 0) onChange({ learningStatuses: next });
  };

  return (
    <div className="space-y-4">
      {toggles.length > 0 && (
        <div className="flex flex-wrap gap-x-5 gap-y-2">
          {toggles.map((toggle) => (
            <label key={toggle.label} className="inline-flex cursor-pointer items-center gap-2 text-sm font-semibold text-slate-700">
              <input
                type="checkbox"
                checked={toggle.checked}
                onChange={(event) => toggle.onChange(event.target.checked)}
                className="h-4 w-4 rounded border-slate-300 text-blue-700 focus:ring-blue-500"
              />
              {toggle.label}
            </label>
          ))}
        </div>
      )}

      <div className={`grid gap-3 ${hideCategoryFilter ? '' : 'lg:grid-cols-2'}`}>
        {!hideCategoryFilter && (
          <FilterAccordion title={categoryLabel} open={categoryOpen} onToggle={() => setCategoryOpen((open) => !open)}>
            <p className="text-sm font-semibold text-slate-700">Seçim</p>
            <SelectionButton
              selected={filters.categoryIds.length === 0}
              label="Tüm kelime listeleri"
              description="Her listedeki kelimeleri kullan"
              onClick={() => onChange({ categoryIds: [] })}
            />
            {categoryOptions.map((option) => (
              <SelectionButton
                key={option.value}
                selected={filters.categoryIds.includes(option.value)}
                label={option.label}
                onClick={() => toggleCategory(option.value)}
              >
                <span className="mt-2 block">
                  <LearningBattery progress={option.progress} />
                </span>
              </SelectionButton>
            ))}
          </FilterAccordion>
        )}

        <FilterAccordion title="Öğrenme durumu" open={statusOpen} onToggle={() => setStatusOpen((open) => !open)}>
          {LEARNING_STATUS_OPTIONS.map((option) => (
            <SelectionButton
              key={option.value}
              selected={filters.learningStatuses.includes(option.value)}
              label={option.label}
              onClick={() => toggleStatus(option.value)}
            />
          ))}
        </FilterAccordion>
      </div>

    </div>
  );
}
