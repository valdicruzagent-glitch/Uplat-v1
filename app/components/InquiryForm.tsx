'use client';

import { useState } from 'react';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

interface InquiryFormProps {
  listingId: string;
  agentId: string | null | undefined;
  locale: 'es' | 'en';
  translations: {
    askAbout: string;
    messagePlaceholder: string;
    waPlaceholder: string;
    submit: string;
    submitting: string;
    success: string;
    error: string;
  };
}

export default function InquiryForm({ listingId, agentId, locale, translations }: InquiryFormProps) {
  const [message, setMessage] = useState('');
  const [waFrom, setWaFrom] = useState('');
  const [status, setStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;
    setStatus('submitting');
    setErrorMsg('');
    try {
      const { error } = await supabase.from('listing_inquiries').insert({
        listing_id: listingId,
        user_id: (await supabase.auth.getUser()).data.user?.id || null,
        agent_id: agentId || null,
        message: message.trim(),
        wa_from: waFrom.trim() || null,
        status: 'new',
      });
      if (error) throw error;
      setStatus('success');
      setMessage('');
      setWaFrom('');
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to send inquiry');
      setStatus('error');
    }
  };

  return (
    <form className="mt-4 space-y-3" onSubmit={handleSubmit}>
      <div>
        <label className="block text-sm font-medium mb-1">{translations.messagePlaceholder}</label>
        <textarea
          className="w-full rounded border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-800"
          rows={3}
          value={message}
          onChange={e => setMessage(e.target.value)}
          required
        />
      </div>
      <div>
        <label className="block text-sm font-medium mb-1">{translations.waPlaceholder}</label>
        <input
          type="tel"
          className="w-full rounded border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-800"
          value={waFrom}
          onChange={e => setWaFrom(e.target.value)}
          placeholder="+1 234 567 8900"
        />
      </div>
      <button
        type="submit"
        className="w-full rounded bg-blue-600 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
        disabled={status === 'submitting' || !message.trim()}
      >
        {status === 'submitting' ? translations.submitting : translations.submit}
      </button>
      {status === 'success' && <p className="text-sm text-green-600">{translations.success}</p>}
      {status === 'error' && <p className="text-sm text-red-600">{errorMsg}</p>}
    </form>
  );
}