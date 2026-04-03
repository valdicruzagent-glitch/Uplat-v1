'use client';

import { useState } from 'react';

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
  const thumbCount = 5;

  if (!images.length) return null;

  return (
    <div className="flex flex-col gap-2">
      {/* Main image */}
      <img
        src={selected.image_url}
        alt=""
        className="h-[30rem] w-full rounded-2xl object-cover md:h-[38rem]"
      />
      {/* Thumbnails */}
      <div className="flex gap-3 overflow-x-auto py-2">
        {images.slice(0, thumbCount).map((img, idx) => (
          <button
            key={img.id ?? idx}
            type="button"
            onClick={() => setSelectedIdx(idx)}
            className={`h-24 w-20 flex-shrink-0 overflow-hidden rounded-xl md:h-28 md:w-24 ${
              selectedIdx === idx
                ? 'ring-2 ring-blue-600'
                : 'opacity-70 hover:opacity-100'
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
