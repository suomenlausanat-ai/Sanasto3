import { useMemo } from 'react';
import { Volume2 } from 'lucide-react';
import GameFeedback from '@/components/games/GameFeedback';
import LetterPicker from '@/components/games/questions/LetterPicker';
import LetterSlots from '@/components/games/questions/LetterSlots';
import { useRevealShortcut, type QuestionProps } from '@/components/games/questions/questionShared';
import { useLetterAnswer } from '@/components/games/questions/useLetterAnswer';
import SpeakButton from '@/components/SpeakButton';
import WordImage from '@/components/WordImage';
import { useAutoSpeak } from '@/hooks/useAutoSpeak';
import { useSpeaker } from '@/hooks/useSpeaker';
import { buildLetterTiles } from '@/lib/games/letterTiles';
import type { Word } from '@/lib/vocabulary';

type TypedVariant = 'word' | 'listen' | 'image';

interface TypedWordQuestionProps extends QuestionProps {
  word: Word;
  variant: TypedVariant;
}

const VARIANT_SHOWS: Record<TypedVariant, { image: boolean; meaning: boolean }> = {
  word: { image: false, meaning: true },
  listen: { image: false, meaning: false },
  image: { image: true, meaning: false },
};

export default function TypedWordQuestion({ word, variant, onDone, isSaving }: TypedWordQuestionProps) {
  const speak = useSpeaker();
  useAutoSpeak(word.finnish, 'fi', variant === 'listen');
  const chars = useMemo(() => [...word.finnish.normalize('NFC')], [word.finnish]);
  const hiddenIndexes = useMemo(
    () => chars.flatMap((char, index) => (char === ' ' ? [] : [index])),
    [chars],
  );
  const hiddenText = hiddenIndexes.map((index) => chars[index]).join('');
  const tiles = useMemo(() => buildLetterTiles(hiddenText), [hiddenText]);
  const answer = useLetterAnswer(word, hiddenIndexes);
  const shows = VARIANT_SHOWS[variant];
  const showAnswerVisuals = answer.isLocked;
  const showImage = shows.image || showAnswerVisuals;
  const showMeaning = shows.meaning || showAnswerVisuals;
  useRevealShortcut(answer.reveal);

  return (
    <section className="space-y-3">
      {showImage && (
        <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
          <WordImage src={word.image_url} alt="" fit="cover" className="aspect-square w-full" />
          {showMeaning && (
            <div className="p-3 text-center">
              <p className="break-words text-2xl font-extrabold leading-tight text-slate-900 sm:text-3xl">{word.turkish}</p>
            </div>
          )}
        </div>
      )}

      {!showImage && showMeaning && (
        <div className="rounded-2xl border border-slate-200 bg-white p-5 text-center shadow-sm">
          <p className="break-words text-2xl font-extrabold leading-tight text-slate-900 sm:text-3xl">{word.turkish}</p>
        </div>
      )}

      {!showImage && !showMeaning && (
        <div className="rounded-2xl border border-slate-200 bg-white p-5 text-center shadow-sm">
          <button
            type="button"
            onClick={() => void speak(word.finnish, 'fi')}
            className="mx-auto inline-flex h-10 w-10 items-center justify-center rounded-full bg-blue-700 text-white shadow-md transition hover:scale-105 hover:bg-blue-800 active:scale-95"
            aria-label="Fince kelimeyi dinle"
          >
            <Volume2 className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>
      )}

      {!answer.isLocked && (
        <div className="space-y-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="rounded-2xl bg-white p-4">
            <LetterSlots
              chars={answer.chars}
              hiddenIndexes={hiddenIndexes}
              values={answer.inputs}
              tone={answer.tone}
              errorSlot={answer.errorSlot}
            />
          </div>
          <LetterPicker
            tiles={tiles}
            values={answer.inputs}
            disabled={answer.isLocked}
            onPick={answer.pick}
          />

        </div>
      )}

      {(answer.isSolved || answer.hadWrongAttempt || answer.isRevealed) && (
        <GameFeedback
          correct={answer.isSolved || answer.isRevealed}
          title={answer.isRevealed ? 'Cevap gösterildi' : answer.isSolved ? 'Doğru!' : 'Yanlış cevap, tekrar deneyin'}
          detail={
            <p className="flex items-center gap-3">
              Fince: <strong>{word.finnish}</strong>
              <SpeakButton text={word.finnish} language="fi" label="Fince telaffuz" />
            </p>
          }
          isRevealed={answer.isRevealed}
          isReady={answer.isSpoken}
          isSaving={isSaving}
          onReveal={answer.reveal}
          showActionButton={false}
          onContinue={() => onDone(answer.results)}
        />
      )}
    </section>
  );
}
