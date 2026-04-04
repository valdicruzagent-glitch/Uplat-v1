'use client';

import { useMemo, useState } from 'react';

export default function ShareButton({ title, priceText, locationText }: { title: string; priceText?: string; locationText?: string }) {
  const [copied, setCopied] = useState(false);
  const [open, setOpen] = useState(false);

  const shareText = useMemo(() => {
    return [title, priceText, locationText].filter(Boolean).join(' • ');
  }, [title, priceText, locationText]);

  const handleNativeShare = async () => {
    const url = window.location.href;
    try {
      if (navigator.share) {
        await navigator.share({ title, text: shareText, url });
        setOpen(false);
        return true;
      }
    } catch (error) {
      console.error('Native share failed', error);
    }
    return false;
  };

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Copy failed', error);
    }
  };

  const shareUrl = typeof window !== 'undefined' ? encodeURIComponent(window.location.href) : '';
  const shareBody = encodeURIComponent(`${shareText}\n${typeof window !== 'undefined' ? window.location.href : ''}`);

  return (
    <>
      <button
        type="button"
        onClick={async () => {
          const shared = await handleNativeShare();
          if (!shared) setOpen(true);
        }}
        className="inline-flex items-center justify-center gap-2 rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-100 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:bg-zinc-800"
      >
        <span>Compartir</span>
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-4 sm:items-center" onClick={() => setOpen(false)}>
          <div className="w-full max-w-md rounded-2xl bg-white p-4 shadow-xl dark:bg-zinc-900" onClick={(e) => e.stopPropagation()}>
            <div className="mb-3 text-lg font-semibold">Compartir propiedad</div>
            <div className="mb-4 text-sm text-zinc-600 dark:text-zinc-400">{shareText}</div>

            <div className="grid grid-cols-2 gap-2">
              <button onClick={copyLink} className="rounded-lg border border-zinc-200 px-3 py-3 text-sm hover:bg-zinc-50 dark:border-zinc-800 dark:hover:bg-zinc-800">
                Copiar link {copied ? '✓' : ''}
              </button>
              <a href={`https://wa.me/?text=${shareBody}`} target="_blank" rel="noreferrer" className="rounded-lg border border-zinc-200 px-3 py-3 text-sm hover:bg-zinc-50 dark:border-zinc-800 dark:hover:bg-zinc-800 text-center">
                WhatsApp
              </a>
              <a href={`https://t.me/share/url?url=${shareUrl}&text=${encodeURIComponent(shareText)}`} target="_blank" rel="noreferrer" className="rounded-lg border border-zinc-200 px-3 py-3 text-sm hover:bg-zinc-50 dark:border-zinc-800 dark:hover:bg-zinc-800 text-center">
                Telegram
              </a>
              <a href={`https://twitter.com/intent/tweet?text=${shareBody}`} target="_blank" rel="noreferrer" className="rounded-lg border border-zinc-200 px-3 py-3 text-sm hover:bg-zinc-50 dark:border-zinc-800 dark:hover:bg-zinc-800 text-center">
                X / Twitter
              </a>
              <a href={`https://www.facebook.com/sharer/sharer.php?u=${shareUrl}`} target="_blank" rel="noreferrer" className="rounded-lg border border-zinc-200 px-3 py-3 text-sm hover:bg-zinc-50 dark:border-zinc-800 dark:hover:bg-zinc-800 text-center col-span-2">
                Facebook
              </a>
            </div>

            <button onClick={() => setOpen(false)} className="mt-4 w-full rounded-lg bg-zinc-100 px-4 py-3 text-sm font-medium hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700">
              Cerrar
            </button>
          </div>
        </div>
      )}
    </>
  );
}
