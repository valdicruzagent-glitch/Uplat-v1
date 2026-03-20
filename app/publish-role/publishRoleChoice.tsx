"use client";

import Link from "next/link";
import { useEffect } from "react";
import { en } from "@/app/i18n/en";
import { es } from "@/app/i18n/es";

export default function PublishRoleChoice({ locale }: { locale: "es" | "en" }) {
  const t = locale === "en" ? en : es;
  const basePath = locale === "en" ? "/en" : "";

  useEffect(() => {
    // default intent for later routing/analytics
    window.localStorage.setItem("uplat_intent", "publish");
  }, []);

  function pick(role: "realtor" | "seller") {
    window.localStorage.setItem("uplat_publish_role", role);
  }

  return (
    <div className="grid gap-3">
      <Link
        href={basePath + "/submit-listing"}
        onClick={() => pick("realtor")}
        className="rounded-xl border border-zinc-200 bg-white p-4 text-left hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-950 dark:hover:bg-zinc-900"
      >
        <div className="text-base font-semibold">{t.publishRoleRealtorTitle}</div>
        <div className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">{t.publishRoleRealtorSubtitle}</div>
      </Link>

      <Link
        href={basePath + "/submit-listing"}
        onClick={() => pick("seller")}
        className="rounded-xl border border-zinc-200 bg-white p-4 text-left hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-950 dark:hover:bg-zinc-900"
      >
        <div className="text-base font-semibold">{t.publishRoleSellerTitle}</div>
        <div className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">{t.publishRoleSellerSubtitle}</div>
      </Link>

      <div className="text-xs text-zinc-600 dark:text-zinc-400">
        <Link className="underline" href={basePath + "/start"}>
          {locale === "en" ? "← Back" : "← Regresar"}
        </Link>
      </div>
    </div>
  );
}
