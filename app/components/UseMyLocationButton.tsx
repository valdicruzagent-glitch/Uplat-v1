"use client";

export default function UseMyLocationButton({
  onLocation,
  label,
}: {
  onLocation: (lat: number, lng: number) => void;
  label: string;
}) {
  return (
    <button
      className="rounded-md border border-zinc-200 bg-white px-2 py-1 text-sm hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-950 dark:hover:bg-zinc-900"
      onClick={() => {
        if (!navigator.geolocation) {
          alert("Geolocation not supported");
          return;
        }
        navigator.geolocation.getCurrentPosition(
          (pos) => {
            onLocation(pos.coords.latitude, pos.coords.longitude);
          },
          (err) => {
            alert(err.message);
          },
          { enableHighAccuracy: false, timeout: 8000 }
        );
      }}
    >
      {label}
    </button>
  );
}
