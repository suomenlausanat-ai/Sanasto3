import { useCallback, useMemo, useRef, useState } from 'react';
import { ChevronDown, SlidersHorizontal } from 'lucide-react';
import FlashcardGame from '@/components/games/FlashcardGame';
import GameFilterFields from '@/components/games/GameFilterFields';
import GameSession from '@/components/games/GameSession';
import ListeningGame from '@/components/games/ListeningGame';
import ListeningSettingsPanel from '@/components/listening/ListeningSettingsPanel';
import { useDismissOnOutside } from '@/hooks/useDismissOnOutside';
import { useGameSettings } from '@/hooks/useGameSettings';
import { useStoredState } from '@/hooks/useStoredState';
import { useLibrary } from '@/contexts/LibraryContext';
import { useAppHeader } from '@/contexts/AppHeaderContext';
import {
  getCandidateWords,
  getSetupIssues,
  selectGameWords,
  type GameSetupConfig,
} from '@/lib/games/gameConfig';
import { GAME_DEFINITIONS, getNextGameDefinition } from '@/lib/games/gameDefinitions';
import {
  DEFAULT_LISTENING_SETTINGS,
  type ListeningOrder,
  type ListeningSettings,
} from '@/lib/listening';
import { matchesSelectionFilters } from '@/lib/wordFilters';
import type { GameId, QuizGameId } from '@/lib/games/types';
import type { Word } from '@/lib/vocabulary';

function isQuizGame(gameId: GameId): gameId is QuizGameId {
  return gameId !== 'flashcards' && gameId !== 'listen-fi-tr' && gameId !== 'listen-tr-fi';
}

function isListeningGame(gameId: GameId): boolean {
  return gameId === 'listen-fi-tr' || gameId === 'listen-tr-fi';
}

type FinnishListeningOrder = Extract<ListeningOrder, 'fi_tr' | 'fi_only'>;
type TurkishListeningOrder = Extract<ListeningOrder, 'tr_fi' | 'tr_only'>;

interface ListeningModes {
  fiTrOrder: FinnishListeningOrder;
  trFiOrder: TurkishListeningOrder;
}

interface ActiveGame {
  gameId: GameId;
  words: Word[];
  attempt: number;
}

