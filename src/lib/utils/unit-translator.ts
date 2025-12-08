/**
 * Unit Translator - Translate measurement units from English to Polish
 */

/**
 * Dictionary of English to Polish unit translations
 */
const ENGLISH_TO_POLISH_UNITS: Record<string, string> = {
  // Volume
  tablespoon: "łyżka stołowa",
  tablespoons: "łyżki stołowe",
  tbsp: "łyż. stoł.",
  tbs: "łyż. stoł.",
  teaspoon: "łyżeczka",
  teaspoons: "łyżeczki",
  tsp: "łyżeczka",
  cup: "szklanka",
  cups: "szklanki",
  milliliter: "mililitr",
  milliliters: "mililitry",
  ml: "ml",
  liter: "litr",
  liters: "litry",
  l: "l",
  "fluid ounce": "uncja płynu",
  "fluid ounces": "uncje płynu",
  "fl oz": "uncja",

  // Weight
  gram: "gram",
  grams: "gramy",
  g: "g",
  kilogram: "kilogram",
  kilograms: "kilogramy",
  kg: "kg",
  ounce: "uncja",
  ounces: "uncje",
  oz: "uncja",
  pound: "funt",
  pounds: "funty",
  lb: "funt",
  lbs: "funty",

  // Count
  piece: "sztuka",
  pieces: "sztuki",
  pc: "szt",
  pcs: "szt",
  item: "sztuka",
  items: "sztuki",
  unit: "sztuka",
  units: "sztuki",

  // Servings
  serving: "porcja",
  servings: "porcje",
  ser: "porcja",
  portion: "porcja",
  portions: "porcje",

  // Other
  pinch: "szczypta",
  pinches: "szczypty",
  dash: "szczypta",
  dashes: "szczypty",
  clove: "ząbek",
  cloves: "ząbki",
  head: "główka",
  heads: "główki",
  bunch: "pęczek",
  bunches: "pęczki",
  slice: "plasterek",
  slices: "plasterki",
  can: "puszka",
  cans: "puszki",
  package: "opakowanie",
  packages: "opakowania",

  // Size descriptors
  small: "mały",
  medium: "średni",
  med: "średni",
  large: "duży",
  "extra large": "bardzo duży",
};

/**
 * Translate unit from English to Polish
 *
 * @param englishUnit - English unit name
 * @returns Polish unit name (or original if no translation found)
 */
export function translateUnit(englishUnit: string): string {
  if (!englishUnit) {
    return englishUnit;
  }

  const normalized = englishUnit.toLowerCase().trim();

  // Direct match
  if (ENGLISH_TO_POLISH_UNITS[normalized]) {
    return ENGLISH_TO_POLISH_UNITS[normalized];
  }

  // Try without 's' at the end (plural to singular)
  if (normalized.endsWith("s")) {
    const singular = normalized.slice(0, -1);
    if (ENGLISH_TO_POLISH_UNITS[singular]) {
      return ENGLISH_TO_POLISH_UNITS[singular];
    }
  }

  // Return original if no translation
  return englishUnit;
}
