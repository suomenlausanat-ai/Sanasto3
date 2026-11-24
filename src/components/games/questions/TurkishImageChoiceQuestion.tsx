import GameFeedback from '@/components/games/GameFeedback';
import SpeakButton from '@/components/SpeakButton';
import FlipCardGrid from '@/components/games/questions/FlipCardGrid';
import { useChoiceRound, useRevealShortcut, useSpokenFeedback, type QuestionProps } from '@/components/games/questions/questionShared';
import type { Word } from '@/lib/vocabulary';

interface TurkishImageChoiceQuestionProps extends QuestionProps {
  word: Word;
  options: Word[];
}

export default function TurkishImageChoiceQuestion({
  word,
  options,
  onDone,
  isSaving,
}: TurkishImageChoiceQuestionProps) {
  const round = useChoiceRound(word);
  const isSpoken = useSpokenFeedback(round.isSolved || round.isRevealed, word.finnish, 'fi');
  useRevealShortcut(round.reveal);

  return (
    <section className="space-y-4">
      <div className="rounded-3xl border border-slate-200 bg-white p-4 text-center shadow-sm">
        <p className="break-words text-base font-semibold leading-tight text-slate-900">{word.turkish}</p>
      </div>

      <FlipCardGrid options={options} target={word} faceText={(option) => option.finnish} round={round} square />

      {(round.isSolved || round.hadWrongAttempt || round.isRevealed) && (
        <GameFeedback
          correct={round.isSolved || round.isRevealed}
          title={round.isRevealed ? 'Cevap gösterildi' : round.isSolved ? 'Doğru!' : 'Yanlış kart, tekrar deneyin'}
          detail={
            round.isSolved || round.isRevealed ? (
              <span className="flex items-center gap-3">
                Doğru Fince kelime: <strong>{word.finnish}</strong>
                <SpeakButton text={word.finnish} language="fi" label="Fince telaffuz" />
              </span>
            ) : undefined
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
