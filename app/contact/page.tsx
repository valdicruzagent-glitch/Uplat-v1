import SiteHeader from "@/app/components/SiteHeader";
import { es } from "@/app/i18n/es";
import Footer from "@/app/components/Footer";
import Link from "next/link";

export default function ContactPage() {
  const supportEmail = "support@tualero.com";
  return (
    <>
      <SiteHeader locale="es" />
      <main className="mx-auto max-w-2xl px-4 py-12">
        <h1 className="text-2xl font-bold mb-6">{es.helpTitle ?? "Contacto"}</h1>
        <p className="mb-4">{es.helpText ?? "¿Necesitas ayuda? Escríbenos a:"}</p>
        <a href={`mailto:${supportEmail}`} className="text-blue-600 hover:underline text-lg">{supportEmail}</a>
        <div className="mt-8">
          <Link href="/" className="text-blue-600 hover:underline">{es.back}</Link>
        </div>
      </main>
      <Footer locale="es" />
    </>;
  );
}
