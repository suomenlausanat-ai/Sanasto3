import { X } from 'lucide-react';

interface GameTopBarProps {
  title: string;
  current: number;
  total: number;
  onExit: () => void;
}

export default function GameTopBar({ title, current, total, onExit }: GameTopBarProps) {
  return (
    <header className="flex h-12 w-full shrink-0 items-center justify-between gap-3 border-b border-slate-200 bg-white/95 px-3 backdrop-blur sm:h-14 sm:px-4">
      <button
        type="button"
        onClick={onExit}
        aria-label="Oyundan çık"
        className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-slate-600 transition hover:bg-slate-100 hover:text-slate-900"
      >
        <X className="h-5 w-5" aria-hidden="true" />
      </button>
      <p className="min-w-0 truncate text-center text-sm font-bold text-slate-900 sm:text-base">{title}</p>
      <p className="shrink-0 text-sm font-semibold text-slate-600">{current} / {total}</p>
    </header>
  );
}
