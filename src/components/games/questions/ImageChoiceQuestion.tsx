import { useState } from 'react';
import GameFeedback from '@/components/games/GameFeedback';
import SpeakButton from '@/components/SpeakButton';
import WordImage from '@/components/WordImage';
import { choiceClass, useRevealShortcut, useSpokenFeedback, type QuestionProps } from '@/components/games/questions/questionShared';
import { toWordResult, type WordResult } from '@/lib/games/types';
import type { Word } from '@/lib/vocabulary';

interface ImageChoiceQuestionProps extends QuestionProps {
  word: Word;
  options: Word[];
}

export default function ImageChoiceQuestion({ word, options, onDone, isSaving }: ImageChoiceQuestionProps) {
  const [wrongIds, setWrongIds] = useState<string[]>([]);
  const [isSolved, setIsSolved] = useState(false);
  const [isRevealed, setIsRevealed] = useState(false);
  const isLocked = isSolved || isRevealed;
  const hadWrongAttempt = wrongIds.length > 0;
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
      <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
        <WordImage src={word.image_url} alt="" fit="cover" className="aspect-square w-full" />
      </div>
      <p className="break-words text-center text-2xl font-extrabold leading-tight text-slate-900 sm:text-3xl">{word.turkish}</p>

      <div className="grid grid-cols-2 gap-2 sm:gap-3">
        {options.map((option) => (
          <button
            key={option.id}
            type="button"
            onClick={() => choose(option)}
            disabled={isLocked || wrongIds.includes(option.id)}
            className={`${choiceClass(isLocked, option.id === word.id, wrongIds.includes(option.id))} px-3 py-3 text-base font-semibold`}
          >
            {option.finnish}
          </button>
        ))}
      </div>

      {(isSolved || hadWrongAttempt || isRevealed) && (
        <GameFeedback
          correct={isSolved || isRevealed}
          title={isRevealed ? 'Cevap gösterildi' : isSolved ? 'Doğru!' : 'Yanlış cevap, tekrar deneyin'}
          detail={
            <span className="flex items-center gap-3">
              Doğru cevap: <strong>{word.finnish}</strong>
              <SpeakButton text={word.finnish} language="fi" label="Doğru kelimeyi dinle" />
            </span>
          }
          isRevealed={isRevealed}
          isReady={isSpoken}
          isSaving={isSaving}
          onReveal={() => setIsRevealed(true)}
          showActionButton={false}
          feedbackKey={wrongIds.length}
          onContinue={() => onDone(results)}
        />
      )}
    </section>
  );
}
