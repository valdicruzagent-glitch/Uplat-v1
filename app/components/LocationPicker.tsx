"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { MapContainer, TileLayer, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";

// Fix Leaflet default icons
import L from "leaflet";
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  tooltipAnchor: [16, -28],
  shadowSize: [41, 41]
});

const DEFAULT_CENTER: [number, number] = [12.1364, -86.2514]; // Managua

interface LocationPickerProps {
  initialCenter?: [number, number] | null;
  onChange: (lat: number, lng: number) => void;
}

function CenterUpdater({ center }: { center?: [number, number] }) {
  const map = useMap();
  useEffect(() => {
    if (center) {
      map.setView(center, map.getZoom());
    }
  }, [center, map]);
  return null;
}

function MoveListener({ onChange }: { onChange: (lat: number, lng: number) => void }) {
  const map = useMap();
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const onMove = () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      timeoutRef.current = setTimeout(() => {
        const c = map.getCenter();
        onChange(c.lat, c.lng);
      }, 200); // debounce 200ms
    };
    map.on("moveend", onMove);
    // Initial call to set initial coordinates
    onMove();
    return () => {
      map.off("moveend", onMove);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [map, onChange]);
  return null;
}

export default function LocationPicker({ initialCenter, onChange }: LocationPickerProps) {
  const [center, setCenter] = useState<[number, number]>(initialCenter ?? DEFAULT_CENTER);

  useEffect(() => {
    if (initialCenter) {
      setCenter(initialCenter);
    }
  }, [initialCenter]);

  const handleMove = (lat: number, lng: number) => {
    setCenter([lat, lng]);
    onChange(lat, lng);
  };

  return (
    <div className="relative h-[420px] w-full overflow-hidden rounded-xl border border-zinc-200 bg-zinc-100 dark:border-zinc-800 dark:bg-zinc-950">
      <MapContainer
        center={center}
        zoom={6}
        scrollWheelZoom={true}
        style={{ height: "100%", width: "100%" }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <CenterUpdater center={center} />
        <MoveListener onChange={handleMove} />
        {/* Fixed pin in the center */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none" style={{ zIndex: 1000 }}>
          <svg width="32" height="40" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" fill="#ef4444" stroke="#fff" strokeWidth="2" />
            <circle cx="12" cy="9" r="3" fill="#fff" />
          </svg>
        </div>
      </MapContainer>
      <div className="absolute bottom-3 left-3 bg-white/90 dark:bg-zinc-900/90 px-2 py-1 text-xs rounded shadow">
        {center[0].toFixed(5)}, {center[1].toFixed(5)}
      </div>
    </div>
  );
}
