"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function LanguageSwitch({
  current,
}: {
  current: "es" | "en";
}) {
  const pathname = usePathname();

  // Build target path: if current is Spanish, switching to EN adds /en prefix.
  // If current is English, switching to ES removes /en prefix.
  const esHref = (() => {
    if (current === "es") return pathname;
    if (pathname.startsWith("/en")) {
      const rest = pathname.slice(3);
      return rest === "" ? "/" : rest;
    }
    return pathname;
  })();
  const enHref = (() => {
    if (current === "en") return pathname;
    if (pathname.startsWith("/en")) return pathname;
    if (pathname === "/") return "/en";
    return `/en${pathname}`;
  })();

  return (
    <div className="flex items-center gap-2 text-xs">
      <Link
        className={
          current === "es"
            ? "font-semibold underline"
            : "text-zinc-600 hover:underline dark:text-zinc-400"
        }
        href={esHref}
      >
        ES
      </Link>
      <span className="text-zinc-400">|</span>
      <Link
        className={
          current === "en"
            ? "font-semibold underline"
            : "text-zinc-600 hover:underline dark:text-zinc-400"
        }
        href={enHref}
      >
        EN
      </Link>
    </div>
  );
}
