'use client';

import { useState, useEffect } from 'react';
import SiteHeader from "@/app/components/SiteHeader";
import MapSection from "@/app/components/MapSection";
import { es } from "@/app/i18n/es";
import { loadGuestState, saveGuestState } from "@/lib/guestState";
import Footer from "@/app/components/Footer";

export default function Home() {
  const guestState = loadGuestState();
  const [center, setCenter] = useState<[number, number] | null>(
    guestState.mapCenter ? [guestState.mapCenter.lat, guestState.mapCenter.lng] : null
  );

  return (
    <>
      <SiteHeader locale="es" />
      <main className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-10">
        <MapSection locale="es" basePath="" center={center} onCenterChange={setCenter} />
      </main>
      <Footer locale="es" />
    </>
  );
}