import { useState, type ReactNode } from 'react';
import { RefreshCw } from 'lucide-react';
import AppShell, { SettingsPage, type TabId } from '@/components/AppShell';
import { LibraryProvider, useLibrary } from '@/contexts/LibraryContext';
import LearnPage from '@/pages/LearnPage';
import GamesPage from '@/pages/GamesPage';
import WordsPage from '@/pages/WordsPage';

function SignedInContent() {
  const [activeTab, setActiveTab] = useState<TabId>('categories');
  const { isLoading, loadError, reload } = useLibrary();

  if (isLoading) {
    return (
      <FullScreenMessage>
        <div className="w-full max-w-md space-y-4" role="status" aria-label="Kelimeler yükleniyor">
          <div className="skeleton-shimmer h-8 w-40 rounded-xl bg-slate-200" />
          <div className="skeleton-shimmer h-24 rounded-2xl bg-slate-200" />
          <div className="grid grid-cols-2 gap-3">
            <div className="skeleton-shimmer h-20 rounded-2xl bg-slate-200" />
            <div className="skeleton-shimmer h-20 rounded-2xl bg-slate-200" />
          </div>
          <p className="text-center text-sm text-slate-500">Kelimeleriniz yükleniyor...</p>
        </div>
      </FullScreenMessage>
    );
  }

  if (loadError) {
    return (
      <FullScreenMessage>
        <p className="text-center text-rose-700">{loadError}</p>
        <button
          type="button"
          onClick={() => void reload()}
          className="mt-2 inline-flex items-center gap-2 rounded-xl bg-blue-700 px-5 py-3 font-semibold text-white transition hover:bg-blue-800"
        >
          <RefreshCw className="h-4 w-4" /> Tekrar dene
        </button>
      </FullScreenMessage>
    );
  }

  return (
    <AppShell activeTab={activeTab} onTabChange={setActiveTab}>
      {activeTab === 'categories' && <LearnPage />}
      {activeTab === 'games' && <GamesPage />}
      {activeTab === 'words' && <WordsPage />}
      {activeTab === 'settings' && <SettingsPage />}
    </AppShell>
  );
}

function FullScreenMessage({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-slate-50 px-4 text-slate-700">
      {children}
    </div>
  );
}

export default function SignedInApp() {
  return (
    <LibraryProvider>
      <SignedInContent />
    </LibraryProvider>
  );
}
