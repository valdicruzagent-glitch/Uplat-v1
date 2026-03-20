import LanguageSwitch from "@/app/components/LanguageSwitch";
import MapSection from "@/app/components/MapSection";
import { en } from "@/app/i18n/en";

export default function HomeEn() {
  return (
    <div className="min-h-dvh bg-zinc-50 text-zinc-900 dark:bg-black dark:text-zinc-50">
      <main className="mx-auto flex max-w-4xl flex-col gap-6 px-6 py-10">
        <header className="flex items-start justify-between gap-4">
          <div className="flex flex-col gap-1">
            <h1 className="text-2xl font-semibold tracking-tight">{en.title}</h1>
            <p className="text-sm text-zinc-600 dark:text-zinc-400">{en.subtitle}</p>
          </div>
          <LanguageSwitch current="en" />
        </header>

        <MapSection locale="en" basePath="/en" />
      </main>
    </div>
  );
}
