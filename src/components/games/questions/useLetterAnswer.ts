import { useEffect, useMemo, useState } from 'react';
import { isAnswerCorrect } from '@/lib/games/answerCheck';
import { toWordResult, type WordResult } from '@/lib/games/types';
import { useSpokenFeedback } from '@/components/games/questions/questionShared';
import type { Word } from '@/lib/vocabulary';

export function useLetterAnswer(word: Word, hiddenIndexes: number[]) {
  const [inputs, setInputs] = useState<(string | null)[]>(() => hiddenIndexes.map(() => null));
  const [isSolved, setIsSolved] = useState(false);
  const [isRevealed, setIsRevealed] = useState(false);
  const [hasUsedReveal, setHasUsedReveal] = useState(false);
  const [hasWrongAttempt, setHasWrongAttempt] = useState(false);
  const [errorSlot, setErrorSlot] = useState<number | null>(null);

  const chars = useMemo(() => [...word.finnish.normalize('NFC')], [word.finnish]);
  const isLocked = isSolved || isRevealed;
  const hadWrongAttempt = hasWrongAttempt;
  const results: WordResult[] = [toWordResult(word, !hadWrongAttempt && isSolved && !hasUsedReveal)];

  useEffect(() => {
    if (errorSlot === null) return;
    const timer = window.setTimeout(() => setErrorSlot(null), 1000);
    return () => window.clearTimeout(timer);
  }, [errorSlot]);

  const isSpoken = useSpokenFeedback(isSolved || isRevealed, word.finnish, 'fi');

  const targetText = hiddenIndexes.map((index) => chars[index]).join('');

  const pick = (tile: { char: string; id: number }) => {
    if (isLocked) return;
    const firstEmpty = inputs.findIndex((v) => v === null);
    if (firstEmpty === -1) return;

    const expectedChar = chars[hiddenIndexes[firstEmpty]];
    if (tile.char !== expectedChar) {
      setHasWrongAttempt(true);
      setErrorSlot(hiddenIndexes[firstEmpty]);
      return;
    }

    const next = [...inputs];
    next[firstEmpty] = tile.char;
    setInputs(next);
    setErrorSlot(null);

    if (!next.includes(null)) {
      const filledText = next.filter((_, i) => hiddenIndexes.includes(i)).join('');
      if (isAnswerCorrect(filledText, targetText)) {
        setIsSolved(true);
      }
    }
  };

  const removeLast = () => {
    if (isLocked) return;
    const lastFilled = [...inputs].reverse().findIndex((v) => v !== null);
    if (lastFilled === -1) return;
    const actualIndex = inputs.length - 1 - lastFilled;
    const next = [...inputs];
    next[actualIndex] = null;
    setInputs(next);
    setErrorSlot(null);
  };

  const reveal = () => {
    const nextIndex = inputs.findIndex((value) => value === null);
    if (nextIndex === -1) return;
    setHasUsedReveal(true);
    const next = [...inputs];
    next[nextIndex] = chars[hiddenIndexes[nextIndex]];
    setInputs(next);
    if (!next.includes(null)) setIsRevealed(true);
  };

  const tone: 'default' | 'correct' | 'wrong' = isSolved
    ? 'correct'
    : isRevealed
      ? 'correct'
      : errorSlot !== null
        ? 'wrong'
        : 'default';

  return {
    chars,
    inputs,
    isSolved,
    isRevealed,
    isLocked,
    hadWrongAttempt,
    errorSlot,
    results,
    pick,
    removeLast,
    reveal,
    tone,
    isSpoken,
  };
}
