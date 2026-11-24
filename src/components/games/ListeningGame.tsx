import { useCallback, useMemo, useState } from 'react';
import ListeningPlayer from '@/components/listening/ListeningPlayer';
import GameEndActions from '@/components/games/GameEndActions';
import {
  DEFAULT_LISTENING_SETTINGS,
  selectListeningWordsFromConfig,
  type ListeningOrder,
  type ListeningSettings,
} from '@/lib/listening';
import { useStoredState } from '@/hooks/useStoredState';
import type { GameSetupConfig } from '@/lib/games/gameConfig';
import type { Word } from '@/lib/vocabulary';

interface ListeningGameProps {
  order: ListeningOrder;
  words: Word[];
  config: GameSetupConfig;
  title: string;
  onExit: () => void;
  onRestart: () => void;
  onNext?: () => void;
}

export default function ListeningGame({ order, words, config, title, onExit, onRestart, onNext }: ListeningGameProps) {
  const [isFinished, setIsFinished] = useState(false);
  const [globalSettings] = useStoredState<ListeningSettings>(
    'sanasto.listeningSettings',
    DEFAULT_LISTENING_SETTINGS,
  );

  const queue = useMemo(() => selectListeningWordsFromConfig(words, config), [words, config]);

  const finishGame = useCallback(() => setIsFinished(true), []);

  const lockedSettings = useMemo<ListeningSettings>(() => ({
    ...globalSettings,
    order,
  }), [globalSettings, order]);

  if (isFinished || queue.length === 0) {
    return (
      <div className="mx-auto flex min-h-[calc(100dvh-7rem)] max-w-2xl flex-col justify-center gap-6">
        <h1 className="text-center text-2xl font-bold text-slate-900">{title}</h1>
        <GameEndActions
          onRestart={onRestart}
          onNext={onNext}
          onExit={onExit}
        />
      </div>
    );
  }

  return (
    <div className="h-[100dvh] overflow-hidden">
      <ListeningPlayer
        queue={queue}
        settings={lockedSettings}
        title={title}
        onBack={onExit}
        onFinish={finishGame}
      />
    </div>
  );
}
