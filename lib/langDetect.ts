export type DetectedLanguage = "en" | "es";

// Minimal heuristic for V1: avoid extra dependencies.
export function detectLanguage(text: string | null | undefined): DetectedLanguage {
  const t = (text || "").toLowerCase();
  if (!t.trim()) return "en";

  // Strong Spanish signals
  if (/[¿¡ñáéíóúü]/i.test(t)) return "es";

  const spanishHits = [
    "hola",
    "buenos",
    "buenas",
    "gracias",
    "por favor",
    "necesito",
    "quiero",
    "renta",
    "alquiler",
    "cuarto",
    "apartamento",
    "casa",
    "precio",
    "cuanto",
    "cuánto",
    "donde",
    "dónde",
  ];

  for (const w of spanishHits) {
    if (t.includes(w)) return "es";
  }

  return "en";
}
