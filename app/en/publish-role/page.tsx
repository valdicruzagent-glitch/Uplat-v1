import LanguageSwitch from "@/app/components/LanguageSwitch";
import { en } from "@/app/i18n/en";
import PublishRoleChoice from "@/app/publish-role/publishRoleChoice";

export default function PublishRolePageEn() {
  return (
    <main className="min-h-dvh bg-zinc-50 px-6 py-10 text-zinc-900 dark:bg-black dark:text-zinc-50">
      <div className="mx-auto flex max-w-xl flex-col gap-4">
        <header className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">{en.publishRoleTitle}</h1>
            <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">{en.publishRoleSubtitle}</p>
          </div>
          <LanguageSwitch current="en" />
        </header>

        <PublishRoleChoice locale="en" />
      </div>
    </main>
  );
}
