export type Locale = 'es' | 'en';

const AMENITY_LABELS: Record<string, { es: string; en: string; emoji: string }> = {
  pool: { es: 'Piscina', en: 'Pool', emoji: '🏊' },
  ac: { es: 'Aire acondicionado', en: 'Air conditioning', emoji: '❄️' },
  security: { es: 'Seguridad', en: 'Security', emoji: '🛡️' },
  furnished: { es: 'Amueblado', en: 'Furnished', emoji: '🛋️' },
  terrace: { es: 'Terraza', en: 'Terrace', emoji: '🌇' },
  garden: { es: 'Jardín', en: 'Garden', emoji: '🌿' },
  parking: { es: 'Parqueo', en: 'Parking', emoji: '🚗' },
  internet: { es: 'Internet', en: 'Internet', emoji: '🌐' },
  wifi: { es: 'Wi-Fi', en: 'Wi-Fi', emoji: '📶' },
  balcony: { es: 'Balcón', en: 'Balcony', emoji: '🏙️' },
  elevator: { es: 'Elevador', en: 'Elevator', emoji: '🛗' },
  gym: { es: 'Gimnasio', en: 'Gym', emoji: '🏋️' },
  patio: { es: 'Patio', en: 'Patio', emoji: '🏡' },
  laundry: { es: 'Lavandería', en: 'Laundry', emoji: '🧺' },
  pet_friendly: { es: 'Pet friendly', en: 'Pet friendly', emoji: '🐾' },
  furnished_kitchen: { es: 'Cocina equipada', en: 'Equipped kitchen', emoji: '🍽️' },
};

function humanizeAmenityKey(key: string) {
  return key
    .replace(/[_-]+/g, ' ')
    .trim()
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

export function getAmenityLabel(key: string, locale: Locale = 'es') {
  const normalized = key.trim().toLowerCase();
  const translated = AMENITY_LABELS[normalized];
  if (translated) return translated[locale];
  return humanizeAmenityKey(normalized);
}

export function getAmenityDisplay(key: string, locale: Locale = 'es') {
  const normalized = key.trim().toLowerCase();
  const translated = AMENITY_LABELS[normalized];
  if (translated) {
    return { label: translated[locale], emoji: translated.emoji };
  }
  return { label: humanizeAmenityKey(normalized), emoji: '✨' };
}