export default function GamesPage() {
  const { words, categories } = useLibrary();
  const gameConfig = useGameSettings();
  const [showSettings, setShowSettings] = useState(false);
  const [activeGame, setActiveGame] = useState<ActiveGame | null>(null);
  const [listeningSettings, setListeningSettings] = useStoredState<ListeningSettings>(
    'sanasto.listeningSettings',
    DEFAULT_LISTENING_SETTINGS,
  );
  const [listeningModes, setListeningModes] = useStoredState<ListeningModes>(
    'sanasto.listeningModes',
    { fiTrOrder: 'fi_tr', trFiOrder: 'tr_fi' },
  );
  const settingsRef = useRef<HTMLDivElement>(null);
  useDismissOnOutside(settingsRef, showSettings, () => setShowSettings(false));

  const categoryConfig: GameSetupConfig = gameConfig.config;

  const gameWords = useMemo(
    () => words.filter((word) => matchesSelectionFilters(word, categoryConfig)),
    [words, categoryConfig],
  );

  const poolByGame = useMemo(() => {
    const map = new Map<GameId, Word[]>();
    for (const def of GAME_DEFINITIONS) {
      map.set(def.id, getCandidateWords(gameWords, categoryConfig, def.requiresImage));
    }
    return map;
  }, [gameWords, categoryConfig]);

  const updateCategoryConfig = (next: GameSetupConfig) => {
    gameConfig.updateConfig(next);
  };

  const launchGame = (gameId: GameId) => {
    const def = GAME_DEFINITIONS.find((item) => item.id === gameId)!;
    const gameWordList = selectGameWords(gameWords, categoryConfig, def.requiresImage);
    const pool = poolByGame.get(gameId) ?? [];
    if (gameWordList.length === 0 || getSetupIssues(def, pool, gameWords, categoryConfig).length > 0) {
      return;
    }
    setActiveGame({ gameId, words: gameWordList, attempt: 0 });
  };

  const startNextGame = (currentId: GameId) => {
    const next = getNextGameDefinition(currentId);
    if (!next) return;
    launchGame(next.id);
  };

  const exitToList = useCallback(() => {
    setActiveGame(null);
  }, []);

  const retryWrong = (wordIds: string[]) => {
    setActiveGame((previous) =>
      previous && isQuizGame(previous.gameId)
        ? {
            gameId: previous.gameId,
            words: gameWords.filter((word) => wordIds.includes(word.id)),
            attempt: previous.attempt + 1,
          }
        : previous,
    );
  };

  const restart = () => {
    setActiveGame((previous) => (previous ? { ...previous, attempt: previous.attempt + 1 } : previous));
  };

  useAppHeader(activeGame ? {
    title: GAME_DEFINITIONS.find((item) => item.id === activeGame.gameId)?.title ?? 'Oyun',
    onBack: exitToList,
    hideChrome: true,
  } : null);

  if (activeGame) {
    const title = GAME_DEFINITIONS.find((item) => item.id === activeGame.gameId)?.title ?? '';
    const hasNextGame = getNextGameDefinition(activeGame.gameId) !== undefined;
    const sessionKey = `${activeGame.gameId}-${activeGame.attempt}`;
    const onNext = hasNextGame ? () => startNextGame(activeGame.gameId) : undefined;
    return (
      <div className="fixed inset-0 z-40 h-[100dvh] w-full overflow-hidden overscroll-none">
        {isListeningGame(activeGame.gameId) ? (
          <ListeningGame
            key={sessionKey}
            order={activeGame.gameId === 'listen-fi-tr' ? listeningModes.fiTrOrder : listeningModes.trFiOrder}
            words={activeGame.words}
            config={categoryConfig}
            title={title}
            onExit={exitToList}
            onRestart={restart}
            onNext={onNext}
          />
        ) : isQuizGame(activeGame.gameId) ? (
          <GameSession
            key={sessionKey}
            gameId={activeGame.gameId}
            words={activeGame.words}
            onExit={exitToList}
            onRetryWrong={retryWrong}
            onRestart={restart}
            onNext={onNext}
          />
        ) : (
          <FlashcardGame
            key={sessionKey}
            title={title}
            words={activeGame.words}
            onExit={exitToList}
            onRestart={restart}
            onNext={onNext}
          />
        )}
      </div>
    );
  }

  return (
    <div ref={settingsRef} className="space-y-4">
      {gameWords.length === 0 && (
        <p className="rounded-2xl bg-amber-50 p-4 text-sm text-amber-800">
          Oynamak için kelimeler gerekli. Kelime Listeleri sekmesinden liste seçip kelime ekleyin.
        </p>
      )}

      <div className="grid w-full grid-cols-1 gap-2">
        <button
          type="button"
          onClick={() => setShowSettings((open) => !open)}
          aria-expanded={showSettings}
          className="inline-flex w-full items-center justify-center gap-1.5 rounded-xl border border-blue-200 bg-blue-50 px-2 py-2.5 text-sm font-semibold text-blue-800 shadow-sm transition hover:bg-blue-100"
        >
          <SlidersHorizontal className="h-4 w-4 shrink-0" /> <span className="truncate">Oyun ayarları</span>
          <ChevronDown className={`h-4 w-4 shrink-0 transition ${showSettings ? 'rotate-180' : ''}`} />
        </button>
      </div>

      {showSettings && (
        <div className="space-y-6 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="space-y-4">
            <GameFilterFields
              config={categoryConfig}
              onChange={updateCategoryConfig}
              categories={categories}
              words={gameWords}
              showFavoritesToggle
            />
          </div>

          <ListeningSettingsPanel
            settings={listeningSettings}
            onChange={setListeningSettings}
            fiTrOrder={listeningModes.fiTrOrder}
            trFiOrder={listeningModes.trFiOrder}
            onFiTrOrderChange={(fiTrOrder) => setListeningModes((current) => ({ ...current, fiTrOrder }))}
            onTrFiOrderChange={(trFiOrder) => setListeningModes((current) => ({ ...current, trFiOrder }))}
          />

          {gameConfig.saveError && (
            <p className="rounded-xl bg-rose-50 p-3 text-sm text-rose-800">Ayarlar kaydedilemedi: {gameConfig.saveError}</p>
          )}
        </div>
      )}

      <p className="rounded-xl bg-blue-50 px-4 py-3 text-center text-sm font-semibold text-blue-900">
        Seçili kelime: {gameWords.length}
      </p>

      <ul className="grid grid-cols-2 gap-2 sm:gap-4">
        {GAME_DEFINITIONS.map((game) => {
          const Icon = game.icon;
          const pool = poolByGame.get(game.id) ?? [];
          const issues = getSetupIssues(game, pool, gameWords, categoryConfig);
          const canPlay = pool.length > 0 && issues.length === 0;
          return (
            <li key={game.id}>
              <button
                type="button"
                onClick={() => (canPlay ? launchGame(game.id) : setShowSettings(true))}
                className="group flex h-full w-full flex-col items-center justify-center gap-3 rounded-2xl border border-slate-200 bg-white p-4 text-center shadow-sm transition hover:border-blue-300 hover:shadow-md focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-100 sm:rounded-3xl sm:p-6"
              >
                <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-blue-50 text-blue-700 transition group-hover:bg-blue-700 group-hover:text-white">
                  <Icon className="h-6 w-6" aria-hidden="true" />
                </span>
                <span className="block text-base font-bold leading-tight text-slate-900 sm:text-lg">
                  {game.title}
                </span>
                {canPlay ? (
                  <span className="text-sm font-semibold text-blue-700">Oyna</span>
                ) : (
                  <span className="text-sm font-semibold text-slate-400">Ayar gerekli</span>
                )}
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

