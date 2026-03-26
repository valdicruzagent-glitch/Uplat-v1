"use client";

import { useEffect, useMemo } from "react";
import Link from "next/link";
import L from "leaflet";
import { MapContainer, TileLayer, Marker, Popup, useMapEvents } from "react-leaflet";
import MarkerClusterGroup from "@/app/components/MarkerClusterGroup";

import "leaflet/dist/leaflet.css";
import type { Listing } from "@/app/types/listing";

const DEFAULT_CENTER: [number, number] = [12.1364, -86.2514]; // Managua-ish

function BoundsWatcher({ onBoundsChange, onZoomChange }: { onBoundsChange: (b: L.LatLngBounds) => void; onZoomChange?: (zoom: number) => void }) {
  useMapEvents({
    moveend: (e) => onBoundsChange(e.target.getBounds()),
    zoomend: (e) => {
      onBoundsChange(e.target.getBounds());
      if (onZoomChange) onZoomChange(e.target.getZoom());
    },
    load: (e) => onBoundsChange(e.target.getBounds()),
  });
  return null;
}

export type LeafletMapProps = {
  activeListings: Listing[];
  compListings: Listing[];
  showComps: boolean;
  center?: [number, number];
  basePath: "" | "/en";
  openLabel: string;
  onBoundsChange: (b: L.LatLngBounds) => void;
  onZoomChange?: (zoom: number) => void;
  visibleCount?: number;
  onMarkerHover?: (id: string | null) => void;
};

export default function LeafletMap(props: LeafletMapProps) {
  const {
    activeListings,
    compListings,
    showComps,
    center,
    basePath,
    openLabel,
    onBoundsChange,
    onZoomChange,
    visibleCount,
    onMarkerHover,
  } = props;
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

  const compIcon = useMemo(
    () =>
      L.divIcon({
        className: "uplat-comp-marker",
        html: "<div class=\"uplat-comp-marker__dot\" />",
        iconSize: [16, 16],
        iconAnchor: [8, 8],
      }),
    []
  );

  const showPriceLabels = visibleCount !== undefined ? visibleCount <= 30 : true;

  const priceLabelIcon = useMemo(() => {
    return L.divIcon({
      className: "uplat-price-marker",
      html: '<div class="uplat-price-marker__label"></div>',
      iconSize: [60, 24],
      iconAnchor: [30, 12],
    });
  }, []);

  function formatCompactPrice(priceUsd: number): string {
    if (priceUsd < 1_000_000) {
      return `$${(priceUsd / 1_000).toFixed(0).replace(/\.0$/, '')}K`;
    }
    return `$${(priceUsd / 1_000_000).toFixed(1).replace(/\.0$/, '')}M`;
  }

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

        <BoundsWatcher onBoundsChange={onBoundsChange} />

        <MarkerClusterGroup
          // Zillow-like: cluster only actives, keep comps separate.
          showCoverageOnHover={false}
          spiderfyOnMaxZoom={true}
          removeOutsideVisibleBounds={true}
          maxClusterRadius={48}
        >
          {activeListings.map((l) => {
            const price = Number(l.price_usd ?? 0);
            const icon = showPriceLabels
              ? L.divIcon({
                  className: "uplat-price-marker",
                  html: `<div style="
                    background: white;
                    color: #111;
                    border-radius: 999px;
                    padding: 4px 10px;
                    font-size: 13px;
                    font-weight: 700;
                    box-shadow: 0 2px 8px rgba(0,0,0,0.15);
                    white-space: nowrap;
                    text-align: center;
                  ">${formatCompactPrice(price)}</div>`,
                  iconSize: [70, 28],
                  iconAnchor: [35, 14],
                })
              : undefined; // use default marker
            return (
              <Marker
                key={l.id}
                position={[l.lat, l.lng]}
                icon={icon}
                eventHandlers={{
                  click: () => { window.location.href = `${basePath}/listing/${l.id}`; },
                  mouseover: () => onMarkerHover?.(l.id),
                  mouseout: () => onMarkerHover?.(null),
                }}
              >
                <Popup>
                  <div className="font-semibold">{l.title}</div>
                  <div className="text-xs opacity-80">
                    ${price.toLocaleString()} • {l.city}
                  </div>
                  <Link className="text-xs underline" href={`${basePath}/listing/${l.id}`}>
                    {openLabel}
                  </Link>
                </Popup>
              </Marker>
            );
          })}
        </MarkerClusterGroup>

        {showComps
          ? compListings.map((l) => (
              <Marker key={`comp_${l.id}`} position={[l.lat, l.lng]} icon={compIcon}>
                <Popup>
                  <div className="font-semibold opacity-80">{l.title}</div>
                  <div className="text-xs opacity-70">
                    ${Number(l.price_usd ?? 0).toLocaleString()} • {l.city}
                  </div>
                </Popup>
              </Marker>
            ))
          : null}
      </MapContainer>
    </div>
  );
}
