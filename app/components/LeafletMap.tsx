"use client";

import { useEffect } from "react";
import L from "leaflet";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";

import "leaflet/dist/leaflet.css";

// Fix default marker icon paths when bundling (Next/Webpack).
// See: https://github.com/Leaflet/Leaflet/issues/4968
const DEFAULT_CENTER: [number, number] = [44.9778, -93.265]; // Minneapolis-ish (smoke test)

export default function LeafletMap() {
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
        center={DEFAULT_CENTER}
        zoom={12}
        scrollWheelZoom={false}
        style={{ height: "100%", width: "100%" }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <Marker position={DEFAULT_CENTER}>
          <Popup>Uplat V1 smoke test map is working.</Popup>
        </Marker>
      </MapContainer>
    </div>
  );
}
