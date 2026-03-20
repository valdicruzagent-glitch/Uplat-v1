import MapSection from "@/app/components/MapSection";

export default function Home() {
  return (
    <div className="min-h-dvh bg-zinc-50 text-zinc-900 dark:bg-black dark:text-zinc-50">
      <main className="mx-auto flex max-w-4xl flex-col gap-6 px-6 py-10">
        <header className="flex flex-col gap-1">
          <h1 className="text-2xl font-semibold tracking-tight">Uplat V1</h1>
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            Next.js (App Router), TypeScript, Tailwind, Leaflet smoke test.
          </p>
        </header>

        <MapSection />
      </main>
    </div>
  );
}
