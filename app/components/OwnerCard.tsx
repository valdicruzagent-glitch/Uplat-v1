'use client';

import { useEffect, useState } from 'react';

interface OwnerCardProps {
  owner: {
    id: string;
    full_name: string;
    role?: string;
    avatar_url?: string | null;
    phone?: string | null;
    whatsapp_number?: string | null;
    agency?: { name: string; country?: string; department?: string; city?: string } | null;
  };
  listingTitle: string;
  listingCity: string;
  priceText: string;
  listingWhatsapp?: string;
  currentUserId?: string; // ID del usuario viendo la página
}

export default function OwnerCard({ owner, listingTitle, listingCity, priceText, listingWhatsapp, currentUserId }: OwnerCardProps) {
  const [ratingStats, setRatingStats] = useState<{ average: number; count: number }>({ average: 0, count: 0 });
  const [myRating, setMyRating] = useState<number | null>(null);
  const [rateModalOpen, setRateModalOpen] = useState(false);
  const [hoverRating, setHoverRating] = useState<number | null>(null);

  const isRealtorOrAgency = owner.role === 'realtor' || owner.role === 'agency';

  useEffect(() => {
    if (!owner.id) return;
    fetch('/api/ratings?to_profile_id=' + owner.id + (currentUserId ? '&from_profile_id=' + currentUserId : ''))
      .then(r => r.json())
      .then(data => {
        setRatingStats({ average: data.average || 0, count: data.count || 0 });
        setMyRating(data.my_rating);
      })
      .catch(err => console.error('Failed to load ratings', err));
  }, [owner.id, currentUserId]);

  const submitRating = async (value: number) => {
    const resp = await fetch('/api/ratings', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-profile-id': currentUserId || '',
      },
      body: JSON.stringify({ to_profile_id: owner.id, rating: value }),
    });
    if (resp.ok) {
      setMyRating(value);
      // Recalcular promedio localmente (simple)
      const newCount = ratingStats.count + (myRating ? 0 : 1);
      const newSum = (ratingStats.average * ratingStats.count) + value - (myRating || 0);
      setRatingStats({ average: newSum / newCount, count: newCount });
      setRateModalOpen(false);
    }
  };

  const removeRating = async () => {
    const resp = await fetch('/api/ratings?to_profile_id=' + owner.id, {
      method: 'DELETE',
      headers: {
        'x-profile-id': currentUserId || '',
      },
    });
    if (resp.ok) {
      setMyRating(null);
      const newSum = ratingStats.average * ratingStats.count - myRating!;
      const newCount = ratingStats.count - 1;
      setRatingStats({ average: newCount > 0 ? newSum / newCount : 0, count: newCount });
    }
  };

  const contactWhatsapp = owner.whatsapp_number || listingWhatsapp || "505XXXXXXXX";
  const msg = encodeURIComponent(`Hola, estoy interesado en: ${listingTitle} en ${listingCity}. Precio: ${priceText}.`);
  const wa = `https://wa.me/${contactWhatsapp.replace(/\D/g, "")}?text=${msg}`;

  const stars = Array.from({ length: 10 }, (_, i) => i + 1);
  const displayRating = hoverRating !== null ? hoverRating : myRating ?? ratingStats.average;

  return (
    <div className="rounded-lg border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
      <div className="flex items-center gap-3">
        {owner.avatar_url ? (
          <img src={owner.avatar_url} alt={owner.full_name} className="h-10 w-10 rounded-full object-cover" />
        ) : (
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-zinc-200 text-sm font-bold dark:bg-zinc-800">
            {owner.full_name?.charAt(0).toUpperCase() || '?'}
          </div>
        )}
        <div>
          <div className="font-semibold text-zinc-900 dark:text-zinc-100">{owner.full_name}</div>
          <div className="text-xs text-zinc-600 dark:text-zinc-400">
            {owner.role === 'agency' ? 'Agencia' : owner.role === 'realtor' ? 'Agente' : 'Propietario'}
            {owner.agency?.name && ` • ${owner.agency.name}`}
          </div>
          {/* Rating stars */}
          {isRealtorOrAgency && (
            <div className="mt-1 flex items-center gap-1">
              <div className="flex text-yellow-500">
                {stars.map(star => (
                  <span key={star} className={star <= Math.round(displayRating) ? 'opacity-100' : 'opacity-20'}>
                    ★
                  </span>
                ))}
              </div>
              <span className="text-xs text-zinc-600 dark:text-zinc-400">
                ({ratingStats.count})
              </span>
              {currentUserId && currentUserId !== owner.id && (
                <button
                  className="ml-2 text-xs underline text-blue-600 dark:text-blue-400"
                  onClick={() => setRateModalOpen(true)}
                >
                  {myRating ? 'Cambiar' : 'Ratear'}
                </button>
              )}
            </div>
          )}
        </div>
      </div>
      <div className="mt-3">
        <a href={wa} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 rounded-md bg-green-600 px-3 py-2 text-sm font-medium text-white hover:bg-green-700">
          <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24"><path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-1.609 5.8zm5.973-14.04c-.247-.074-.502-.151-.77-.235-2.486-1.008-4.356-2.652-5.209-4.617-.352-.82-.561-1.698-.561-2.613 0-2.311 1.771-4.181 4.189-4.181 1.418 0 2.682.675 3.48 1.748.8 1.073.987 2.464.567 3.801-.075.236-.241.462-.471.656l2.751 3.42c.11.136.254.204.391.207.138.004.28-.056.391-.208l5.88-7.327c.227-.282.36-.65.36-1.043 0-.396-.133-.765-.358-1.061l-5.557-6.92c-.226-.281-.549-.438-.886-.438-.332 0-.654.15-.869.438z"/></svg>
          Contactar por WhatsApp
        </a>
      </div>

      {/* Rating modal */}
      {rateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setRateModalOpen(false)}>
          <div className="bg-white dark:bg-zinc-900 rounded-lg shadow-xl p-6 max-w-sm w-full" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-semibold mb-4">Calificar a {owner.full_name}</h3>
            <div className="flex justify-center gap-1 mb-4">
              {stars.map(star => (
                <button
                  key={star}
                  className={`text-3xl transition-colors ${star <= (hoverRating || myRating || 0) ? 'text-yellow-500' : 'text-zinc-300'}`}
                  onMouseEnter={() => setHoverRating(star)}
                  onMouseLeave={() => setHoverRating(null)}
                  onClick={() => submitRating(star)}
                >
                  ★
                </button>
              ))}
            </div>
            <p className="text-center text-sm text-zinc-600 dark:text-zinc-400 mb-4">
              {myRating ? `Tu rating actual: ${myRating}/10` : 'Selecciona estrellas (1-10)'}
            </p>
            {myRating && (
              <button className="w-full rounded-md border border-zinc-300 dark:border-zinc-700 py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20" onClick={removeRating}>
                Eliminar mi rating
              </button>
            )}
            <button className="mt-3 w-full rounded-md bg-zinc-200 dark:bg-zinc-800 py-2 text-sm" onClick={() => setRateModalOpen(false)}>
              Cancelar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}