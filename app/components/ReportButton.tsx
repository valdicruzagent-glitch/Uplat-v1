'use client';

import { useState } from 'react';
import { getSupabaseClient } from '@/lib/supabaseClient';

export default function ReportButton({ listingId }: { listingId: string }) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState<string>('spam');
  const [details, setDetails] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const supabase = getSupabaseClient();

  const handleSubmit = async () => {
    setLoading(true);
    const { data: { user } = await supabase.auth.getUser();
    if (!user) {
      alert('Debes iniciar sesión para reportar');
      setLoading(false);
      return;
    }

    const { error } = await supabase.from('listing_reports').insert({
      listing_id: listingId,
      reported_by: user.id,
      reason,
      details: details || null,
    });

    setLoading(false);
    if (!error) {
      setSubmitted(true);
      setTimeout(() => setOpen(false), 2000);
    } else {
      console.error('Report error:', error);
      alert('Error al enviar reporte: ' + error.message);
    }
  };

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="rounded border border-red-500 bg-red-50 px-3 py-1 text-red-700 hover:bg-red-100"
      >
        Reportar
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="max-w-md rounded-lg bg-white p-6 shadow-lg">
            <h3 className="mb-4 text-lg font-semibold">Reportar propiedad</h3>
            <div className="mb-4">
              <label className="mb-1 block text-sm font-medium">Razón</label>
              <select
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="w-full rounded border p-2"
              >
                <option value="spam">Spam</option>
                <option value="fraud">Fraude</option>
                <option value="inappropriate">Contenido inapropiado</option>
                <option value="other">Otro</option>
              </select>
            </div>
            <div className="mb-4">
              <label className="mb-1 block text-sm font-medium">Detalles (opcional)</label>
              <textarea
                value={details}
                onChange={(e) => setDetails(e.target.value)}
                className="w-full rounded border p-2"
                rows={3}
                placeholder="Describe el problema..."
              />
            </div>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setOpen(false)}
                disabled={loading}
                className="rounded border px-3 py-1"
              >
                Cancelar
              </button>
              <button
                onClick={handleSubmit}
                disabled={loading || submitted}
                className="rounded bg-red-600 px-3 py-1 text-white disabled:opacity-50"
              >
                {loading ? 'Enviando...' : 'Enviar reporte'}
              </button>
            </div>
            {submitted && <p className="mt-2 text-green-600">¡Gracias por reportar!</p>}
          </div>
        </div>
      )}
    </>
  );
}
