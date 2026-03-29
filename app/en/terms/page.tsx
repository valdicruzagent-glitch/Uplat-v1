'use client';

import termsEN from '@/content/legal/terms.en';

export default function TermsPage() {
  return (
    <div className="min-h-dvh bg-zinc-50 text-zinc-900 dark:bg-black dark:text-zinc-50 p-6">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-2xl font-bold mb-4">Terms of Use – Tualero</h1>
        <pre className="whitespace-pre-wrap text-sm leading-relaxed">{termsEN}</pre>
      </div>
    </div>
  );
}
