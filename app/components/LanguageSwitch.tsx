import Link from "next/link";

export default function LanguageSwitch({
  current,
}: {
  current: "es" | "en";
}) {
  return (
    <div className="flex items-center gap-2 text-xs">
      <Link
        className={
          current === "es"
            ? "font-semibold underline"
            : "text-zinc-600 hover:underline dark:text-zinc-400"
        }
        href="/"
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
        href="/en"
      >
        EN
      </Link>
    </div>
  );
}
