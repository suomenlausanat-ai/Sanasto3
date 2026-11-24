import { useState } from 'react';
import GameFeedback from '@/components/games/GameFeedback';
import SpeakButton from '@/components/SpeakButton';
import WordImage from '@/components/WordImage';
import { useRevealShortcut, useSpokenFeedback, type QuestionProps } from '@/components/games/questions/questionShared';
import { toWordResult, type WordResult } from '@/lib/games/types';
import type { Word } from '@/lib/vocabulary';

interface ReadChoiceQuestionProps extends QuestionProps {
  word: Word;
  options: Word[];
}

export default function ReadChoiceQuestion({ word, options, onDone }: ReadChoiceQuestionProps) {
  const [wrongIds, setWrongIds] = useState<string[]>([]);
  const [isSolved, setIsSolved] = useState(false);
  const [isRevealed, setIsRevealed] = useState(false);
  const hadWrongAttempt = wrongIds.length > 0;
  const isLocked = isSolved || isRevealed;
  const results: WordResult[] = [toWordResult(word, !hadWrongAttempt && !isRevealed)];
  const isSpoken = useSpokenFeedback(isSolved || isRevealed, word.finnish, 'fi');
  useRevealShortcut(() => setIsRevealed(true));

  const choose = (option: Word) => {
    if (isLocked || wrongIds.includes(option.id)) return;
    if (option.id === word.id) {
      setIsSolved(true);
    } else {
      setWrongIds((previous) => [...previous, option.id]);
    }
  };

  return (
    <section className="space-y-4">
      <div className="rounded-3xl border border-slate-200 bg-white p-4 text-center shadow-sm">
        <p className="break-words text-2xl font-extrabold leading-tight text-slate-900 sm:text-3xl">{word.finnish}</p>
      </div>

      <div className="grid grid-cols-2 gap-2 sm:gap-3">
        {options.map((option) => {
          const isWrongChoice = wrongIds.includes(option.id);
          const isCorrectOption = option.id === word.id;
          const showResult = isLocked && (isCorrectOption || isWrongChoice);
          return (
            <button
              key={option.id}
              type="button"
              onClick={() => choose(option)}
              disabled={isLocked || isWrongChoice}
              className={`overflow-hidden rounded-3xl border-2 transition-all duration-200 ${
                showResult && isCorrectOption
                  ? 'border-emerald-500 bg-emerald-50'
                  : isWrongChoice
                    ? 'border-rose-500 bg-rose-50'
                    : isLocked
                      ? 'border-slate-200 opacity-60'
                      : 'border-slate-200 bg-white hover:-translate-y-0.5 hover:border-blue-400 hover:shadow-md'
              }`}
            >
              <WordImage src={option.image_url} alt="" fit="cover" className="aspect-square w-full" />
            </button>
          );
        })}
      </div>

      {(isSolved || hadWrongAttempt || isRevealed) && (
        <GameFeedback
          correct={isSolved || isRevealed}
          title={isRevealed ? 'Cevap gösterildi' : isSolved ? 'Doğru!' : 'Yanlış kart, tekrar deneyin'}
          detail={
            <span className="flex items-center gap-3">
              Doğru Fince kelime: <strong>{word.finnish}</strong>
              <SpeakButton text={word.finnish} language="fi" label="Fince telaffuz" />
            </span>
          }
          isRevealed={isRevealed}
          isReady={isSpoken}
          isSaving={false}
          onReveal={() => setIsRevealed(true)}
          showActionButton={false}
          feedbackKey={wrongIds.length}
          onContinue={() => onDone(results)}
        />
      )}
    </section>
  );
}
