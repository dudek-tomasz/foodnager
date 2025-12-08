/**
 * Unit Conversion Utilities
 * Obsługuje automatyczną konwersję jednostek oraz identyfikację przypadków wymagających ręcznej konwersji
 */

// =============================================================================
// CONVERSION DEFINITIONS
// =============================================================================

/**
 * Definicja konwersji - jednostka bazowa i mnożnik do niej
 */
interface UnitConversion {
  baseUnit: string; // Jednostka bazowa (np. 'g' dla wagi)
  multiplier: number; // Mnożnik do jednostki bazowej
}

/**
 * Mapa konwersji dla najpopularniejszych jednostek
 * Klucz to nazwa lub skrót jednostki (z bazy danych)
 */
const UNIT_CONVERSIONS: Record<string, UnitConversion> = {
  // Waga - baza: gram (g)
  mg: { baseUnit: "g", multiplier: 0.001 },
  miligram: { baseUnit: "g", multiplier: 0.001 },
  g: { baseUnit: "g", multiplier: 1 },
  gram: { baseUnit: "g", multiplier: 1 },
  kg: { baseUnit: "g", multiplier: 1000 },
  kilogram: { baseUnit: "g", multiplier: 1000 },

  // Objętość - baza: mililitr (ml)
  ml: { baseUnit: "ml", multiplier: 1 },
  mililitr: { baseUnit: "ml", multiplier: 1 },
  l: { baseUnit: "ml", multiplier: 1000 },
  litr: { baseUnit: "ml", multiplier: 1000 },

  // Długość - baza: centymetr (cm)
  cm: { baseUnit: "cm", multiplier: 1 },
  centymetr: { baseUnit: "cm", multiplier: 1 },
  m: { baseUnit: "cm", multiplier: 100 },
  metr: { baseUnit: "cm", multiplier: 100 },
  mm: { baseUnit: "cm", multiplier: 0.1 },
  milimetr: { baseUnit: "cm", multiplier: 0.1 },
};

/**
 * Jednostki, które wymagają ręcznej konwersji (niekompatybilne z automatyczną)
 * Te jednostki nie mają precyzyjnych konwersji metrycznych
 */
const MANUAL_CONVERSION_UNITS = new Set([
  "łyżka",
  "łyż",
  "łyżeczka",
  "łyżecz",
  "szklanka",
  "szkl",
  "garść",
  "szczypta",
  "szcz",
  "do smaku",
  "d.s.",
  "sztuka",
  "szt",
  "opakowanie",
  "opak",
  "pęczek",
  "pęcz",
  "plaster",
  "plast",
  "ząbek",
  "ząb",
  "główka",
  "głów",
]);

// =============================================================================
// CONVERSION LOGIC
// =============================================================================

/**
 * Sprawdza czy jednostka jest konwertowalna automatycznie
 */
export function isUnitConvertible(unitNameOrAbbr: string): boolean {
  return unitNameOrAbbr.toLowerCase() in UNIT_CONVERSIONS;
}

/**
 * Sprawdza czy jednostka wymaga ręcznej konwersji
 */
export function requiresManualConversion(unitNameOrAbbr: string): boolean {
  return MANUAL_CONVERSION_UNITS.has(unitNameOrAbbr.toLowerCase());
}

/**
 * Konwertuje ilość z jednej jednostki do drugiej (jeśli możliwe)
 * @returns null jeśli konwersja niemożliwa, liczbę jeśli konwersja udana
 */
export function convertQuantity(quantity: number, fromUnit: string, toUnit: string): number | null {
  const fromLower = fromUnit.toLowerCase();
  const toLower = toUnit.toLowerCase();

  // Jeśli jednostki są takie same, zwróć quantity
  if (fromLower === toLower) {
    return quantity;
  }

  // Sprawdź czy obie jednostki są konwertowalne
  const fromConversion = UNIT_CONVERSIONS[fromLower];
  const toConversion = UNIT_CONVERSIONS[toLower];

  if (!fromConversion || !toConversion) {
    return null; // Jedna z jednostek nie jest konwertowalna
  }

  // Sprawdź czy jednostki mają tę samą jednostkę bazową (są kompatybilne)
  if (fromConversion.baseUnit !== toConversion.baseUnit) {
    return null; // Różne typy jednostek (np. waga vs objętość)
  }

  // Konwertuj: quantity * mnożnik_from / mnożnik_to
  const result = (quantity * fromConversion.multiplier) / toConversion.multiplier;

  return result;
}

// =============================================================================
// AVAILABILITY CHECKING WITH CONVERSION
// =============================================================================

export interface ConversionResult {
  /** Czy składniki są kompatybilne (można automatycznie porównać) */
  compatible: boolean;
  /** Czy wymaga ręcznej konwersji przez użytkownika */
  requiresManual: boolean;
  /** Ilość dostępna w jednostce wymaganej (po konwersji) - tylko jeśli compatible=true */
  availableInRequiredUnit: number | null;
  /** Oryginalnie dostępna ilość */
  originalAvailable: number;
  /** Jednostka w lodówce */
  fridgeUnit: string;
  /** Wymagana ilość */
  requiredQuantity: number;
  /** Jednostka wymagana */
  requiredUnit: string;
}

/**
 * Porównuje dostępność składnika z uwzględnieniem konwersji jednostek
 */
export function checkAvailabilityWithConversion(
  requiredQuantity: number,
  requiredUnit: string,
  availableQuantity: number,
  availableUnit: string
): ConversionResult {
  const reqLower = requiredUnit.toLowerCase();
  const availLower = availableUnit.toLowerCase();

  // Przypadek 1: Dokładnie ta sama jednostka
  if (reqLower === availLower) {
    return {
      compatible: true,
      requiresManual: false,
      availableInRequiredUnit: availableQuantity,
      originalAvailable: availableQuantity,
      fridgeUnit: availableUnit,
      requiredQuantity,
      requiredUnit,
    };
  }

  // Przypadek 2: Jedna lub obie jednostki wymagają ręcznej konwersji
  if (requiresManualConversion(reqLower) || requiresManualConversion(availLower)) {
    return {
      compatible: false,
      requiresManual: true,
      availableInRequiredUnit: null,
      originalAvailable: availableQuantity,
      fridgeUnit: availableUnit,
      requiredQuantity,
      requiredUnit,
    };
  }

  // Przypadek 3: Próba automatycznej konwersji
  const converted = convertQuantity(availableQuantity, availableUnit, requiredUnit);

  if (converted === null) {
    // Konwersja niemożliwa (różne typy jednostek lub nieznane jednostki)
    return {
      compatible: false,
      requiresManual: true,
      availableInRequiredUnit: null,
      originalAvailable: availableQuantity,
      fridgeUnit: availableUnit,
      requiredQuantity,
      requiredUnit,
    };
  }

  // Konwersja udana
  return {
    compatible: true,
    requiresManual: false,
    availableInRequiredUnit: converted,
    originalAvailable: availableQuantity,
    fridgeUnit: availableUnit,
    requiredQuantity,
    requiredUnit,
  };
}
