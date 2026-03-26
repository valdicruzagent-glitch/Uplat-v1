'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import LanguageSwitch from "@/app/components/LanguageSwitch";
import MapSection from "@/app/components/MapSection";
import UseMyLocationButton from "@/app/components/UseMyLocationButton";
import { en } from "@/app/i18n/en";
import { loadGuestState, saveGuestState } from "@/app/utils/guestStorage";

export default function HomeEn() {
  const t = en;
  const guestState = loadGuestState();
  const [center, setCenter] = useState<[number, number] | null>(
    guestState.mapCenter ? [guestState.mapCenter.lat, guestState.mapCenter.lng] : null
  );

  useEffect(() => {
    if (center) {
      saveGuestState({ mapCenter: { lat: center[0], lng: center[1] } });
    }
  }, [center]);

  return (
    <div className="min-h-dvh bg-zinc-50 text-zinc-900 dark:bg-black dark:text-zinc-50">
      <main className="mx-auto flex max-w-4xl flex-col gap-6 px-6 py-10">
        <header className="flex items-center justify-between gap-4">
          <div className="flex flex-col gap-1">
            <h1 className="text-2xl font-semibold tracking-tight">{t.title}</h1>
            <p className="text-sm text-zinc-600 dark:text-zinc-400">{t.subtitle}</p>
          </div>
          <div className="flex items-center gap-2">
            <UseMyLocationButton label={t.useMyLocation} onLocation={(lat, lng) => setCenter([lat, lng])} />
            <LanguageSwitch current="en" />
            <Link href="/signin" className="text-sm text-blue-600 hover:underline">{t.signInTitle}</Link>
          </div>
        </header>

        <MapSection locale="en" basePath="/en" center={center} onCenterChange={setCenter} />
      </main>
    </div>
  );
}
