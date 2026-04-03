'use client';

import { useMemo, useState } from 'react';

interface Image {
  image_url: string;
  id?: string;
  [key: string]: any;
}

export default function ImageGallery({
  images,
  initialIndex = 0,
}: {
  images: Image[];
  initialIndex?: number;
}) {
  const [selectedIdx, setSelectedIdx] = useState(initialIndex);
  const selected = images[selectedIdx];
  const thumbCount = 6;

  const orderedThumbs = useMemo(() => {
    if (images.length <= thumbCount) return images.map((img, idx) => ({ img, idx }));
    return images.slice(0, thumbCount).map((img, idx) => ({ img, idx }));
  }, [images]);

  if (!images.length) return null;

  const goPrev = () => setSelectedIdx((prev) => (prev === 0 ? images.length - 1 : prev - 1));
  const goNext = () => setSelectedIdx((prev) => (prev === images.length - 1 ? 0 : prev + 1));

  return (
    <div className="flex flex-col gap-3">
      <div className="relative overflow-hidden rounded-2xl bg-zinc-100 dark:bg-zinc-900">
        <div className="aspect-video w-full">
          <img
            src={selected.image_url}
            alt=""
            className="h-full w-full object-cover"
          />
        </div>

        {images.length > 1 && (
          <>
            <button
              type="button"
              onClick={goPrev}
              className="absolute left-3 top-1/2 z-10 -translate-y-1/2 rounded-full bg-black/55 px-3 py-2 text-white backdrop-blur hover:bg-black/70"
              aria-label="Foto anterior"
            >
              ←
            </button>
            <button
              type="button"
              onClick={goNext}
              className="absolute right-3 top-1/2 z-10 -translate-y-1/2 rounded-full bg-black/55 px-3 py-2 text-white backdrop-blur hover:bg-black/70"
              aria-label="Siguiente foto"
            >
              →
            </button>
            <div className="absolute bottom-3 right-3 rounded-full bg-black/60 px-3 py-1 text-xs font-medium text-white">
              {selectedIdx + 1} / {images.length}
            </div>
          </>
        )}
      </div>

      <div className="flex gap-3 overflow-x-auto py-1">
        {orderedThumbs.map(({ img, idx }) => (
          <button
            key={img.id ?? idx}
            type="button"
            onClick={() => setSelectedIdx(idx)}
            className={`aspect-video w-28 flex-shrink-0 overflow-hidden rounded-xl border ${
              selectedIdx === idx
                ? 'border-zinc-900 ring-2 ring-zinc-900/20 dark:border-white dark:ring-white/20'
                : 'border-transparent opacity-70 hover:opacity-100'
            }`}
          >
            <img
              src={img.image_url}
              alt=""
              className="h-full w-full object-cover"
            />
          </button>
        ))}
      </div>
    </div>
  );
}
