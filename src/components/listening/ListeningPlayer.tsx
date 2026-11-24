import { useCallback, useState } from 'react';
import { Play, Pause, RotateCcw, SkipBack, SkipForward, Eye, EyeOff } from 'lucide-react';
import WordImage from '@/components/WordImage';
import GameTopBar from '@/components/games/GameTopBar';
import { useListeningPlayer } from '@/hooks/useListeningPlayer';
import { useKeepAliveAudio } from '@/hooks/useKeepAliveAudio';
import { useMediaSession } from '@/hooks/useMediaSession';
import type { ListeningSettings } from '@/lib/listening';
import type { Word } from '@/lib/vocabulary';

interface ListeningPlayerProps {
  queue: Word[];
  settings: ListeningSettings;
  onBack: () => void;
  title: string;
  onFinish?: () => void;
}

export default function ListeningPlayer({ queue, settings, onBack, title, onFinish }: ListeningPlayerProps) {
  const finish = useCallback(() => onFinish?.(), [onFinish]);
  const { index, isPlaying, play, pause, togglePlaying, goTo, lastIndex } = useListeningPlayer(queue, settings, finish);
  const [showMeaning, setShowMeaning] = useState(true);
  const word = queue[index];
  const goPrevious = useCallback(() => goTo(index - 1), [goTo, index]);
  const goNext = useCallback(() => goTo(index + 1), [goTo, index]);
  useKeepAliveAudio(isPlaying);
  useMediaSession({
    title: word.finnish,
    artist: word.turkish,
    artworkUrl: word.image_url,
    isPlaying,
    onPlay: play,
    onPause: pause,
    onNext: goNext,
    onPrevious: goPrevious,
  });

  return (
    <div className="flex h-[100dvh] w-full flex-col overflow-hidden overscroll-none">
      <GameTopBar title={title} current={index + 1} total={queue.length} onExit={onBack} />
      <div className="mx-auto min-h-0 w-full max-w-2xl flex-1 overflow-hidden py-3 sm:py-5">
      <div className="flex h-full flex-col justify-center gap-4">
      <article className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-lg shadow-slate-200/60">
        <WordImage src={word.image_url} alt={word.finnish} fit="cover" className="aspect-square w-full" />
        <div className="space-y-1 p-4 text-center sm:p-5">
          <h2 className="text-2xl font-bold text-slate-900 sm:text-3xl">{word.finnish}</h2>
          <div className="min-h-[2rem]">
            {showMeaning ? (
              <p className="text-lg text-slate-700">{word.turkish}</p>
            ) : (
              <p className="text-lg text-slate-400">Anlam gizli</p>
            )}
          </div>
          <button
            type="button"
            onClick={() => setShowMeaning((value) => !value)}
            className="inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold text-blue-700 transition hover:bg-blue-50"
          >
            {showMeaning ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            {showMeaning ? 'Anlamı gizle' : 'Anlamı göster'}
          </button>
        </div>
      </article>

      <div className="flex items-center justify-center gap-4">
        <button
          type="button"
          onClick={() => goTo(index - 1)}
          disabled={index === 0}
          aria-label="Önceki kelime"
          className="inline-flex h-12 w-12 items-center justify-center rounded-full border border-slate-300 bg-white text-slate-700 transition hover:bg-slate-50 disabled:opacity-40"
        >
          <SkipBack className="h-5 w-5" />
        </button>
        <button
          type="button"
          onClick={togglePlaying}
          aria-label={isPlaying ? 'Duraklat' : 'Oynat'}
          className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-blue-700 text-white shadow-lg shadow-blue-200 transition hover:bg-blue-800"
        >
          {isPlaying ? <Pause className="h-7 w-7" /> : <Play className="ml-1 h-7 w-7" />}
        </button>
        <button
          type="button"
          onClick={() => goTo(index + 1)}
          disabled={index >= lastIndex}
          aria-label="Sonraki kelime"
          className="inline-flex h-12 w-12 items-center justify-center rounded-full border border-slate-300 bg-white text-slate-700 transition hover:bg-slate-50 disabled:opacity-40"
        >
          <SkipForward className="h-5 w-5" />
        </button>
      </div>

      <div className="flex justify-center">
        <button
          type="button"
          onClick={() => goTo(0)}
          className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 transition hover:text-slate-900"
        >
          <RotateCcw className="h-4 w-4" /> Listenin başına dön
        </button>
      </div>

      </div>
      </div>
    </div>
  );
}
