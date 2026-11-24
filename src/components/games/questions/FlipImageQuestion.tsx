import GameFeedback from '@/components/games/GameFeedback';
import SpeakButton from '@/components/SpeakButton';
import FlipCardGrid from '@/components/games/questions/FlipCardGrid';
import { useChoiceRound, useRevealShortcut, useSpokenFeedback, type QuestionProps } from '@/components/games/questions/questionShared';
import type { Word } from '@/lib/vocabulary';

interface FlipImageQuestionProps extends QuestionProps {
  word: Word;
  options: Word[];
}

export default function FlipImageQuestion({ word, options, onDone, isSaving }: FlipImageQuestionProps) {
  const round = useChoiceRound(word);
  const isSpoken = useSpokenFeedback(round.isSolved || round.isRevealed, word.finnish, 'fi');
  useRevealShortcut(round.reveal);

  return (
    <section className="space-y-4">
      <div className="rounded-3xl border border-slate-200 bg-white p-4 text-center shadow-sm">
        <p className="break-words text-base font-semibold leading-tight text-slate-900">{word.finnish}</p>
      </div>

      <FlipCardGrid options={options} target={word} faceText={(option) => option.turkish} round={round} square />

      {(round.isSolved || round.hadWrongAttempt || round.isRevealed) && (
        <GameFeedback
          correct={round.isSolved || round.isRevealed}
          title={round.isRevealed ? 'Cevap gösterildi' : round.isSolved ? 'Doğru!' : 'Yanlış kart, tekrar deneyin'}
          detail={
            <span className="flex items-center gap-3">
              Doğru cevap: <strong>{word.turkish}</strong>
              <SpeakButton text={word.finnish} language="fi" label="Fince telaffuz" />
            </span>
          }
          isRevealed={round.isRevealed}
          isReady={isSpoken}
          isSaving={isSaving}
          onReveal={round.reveal}
          showActionButton={false}
          feedbackKey={round.wrongIds.length}
          onContinue={() => onDone(round.results)}
        />
      )}
    </section>
  );
}
