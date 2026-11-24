import { useEffect, useMemo, useState } from 'react';
import GameFeedback from '@/components/games/GameFeedback';
import WordImage from '@/components/WordImage';
import { useSpeaker } from '@/hooks/useSpeaker';
import { useRevealShortcut, type QuestionProps } from '@/components/games/questions/questionShared';
import { shuffle } from '@/lib/random';
import { toWordResult, type WordResult } from '@/lib/games/types';
import type { Word } from '@/lib/vocabulary';

interface ImageMatchingQuestionProps extends QuestionProps {
  words: Word[];
}

const WRONG_FLASH_MS = 1000;

export default function ImageMatchingQuestion({ words, onDone, isSaving }: ImageMatchingQuestionProps) {
  const speak = useSpeaker();
  const imageOrder = useMemo(() => shuffle(words), [words]);
  const wordOrder = useMemo(() => shuffle(words), [words]);
  const [selectedImageId, setSelectedImageId] = useState<string | null>(null);
  const [selectedWordId, setSelectedWordId] = useState<string | null>(null);
  const [wrongPair, setWrongPair] = useState<{ imageId: string; wordId: string } | null>(null);
  const [matchedIds, setMatchedIds] = useState<Set<string>>(new Set());
  const [wrongIds, setWrongIds] = useState<Set<string>>(new Set());
  const [matchedOrder, setMatchedOrder] = useState<string[]>([]);
  const [revealedIds, setRevealedIds] = useState<Set<string>>(new Set());

  const matchedSet = useMemo(() => new Set(matchedOrder), [matchedOrder]);
  const rows = useMemo(() => {
    const matchedWords = matchedOrder
      .map((id) => words.find((word) => word.id === id))
      .filter((word): word is Word => Boolean(word));
    const openImages = imageOrder.filter((word) => !matchedSet.has(word.id));
    const openWords = wordOrder.filter((word) => !matchedSet.has(word.id));
    const matchedRows = matchedWords.map((word) => ({ image: word, word, matched: true }));
    const openRows = openImages.map((image, index) => ({ image, word: openWords[index] ?? image, matched: false }));
    return [...matchedRows, ...openRows];
  }, [words, imageOrder, wordOrder, matchedOrder, matchedSet]);

  useEffect(() => {
    if (!wrongPair) return;
    const timer = window.setTimeout(() => {
      setSelectedImageId(null);
      setSelectedWordId(null);
      setWrongPair(null);
    }, WRONG_FLASH_MS);
    return () => window.clearTimeout(timer);
  }, [wrongPair]);

  const match = (word: Word) => {
    setMatchedIds((previous) => new Set(previous).add(word.id));
    setMatchedOrder((previous) => [...previous, word.id]);
    setSelectedImageId(null);
    setSelectedWordId(null);
    void speak(word.finnish, 'fi');
  };

  const [isRevealed, setIsRevealed] = useState(false);

  const revealNext = () => {
    const next = imageOrder.find((word) => !matchedIds.has(word.id));
    if (next) {
      setRevealedIds((previous) => new Set(previous).add(next.id));
      match(next);
    }
  };
  useRevealShortcut(revealNext);

  const evaluate = (imageId: string, wordId: string) => {
    if (imageId === wordId) {
      const word = words.find((item) => item.id === imageId);
      if (word) match(word);
      return;
    }
    setWrongIds((previous) => new Set(previous).add(imageId));
    setWrongPair({ imageId, wordId });
  };

  const pickImage = (id: string) => {
    if (matchedIds.has(id) || wrongPair) return;
    setSelectedImageId(id);
    if (selectedWordId) evaluate(id, selectedWordId);
  };

  const pickWord = (id: string) => {
    if (matchedIds.has(id) || wrongPair) return;
    setSelectedWordId(id);
    if (selectedImageId) evaluate(selectedImageId, id);
  };

  const isDone = matchedIds.size === words.length;
  const results: WordResult[] = words.map((word) =>
    toWordResult(word, !wrongIds.has(word.id) && !revealedIds.has(word.id)),
  );
  const allCorrect = wrongIds.size === 0;

  return (
    <section className="flex flex-col gap-3">
      <div className="flex flex-col gap-3 sm:gap-4">
        {rows.map(({ image, word: alignedWord, matched }, index) => (
          <div key={`row-${image.id}-${index}`} className="flex items-stretch gap-3 sm:gap-4">
            <button
              type="button"
              onClick={() => pickImage(image.id)}
              disabled={matchedIds.has(image.id)}
              className={`flex aspect-square w-[min(45%,15vh)] shrink-0 items-center justify-center overflow-hidden rounded-2xl border-2 transition-all duration-300 ${
                !matched && wrongPair?.imageId === image.id
                  ? 'border-rose-500 animate-pulse'
                  : matched
                    ? 'border-emerald-400'
                    : selectedImageId === image.id
                      ? 'border-blue-600 ring-2 ring-blue-100'
                      : 'border-slate-200 hover:border-blue-400 hover:shadow-sm'
              }`}
            >
              <WordImage
                src={image.image_url}
                alt={image.finnish}
                fit="contain"
                className="h-full w-full bg-white"
              />
            </button>
            <button
              type="button"
              onClick={() => !matched && pickWord(alignedWord.id)}
              disabled={matched}
              className={`flex min-w-0 flex-1 items-center justify-center rounded-2xl border-2 px-1.5 py-2 text-center text-base font-semibold leading-tight transition-all duration-300 ${
                matched
                  ? 'border-emerald-400 bg-emerald-50 text-emerald-800'
                  : wrongPair?.wordId === alignedWord.id
                    ? 'border-rose-500 bg-rose-50 text-rose-800 animate-pulse'
                    : selectedWordId === alignedWord.id
                      ? 'border-blue-600 bg-blue-50 text-blue-900 ring-2 ring-blue-100'
                      : 'border-slate-200 bg-white text-slate-900 hover:border-blue-300 hover:bg-slate-50 hover:shadow-sm'
              }`}
            >
              <span className="break-words">{alignedWord.finnish}</span>
            </button>
          </div>
        ))}
      </div>

      {isDone && (
        <GameFeedback
          correct={allCorrect}
          title={allCorrect ? 'Tüm eşleşmeler doğru!' : 'Tüm eşleşmeler tamamlandı'}
          detail={allCorrect ? undefined : `${results.filter((result) => result.correct).length} / ${words.length} kelimeyi ilk denemede eşleştirdiniz.`}
          isSaving={isSaving}
          onContinue={() => onDone(results)}
        />
      )}
    </section>
  );
}
