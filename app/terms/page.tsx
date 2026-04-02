import SiteHeader from "@/app/components/SiteHeader";
import { es } from "@/app/i18n/es";
import { en } from "@/app/i18n/en";
import Footer from "@/app/components/Footer";
import Link from "next/link";

export default function TermsPage() {
  const t = es; // Todo en español por ahora
  return (
    <>
      <SiteHeader locale="es" />
      <main className="mx-auto max-w-3xl px-4 py-12">
        <h1 className="text-2xl font-bold mb-6">{t.termsTitle}</h1>
        <div className="prose dark:prose-invert max-w-none text-sm leading-relaxed whitespace-pre-wrap">
          {es.termsES}
        </div>
        <div className="mt-8">
          <Link href="/" className="text-blue-600 hover:underline">{t.back}</Link>
        </div>
      </main>
      <Footer locale="es" />
    </>
  );
}