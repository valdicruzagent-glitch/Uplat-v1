import SiteHeader from "@/app/components/SiteHeader";
import { es } from "@/app/i18n/es";
import Footer from "@/app/components/Footer";
import Link from "next/link";

export default function PrivacyPage() {
  return (
    <>
      <SiteHeader locale="es" />
      <main className="mx-auto max-w-3xl px-4 py-12">
        <h1 className="text-2xl font-bold mb-6">Política de Privacidad</h1>
        <p className="mb-4">Esta página está en construcción. Estamos preparando una política de privacidad completa que describa cómo manejamos tus datos.</p>
        <p className="mb-4">Por ahora, solo recopilamos la información necesaria para operar el servicio (listados, consultas, etc.) y no compartimos tus datos con terceros sin tu consentimiento.</p>
        <div className="mt-8">
          <Link href="/" className="text-blue-600 hover:underline">{es.back}</Link>
        </div>
      </main>
      <Footer locale="es" />
    </>
  );
}
