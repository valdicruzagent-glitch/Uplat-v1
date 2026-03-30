'use client';

import { useEffect } from "react";
import L from "leaflet";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";

export default function ListingMap({
  lat,
  lng,
  title,
  price
}: {
  lat: number;
  lng: number;
  title: string;
  price: string | number;
}) {
  // Fix default marker icon in Next.js
  useEffect(() => {
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
    <div className="h-48 w-full rounded-xl overflow-hidden border border-zinc-200 dark:border-zinc-800">
      <MapContainer
        center={[lat, lng]}
        zoom={15}
        scrollWheelZoom={false}
        style={{ height: "100%", width: "100%" }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <Marker position={[lat, lng]}>
          <Popup>
            <div>
              <div className="font-semibold">{title}</div>
              <div>{typeof price === 'number' ? `$${price.toLocaleString()}` : price}</div>
            </div>
          </Popup>
        </Marker>
      </MapContainer>
    </div>
  );
}
