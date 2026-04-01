"use client";

import Link from "next/link";
import { es } from "@/app/i18n/es";
import { en } from "@/app/i18n/en";

export default function Footer({ locale }: { locale: "es" | "en" }) {
  const t = locale === "en" ? en : es;
  const currentYear = new Date().getFullYear();

  return (
    <footer className="border-t border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950">
      <div className="mx-auto max-w-7xl px-4 py-8">
        <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
          {/* Company */}
          <div>
            <h4 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 mb-3">Tualero</h4>
            <ul className="space-y-2 text-xs text-zinc-600 dark:text-zinc-400">
              <li><Link href="/agents" className="hover:text-blue-600 dark:hover:text-blue-400">{t.findAgent}</Link></li>
              <li><button onClick={() => window.location.href = locale==="en" ? "/en/submit-listing" : "/submit-listing"} className="hover:text-blue-600 dark:hover:text-blue-400">{t.sell}</button></li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h4 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 mb-3">{locale==="es" ? "Legal" : "Legal"}</h4>
            <ul className="space-y-2 text-xs text-zinc-600 dark:text-zinc-400">
              <li><Link href="/terms" className="hover:text-blue-600 dark:hover:text-blue-400">{locale==="es" ? "Términos de Uso" : "Terms of Use"}</Link></li>
              <li><Link href="/privacy" className="hover:text-blue-600 dark:hover:text-blue-400">{locale==="es" ? "Política de Privacidad" : "Privacy Policy"}</Link></li>
            </ul>
          </div>

          {/* Support */}
          <div>
            <h4 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 mb-3">{locale==="es" ? "Soporte" : "Support"}</h4>
            <ul className="space-y-2 text-xs text-zinc-600 dark:text-zinc-400">
              <li><Link href="/contact" className="hover:text-blue-600 dark:hover:text-blue-400">{locale==="es" ? "Contacto" : "Contact Us"}</Link></li>
              <li><button onClick={() => window.location.href = locale==="en" ? "/en/help" : "/help"} className="hover:text-blue-600 dark:hover:text-blue-400">{t.helpTitle ?? "Help"}</button></li>
            </ul>
          </div>

          {/* Brand */}
          <div>
            <h4 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 mb-3">Tualero</h4>
            <p className="text-xs text-zinc-600 dark:text-zinc-400">
              © {currentYear} Tualero. {locale==="es" ? "Todos los derechos reservados." : "All rights reserved."}
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
