"use client";

import Link from "next/link";
import { en } from "@/app/i18n/en";
import { es } from "@/app/i18n/es";

export default function StartChoice({ locale }: { locale: "es" | "en" }) {
  const t = locale === "en" ? en : es;
  const basePath = locale === "en" ? "/en" : "";

  return (
    <div className="grid gap-3">
      <Link
        href={basePath + "/"}
        className="rounded-xl border border-zinc-200 bg-white p-4 text-left hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-950 dark:hover:bg-zinc-900"
      >
        <div className="text-base font-semibold">{t.startBrowseTitle}</div>
        <div className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">{t.startBrowseSubtitle}</div>
      </Link>

      <Link
        href={basePath + "/publish-role"}
        className="rounded-xl border border-zinc-200 bg-white p-4 text-left hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-950 dark:hover:bg-zinc-900"
      >
        <div className="text-base font-semibold">{t.startPublishTitle}</div>
        <div className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">{t.startPublishSubtitle}</div>
      </Link>
    </div>
  );
}
