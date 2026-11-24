import { useState } from 'react';
import { Eye, ArrowLeft } from 'lucide-react';
import GameResults from '@/components/games/GameResults';
import GameTopBar from '@/components/games/GameTopBar';
import ImageChoiceQuestion from '@/components/games/questions/ImageChoiceQuestion';
import ListenChoiceQuestion from '@/components/games/questions/ListenChoiceQuestion';
import ReadChoiceQuestion from '@/components/games/questions/ReadChoiceQuestion';
import FlipImageQuestion from '@/components/games/questions/FlipImageQuestion';
import MatchingQuestion from '@/components/games/questions/MatchingQuestion';
import ImageMatchingQuestion from '@/components/games/questions/ImageMatchingQuestion';
import TypedWordQuestion from '@/components/games/questions/TypedWordQuestion';
import TurkishImageChoiceQuestion from '@/components/games/questions/TurkishImageChoiceQuestion';
import { useLibrary } from '@/contexts/LibraryContext';
import { buildQuestions } from '@/lib/games/questionBuilder';
import { getGameDefinition } from '@/lib/games/gameDefinitions';
import type { QuizGameId, QuizQuestion, WordResult } from '@/lib/games/types';
import { describeError } from '@/lib/errors';
import type { Word } from '@/lib/vocabulary';

interface GameSessionProps {
  gameId: QuizGameId;
  words: Word[];
  onExit: () => void;
  onRetryWrong: (wordIds: string[]) => void;
  onRestart: () => void;
  onNext?: () => void;
}

export default function GameSession({ gameId, words, onExit, onRetryWrong, onRestart, onNext }: GameSessionProps) {
  const { words: library, recordAnswers } = useLibrary();
  const [questions] = useState<QuizQuestion[]>(() => buildQuestions(gameId, words, library));
  const [questionIndex, setQuestionIndex] = useState(0);
  const [results, setResults] = useState<WordResult[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const definition = getGameDefinition(gameId);

  const handleDone = async (answers: WordResult[]) => {
    if (questionIndex < questions.length - 1) {
      setResults((previous) => [...previous, ...answers]);
      setQuestionIndex((index) => index + 1);
      return;
    }
    setIsSaving(true);
    setSaveError(null);
    try {
      const allResults = [...results, ...answers];
      await recordAnswers(gameId, allResults.map(({ wordId, correct }) => ({ wordId, correct })));
      setResults(allResults);
      setQuestionIndex((index) => index + 1);
    } catch (error) {
      setSaveError(describeError(error));
    } finally {
      setIsSaving(false);
    }
  };

  if (questionIndex >= questions.length) {
    return (
      <div className="h-screen w-full overflow-y-auto overscroll-contain pb-24">
        <GameResults
        title={definition.title}
        results={results}
        onRetryWrong={onRetryWrong}
        onRestart={onRestart}
        onNext={onNext}
        onExit={onExit}
        />
      </div>
    );
  }

  const question = questions[questionIndex];
  const canReveal = true;
  const previousQuestion = questions[questionIndex - 1];
  const previousResultCount = previousQuestion
    ? previousQuestion.kind === 'matching' || previousQuestion.kind === 'image-matching'
      ? previousQuestion.words.length
      : 1
    : 0;

  const questionProps = { onDone: handleDone, isSaving, onReveal: canReveal ? undefined : undefined };

  return (
    <div className="flex h-[100dvh] w-full flex-col overflow-hidden overscroll-none">
      {saveError && (
        <p className="rounded-xl bg-rose-50 p-3 text-sm text-rose-800">
          Sonuç kaydedilemedi: {saveError}. Devam düğmesine tekrar basarak deneyebilirsiniz.
        </p>
      )}

      <GameTopBar title={definition.title} current={questionIndex + 1} total={questions.length} onExit={onExit} />
      <div className="mx-auto min-h-0 w-full max-w-3xl flex-1 overflow-hidden px-2 pb-16 pt-2 sm:px-4 sm:pb-20 sm:pt-3">
        <div className="flex h-full flex-col justify-start overflow-hidden">
          {renderQuestion(question, questionIndex, questionProps)}
        </div>
      </div>
      <div className="fixed inset-x-0 bottom-0 z-20 flex items-center justify-between gap-3 border-t border-slate-200 bg-white/95 px-3 py-2 backdrop-blur sm:px-5">
        <button
          type="button"
          onClick={() => {
            setResults((previous) => previous.slice(0, Math.max(0, previous.length - previousResultCount)));
            setQuestionIndex((index) => Math.max(0, index - 1));
          }}
          disabled={questionIndex === 0}
          className="inline-flex items-center gap-2 rounded-xl border border-blue-200 bg-blue-50 px-3 py-2 text-sm font-semibold text-blue-800 transition hover:bg-blue-100 disabled:opacity-40"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" /> Önceki
        </button>
        {canReveal && (
          <button
            type="button"
            onClick={() => window.dispatchEvent(new CustomEvent('sanasto:reveal-answer'))}
            className="inline-flex items-center gap-2 rounded-xl border border-blue-200 bg-blue-50 px-4 py-2 text-sm font-semibold text-blue-800 shadow-sm transition hover:bg-blue-100"
          >
            <Eye className="h-4 w-4" aria-hidden="true" /> Cevabı göster
          </button>
        )}
      </div>
    </div>
  );
}

function renderQuestion(
  question: QuizQuestion,
  key: number,
  props: { onDone: (results: WordResult[]) => void; isSaving: boolean; onReveal?: () => void },
) {
  switch (question.kind) {
    case 'image-choice':
      return <ImageChoiceQuestion key={key} word={question.word} options={question.options} {...props} />;
    case 'listen-choice':
      return <ListenChoiceQuestion key={key} word={question.word} options={question.options} {...props} />;
    case 'flip-image':
      return <FlipImageQuestion key={key} word={question.word} options={question.options} {...props} />;
    case 'read-choice':
      return <ReadChoiceQuestion key={key} word={question.word} options={question.options} {...props} />;
    case 'matching':
      return <MatchingQuestion key={key} words={question.words} {...props} />;
    case 'image-matching':
      return <ImageMatchingQuestion key={key} words={question.words} {...props} />;
    case 'type-word':
      return <TypedWordQuestion key={key} word={question.word} variant="word" {...props} />;
    case 'image-type':
      return <TypedWordQuestion key={key} word={question.word} variant="image" {...props} />;
    case 'turkish-image-choice':
      return <TurkishImageChoiceQuestion key={key} word={question.word} options={question.options} {...props} />;
  }
}
