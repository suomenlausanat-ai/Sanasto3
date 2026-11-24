import WordImage from '@/components/WordImage';
import type { ChoiceRound } from '@/components/games/questions/questionShared';
import type { Word } from '@/lib/vocabulary';

interface FlipCardGridProps {
  options: Word[];
  target: Word;
  faceText: (word: Word) => string;
  round: ChoiceRound;
  square?: boolean;
}

export default function FlipCardGrid({ options, target, faceText, round, square }: FlipCardGridProps) {
  return (
    <div className="grid w-full grid-cols-2 gap-4 px-4 sm:grid-cols-4">
      {options.map((option) => {
        const isWrongChoice = round.wrongIds.includes(option.id);
        const isCorrectCard = option.id === target.id;
        const isFlipped = isWrongChoice || round.isLocked;
        const ringClass = isWrongChoice
          ? 'ring-rose-500'
          : isCorrectCard && round.isLocked
            ? 'ring-emerald-500'
            : round.isLocked
              ? 'ring-blue-200'
              : 'ring-slate-200 hover:ring-blue-300';
        return (
          <button
            key={option.id}
            type="button"
            onClick={() => round.choose(option)}
            disabled={round.isLocked || isWrongChoice}
            aria-label={`${faceText(option)} kartı`}
            className={`relative w-full min-w-0 ${square ? 'aspect-square' : 'h-[clamp(92px,16dvh,150px)]'} rounded-3xl ring-2 transition-shadow [perspective:1000px] focus-visible:outline-none focus-visible:ring-4 ${ringClass}`}
          >
            <span
              className={`absolute inset-0 block rounded-3xl transition-transform duration-500 [transform-style:preserve-3d] ${
                isFlipped ? '[transform:rotateY(180deg)]' : ''
              }`}
            >
              <span className="absolute inset-0 flex items-center justify-center break-words rounded-3xl bg-white p-1 text-center text-base font-semibold leading-tight text-slate-900 shadow-sm [backface-visibility:hidden]">
                {faceText(option)}
              </span>
              <span className="absolute inset-0 overflow-hidden rounded-3xl bg-white shadow-sm [backface-visibility:hidden] [transform:rotateY(180deg)]">
                <WordImage src={option.image_url} alt="" fit="contain" className="h-full w-full" />
              </span>
            </span>
          </button>
        );
      })}
    </div>
  );
}
