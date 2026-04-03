'use client';

import Link from 'next/link';

export default function OwnerListingActions({ listingId }: { listingId: string }) {
  return (
    <section className="rounded-2xl border border-blue-200 bg-blue-50 p-4 dark:border-blue-900/40 dark:bg-blue-950/20">
      <div className="text-sm font-semibold text-blue-900 dark:text-blue-100">Modo propietario</div>
      <div className="mt-1 text-sm text-blue-800 dark:text-blue-200">
        Estás viendo tu publicación. Desde aquí deberías poder editarla y revisar actividad.
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        <Link
          href={`/submit-listing?edit=${listingId}`}
          className="rounded-lg bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          Editar listing
        </Link>
        <span className="rounded-lg border border-blue-300 px-3 py-2 text-sm text-blue-900 dark:border-blue-800 dark:text-blue-100">
          Próximo: consultas, reportes y estadísticas
        </span>
      </div>
    </section>
  );
}
