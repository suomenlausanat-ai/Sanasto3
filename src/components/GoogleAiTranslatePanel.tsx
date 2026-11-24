import { ExternalLink } from 'lucide-react';
import { GOOGLE_AI_IMPORT_PROMPT, GOOGLE_AI_MODE_SEARCH_URL } from '@/lib/googleAiMode';

export default function GoogleAiTranslatePanel() {
  const openAiMode = () => {
    window.open(`${GOOGLE_AI_MODE_SEARCH_URL}${encodeURIComponent(GOOGLE_AI_IMPORT_PROMPT)}`, '_blank', 'noopener,noreferrer');
  };

  return (
    <button
      type="button"
      onClick={openAiMode}
      className="inline-flex min-w-0 flex-1 items-center justify-center gap-2 rounded-xl bg-slate-900 px-3 py-3 text-center text-sm font-semibold text-white transition hover:bg-slate-700"
    >
      <ExternalLink className="h-4 w-4 shrink-0" aria-hidden="true" /> Google AI Mode ile çevir
    </button>
  );
}
