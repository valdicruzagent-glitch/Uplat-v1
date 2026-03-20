"use client";

import { useEffect } from "react";
import Link from "next/link";
import L from "leaflet";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";

import "leaflet/dist/leaflet.css";
import type { Listing } from "@/app/types/listing";

const DEFAULT_CENTER: [number, number] = [12.1364, -86.2514]; // Managua-ish

export default function LeafletMap({
  listings,
  center,
}: {
  listings: Listing[];
  center?: [number, number];
}) {
  useEffect(() => {
    // Only run on client.
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const iconRetinaUrl = require("leaflet/dist/images/marker-icon-2x.png");
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const iconUrl = require("leaflet/dist/images/marker-icon.png");
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const shadowUrl = require("leaflet/dist/images/marker-shadow.png");

    L.Icon.Default.mergeOptions({
      iconRetinaUrl,
      iconUrl,
      shadowUrl,
    });
  }, []);

  return (
    <div className="h-[420px] w-full overflow-hidden rounded-xl border border-zinc-200 bg-zinc-100 dark:border-zinc-800 dark:bg-zinc-950">
      <MapContainer
        center={center ?? DEFAULT_CENTER}
        zoom={center ? 12 : 8}
        scrollWheelZoom={true}
        style={{ height: "100%", width: "100%" }}
        key={`${(center ?? DEFAULT_CENTER)[0]}_${(center ?? DEFAULT_CENTER)[1]}`}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {listings.map((l) => (
          <Marker key={l.id} position={[l.lat, l.lng]}>
            <Popup>
              <div className="font-semibold">{l.title}</div>
              <div className="text-xs opacity-80">
                ${Number(l.price_usd).toLocaleString()} • {l.city}
              </div>
              <Link className="text-xs underline" href={`/listing/${l.id}`}>
                Open
              </Link>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}
