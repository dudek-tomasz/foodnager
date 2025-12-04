import { describe, it, expect } from 'vitest';
import {
  isUnitConvertible,
  requiresManualConversion,
  convertQuantity,
  checkAvailabilityWithConversion,
  type ConversionResult,
} from './unit-conversion.utils';

// =============================================================================
// isUnitConvertible()
// =============================================================================

describe('isUnitConvertible', () => {
  describe('gdy jednostka jest konwertowalna', () => {
    it('zwraca true dla jednostek wagi (g, kg, mg)', () => {
      expect(isUnitConvertible('g')).toBe(true);
      expect(isUnitConvertible('kg')).toBe(true);
      expect(isUnitConvertible('mg')).toBe(true);
      expect(isUnitConvertible('gram')).toBe(true);
      expect(isUnitConvertible('kilogram')).toBe(true);
      expect(isUnitConvertible('miligram')).toBe(true);
    });

    it('zwraca true dla jednostek objętości (ml, l)', () => {
      expect(isUnitConvertible('ml')).toBe(true);
      expect(isUnitConvertible('l')).toBe(true);
      expect(isUnitConvertible('mililitr')).toBe(true);
      expect(isUnitConvertible('litr')).toBe(true);
    });

    it('zwraca true dla jednostek długości (cm, m, mm)', () => {
      expect(isUnitConvertible('cm')).toBe(true);
      expect(isUnitConvertible('m')).toBe(true);
      expect(isUnitConvertible('mm')).toBe(true);
      expect(isUnitConvertible('centymetr')).toBe(true);
      expect(isUnitConvertible('metr')).toBe(true);
      expect(isUnitConvertible('milimetr')).toBe(true);
    });

    it('jest case-insensitive', () => {
      expect(isUnitConvertible('G')).toBe(true);
      expect(isUnitConvertible('KG')).toBe(true);
      expect(isUnitConvertible('Ml')).toBe(true);
      expect(isUnitConvertible('GRAM')).toBe(true);
    });
  });

  describe('gdy jednostka nie jest konwertowalna', () => {
    it('zwraca false dla jednostek wymagających ręcznej konwersji', () => {
      expect(isUnitConvertible('łyżka')).toBe(false);
      expect(isUnitConvertible('szklanka')).toBe(false);
      expect(isUnitConvertible('sztuka')).toBe(false);
    });

    it('zwraca false dla nieznanych jednostek', () => {
      expect(isUnitConvertible('xyz')).toBe(false);
      expect(isUnitConvertible('unknown')).toBe(false);
      expect(isUnitConvertible('')).toBe(false);
    });
  });
});

// =============================================================================
// requiresManualConversion()
// =============================================================================

describe('requiresManualConversion', () => {
  describe('gdy jednostka wymaga ręcznej konwersji', () => {
    it('zwraca true dla łyżek i łyżeczek', () => {
      expect(requiresManualConversion('łyżka')).toBe(true);
      expect(requiresManualConversion('łyż')).toBe(true);
      expect(requiresManualConversion('łyżeczka')).toBe(true);
      expect(requiresManualConversion('łyżecz')).toBe(true);
    });

    it('zwraca true dla szklanek', () => {
      expect(requiresManualConversion('szklanka')).toBe(true);
      expect(requiresManualConversion('szkl')).toBe(true);
    });

    it('zwraca true dla jednostek opisowych', () => {
      expect(requiresManualConversion('garść')).toBe(true);
      expect(requiresManualConversion('szczypta')).toBe(true);
      expect(requiresManualConversion('szcz')).toBe(true);
      expect(requiresManualConversion('do smaku')).toBe(true);
      expect(requiresManualConversion('d.s.')).toBe(true);
    });

    it('zwraca true dla jednostek sztukowych', () => {
      expect(requiresManualConversion('sztuka')).toBe(true);
      expect(requiresManualConversion('szt')).toBe(true);
      expect(requiresManualConversion('opakowanie')).toBe(true);
      expect(requiresManualConversion('opak')).toBe(true);
      expect(requiresManualConversion('pęczek')).toBe(true);
      expect(requiresManualConversion('pęcz')).toBe(true);
    });

    it('zwraca true dla jednostek specyficznych dla warzyw', () => {
      expect(requiresManualConversion('plaster')).toBe(true);
      expect(requiresManualConversion('plast')).toBe(true);
      expect(requiresManualConversion('ząbek')).toBe(true);
      expect(requiresManualConversion('ząb')).toBe(true);
      expect(requiresManualConversion('główka')).toBe(true);
      expect(requiresManualConversion('głów')).toBe(true);
    });

    it('jest case-insensitive', () => {
      expect(requiresManualConversion('ŁYŻKA')).toBe(true);
      expect(requiresManualConversion('Szklanka')).toBe(true);
      expect(requiresManualConversion('SzT')).toBe(true);
    });
  });

  describe('gdy jednostka nie wymaga ręcznej konwersji', () => {
    it('zwraca false dla jednostek metrycznych', () => {
      expect(requiresManualConversion('g')).toBe(false);
      expect(requiresManualConversion('kg')).toBe(false);
      expect(requiresManualConversion('ml')).toBe(false);
      expect(requiresManualConversion('l')).toBe(false);
    });

    it('zwraca false dla nieznanych jednostek', () => {
      expect(requiresManualConversion('xyz')).toBe(false);
      expect(requiresManualConversion('')).toBe(false);
    });
  });
});

// =============================================================================
// convertQuantity()
// =============================================================================

describe('convertQuantity', () => {
  describe('konwersje jednostek wagi', () => {
    it('konwertuje gramy na kilogramy', () => {
      expect(convertQuantity(1000, 'g', 'kg')).toBe(1);
      expect(convertQuantity(500, 'g', 'kg')).toBe(0.5);
      expect(convertQuantity(2500, 'g', 'kg')).toBe(2.5);
    });

    it('konwertuje kilogramy na gramy', () => {
      expect(convertQuantity(1, 'kg', 'g')).toBe(1000);
      expect(convertQuantity(0.5, 'kg', 'g')).toBe(500);
      expect(convertQuantity(2.5, 'kg', 'g')).toBe(2500);
    });

    it('konwertuje miligramy na gramy', () => {
      expect(convertQuantity(1000, 'mg', 'g')).toBe(1);
      expect(convertQuantity(500, 'mg', 'g')).toBe(0.5);
      expect(convertQuantity(100, 'mg', 'g')).toBe(0.1);
    });

    it('konwertuje gramy na miligramy', () => {
      expect(convertQuantity(1, 'g', 'mg')).toBe(1000);
      expect(convertQuantity(0.5, 'g', 'mg')).toBe(500);
      expect(convertQuantity(2, 'g', 'mg')).toBe(2000);
    });

    it('konwertuje kilogramy na miligramy', () => {
      expect(convertQuantity(1, 'kg', 'mg')).toBe(1000000);
      expect(convertQuantity(0.001, 'kg', 'mg')).toBe(1000);
    });

    it('działa z pełnymi nazwami jednostek', () => {
      expect(convertQuantity(1000, 'gram', 'kilogram')).toBe(1);
      expect(convertQuantity(1, 'kilogram', 'gram')).toBe(1000);
      expect(convertQuantity(1000, 'miligram', 'gram')).toBe(1);
    });
  });

  describe('konwersje jednostek objętości', () => {
    it('konwertuje mililitry na litry', () => {
      expect(convertQuantity(1000, 'ml', 'l')).toBe(1);
      expect(convertQuantity(500, 'ml', 'l')).toBe(0.5);
      expect(convertQuantity(2500, 'ml', 'l')).toBe(2.5);
    });

    it('konwertuje litry na mililitry', () => {
      expect(convertQuantity(1, 'l', 'ml')).toBe(1000);
      expect(convertQuantity(0.5, 'l', 'ml')).toBe(500);
      expect(convertQuantity(2.5, 'l', 'ml')).toBe(2500);
    });

    it('działa z pełnymi nazwami jednostek', () => {
      expect(convertQuantity(1000, 'mililitr', 'litr')).toBe(1);
      expect(convertQuantity(1, 'litr', 'mililitr')).toBe(1000);
    });
  });

  describe('konwersje jednostek długości', () => {
    it('konwertuje centymetry na metry', () => {
      expect(convertQuantity(100, 'cm', 'm')).toBe(1);
      expect(convertQuantity(50, 'cm', 'm')).toBe(0.5);
      expect(convertQuantity(250, 'cm', 'm')).toBe(2.5);
    });

    it('konwertuje metry na centymetry', () => {
      expect(convertQuantity(1, 'm', 'cm')).toBe(100);
      expect(convertQuantity(0.5, 'm', 'cm')).toBe(50);
      expect(convertQuantity(2.5, 'm', 'cm')).toBe(250);
    });

    it('konwertuje milimetry na centymetry', () => {
      expect(convertQuantity(10, 'mm', 'cm')).toBe(1);
      expect(convertQuantity(5, 'mm', 'cm')).toBe(0.5);
      expect(convertQuantity(100, 'mm', 'cm')).toBe(10);
    });

    it('konwertuje centymetry na milimetry', () => {
      expect(convertQuantity(1, 'cm', 'mm')).toBe(10);
      expect(convertQuantity(5, 'cm', 'mm')).toBe(50);
      expect(convertQuantity(10, 'cm', 'mm')).toBe(100);
    });

    it('działa z pełnymi nazwami jednostek', () => {
      expect(convertQuantity(100, 'centymetr', 'metr')).toBe(1);
      expect(convertQuantity(10, 'milimetr', 'centymetr')).toBe(1);
    });
  });

  describe('przypadek brzegowy: ta sama jednostka', () => {
    it('zwraca oryginalną ilość gdy jednostki są identyczne', () => {
      expect(convertQuantity(100, 'g', 'g')).toBe(100);
      expect(convertQuantity(500, 'ml', 'ml')).toBe(500);
      expect(convertQuantity(50, 'kg', 'kg')).toBe(50);
    });

    it('rozpoznaje taką samą jednostkę niezależnie od wielkości liter', () => {
      expect(convertQuantity(100, 'G', 'g')).toBe(100);
      expect(convertQuantity(500, 'ML', 'ml')).toBe(500);
    });
  });

  describe('przypadki brzegowe: zero i małe wartości', () => {
    it('prawidłowo konwertuje wartość zero', () => {
      expect(convertQuantity(0, 'g', 'kg')).toBe(0);
      expect(convertQuantity(0, 'ml', 'l')).toBe(0);
    });

    it('prawidłowo konwertuje bardzo małe wartości', () => {
      expect(convertQuantity(0.001, 'kg', 'g')).toBe(1);
      expect(convertQuantity(0.1, 'g', 'mg')).toBe(100);
    });
  });

  describe('przypadek: case insensitivity', () => {
    it('ignoruje wielkość liter w nazwach jednostek', () => {
      expect(convertQuantity(1000, 'G', 'KG')).toBe(1);
      expect(convertQuantity(1000, 'Ml', 'L')).toBe(1);
      expect(convertQuantity(100, 'CM', 'm')).toBe(1);
      expect(convertQuantity(1000, 'GRAM', 'KILOGRAM')).toBe(1);
    });
  });

  describe('przypadki negatywne: niemożliwa konwersja', () => {
    it('zwraca null gdy konwertuje między różnymi typami jednostek', () => {
      expect(convertQuantity(100, 'g', 'ml')).toBeNull();
      expect(convertQuantity(1, 'kg', 'l')).toBeNull();
      expect(convertQuantity(50, 'cm', 'g')).toBeNull();
      expect(convertQuantity(100, 'ml', 'cm')).toBeNull();
    });

    it('zwraca null dla jednostek wymagających ręcznej konwersji', () => {
      expect(convertQuantity(2, 'łyżka', 'ml')).toBeNull();
      expect(convertQuantity(1, 'szklanka', 'ml')).toBeNull();
      expect(convertQuantity(3, 'sztuka', 'g')).toBeNull();
    });

    it('zwraca null dla nieznanych jednostek', () => {
      expect(convertQuantity(100, 'xyz', 'g')).toBeNull();
      expect(convertQuantity(100, 'g', 'unknown')).toBeNull();
      expect(convertQuantity(100, 'unknown1', 'unknown2')).toBeNull();
    });

    it('zwraca null gdy jedna z jednostek jest pusta', () => {
      expect(convertQuantity(100, '', 'g')).toBeNull();
      expect(convertQuantity(100, 'g', '')).toBeNull();
    });
  });
});

// =============================================================================
// checkAvailabilityWithConversion()
// =============================================================================

describe('checkAvailabilityWithConversion', () => {
  describe('przypadek 1: dokładnie ta sama jednostka', () => {
    it('zwraca compatible=true dla identycznych jednostek', () => {
      const result = checkAvailabilityWithConversion(100, 'g', 200, 'g');

      expect(result.compatible).toBe(true);
      expect(result.requiresManual).toBe(false);
      expect(result.availableInRequiredUnit).toBe(200);
      expect(result.originalAvailable).toBe(200);
      expect(result.fridgeUnit).toBe('g');
      expect(result.requiredQuantity).toBe(100);
      expect(result.requiredUnit).toBe('g');
    });

    it('działa case-insensitive dla tej samej jednostki', () => {
      const result = checkAvailabilityWithConversion(100, 'G', 200, 'g');

      expect(result.compatible).toBe(true);
      expect(result.availableInRequiredUnit).toBe(200);
    });

    it('zwraca poprawne wartości gdy dostępna ilość jest mniejsza niż wymagana', () => {
      const result = checkAvailabilityWithConversion(500, 'ml', 300, 'ml');

      expect(result.compatible).toBe(true);
      expect(result.availableInRequiredUnit).toBe(300);
      expect(result.requiredQuantity).toBe(500);
    });
  });

  describe('przypadek 2: jednostki wymagające ręcznej konwersji', () => {
    it('zwraca requiresManual=true gdy wymagana jednostka wymaga ręcznej konwersji', () => {
      const result = checkAvailabilityWithConversion(2, 'łyżka', 100, 'g');

      expect(result.compatible).toBe(false);
      expect(result.requiresManual).toBe(true);
      expect(result.availableInRequiredUnit).toBeNull();
      expect(result.originalAvailable).toBe(100);
      expect(result.fridgeUnit).toBe('g');
      expect(result.requiredQuantity).toBe(2);
      expect(result.requiredUnit).toBe('łyżka');
    });

    it('zwraca requiresManual=true gdy dostępna jednostka wymaga ręcznej konwersji', () => {
      const result = checkAvailabilityWithConversion(100, 'g', 3, 'sztuka');

      expect(result.compatible).toBe(false);
      expect(result.requiresManual).toBe(true);
      expect(result.availableInRequiredUnit).toBeNull();
      expect(result.originalAvailable).toBe(3);
      expect(result.fridgeUnit).toBe('sztuka');
    });

    it('zwraca requiresManual=true gdy obie jednostki wymagają ręcznej konwersji', () => {
      const result = checkAvailabilityWithConversion(2, 'łyżka', 1, 'szklanka');

      expect(result.compatible).toBe(false);
      expect(result.requiresManual).toBe(true);
      expect(result.availableInRequiredUnit).toBeNull();
    });

    it('rozpoznaje wszystkie jednostki wymagające ręcznej konwersji', () => {
      const manualUnits = ['łyżka', 'szklanka', 'sztuka', 'garść', 'szczypta', 'ząbek'];

      manualUnits.forEach((unit) => {
        const result = checkAvailabilityWithConversion(1, unit, 100, 'g');
        expect(result.requiresManual).toBe(true);
      });
    });
  });

  describe('przypadek 3: automatyczna konwersja jednostek', () => {
    describe('konwersje wagi', () => {
      it('konwertuje gramy na kilogramy', () => {
        const result = checkAvailabilityWithConversion(1, 'kg', 1500, 'g');

        expect(result.compatible).toBe(true);
        expect(result.requiresManual).toBe(false);
        expect(result.availableInRequiredUnit).toBe(1.5);
        expect(result.originalAvailable).toBe(1500);
        expect(result.fridgeUnit).toBe('g');
        expect(result.requiredUnit).toBe('kg');
      });

      it('konwertuje kilogramy na gramy', () => {
        const result = checkAvailabilityWithConversion(500, 'g', 2, 'kg');

        expect(result.compatible).toBe(true);
        expect(result.availableInRequiredUnit).toBe(2000);
        expect(result.originalAvailable).toBe(2);
      });

      it('konwertuje miligramy na gramy', () => {
        const result = checkAvailabilityWithConversion(1, 'g', 1500, 'mg');

        expect(result.compatible).toBe(true);
        expect(result.availableInRequiredUnit).toBe(1.5);
      });
    });

    describe('konwersje objętości', () => {
      it('konwertuje mililitry na litry', () => {
        const result = checkAvailabilityWithConversion(1, 'l', 1500, 'ml');

        expect(result.compatible).toBe(true);
        expect(result.requiresManual).toBe(false);
        expect(result.availableInRequiredUnit).toBe(1.5);
        expect(result.originalAvailable).toBe(1500);
      });

      it('konwertuje litry na mililitry', () => {
        const result = checkAvailabilityWithConversion(500, 'ml', 2, 'l');

        expect(result.compatible).toBe(true);
        expect(result.availableInRequiredUnit).toBe(2000);
      });
    });

    describe('konwersje długości', () => {
      it('konwertuje centymetry na metry', () => {
        const result = checkAvailabilityWithConversion(1, 'm', 150, 'cm');

        expect(result.compatible).toBe(true);
        expect(result.availableInRequiredUnit).toBe(1.5);
      });

      it('konwertuje milimetry na centymetry', () => {
        const result = checkAvailabilityWithConversion(5, 'cm', 100, 'mm');

        expect(result.compatible).toBe(true);
        expect(result.availableInRequiredUnit).toBe(10);
      });
    });

    it('działa case-insensitive dla automatycznej konwersji', () => {
      const result = checkAvailabilityWithConversion(1, 'KG', 1500, 'G');

      expect(result.compatible).toBe(true);
      expect(result.availableInRequiredUnit).toBe(1.5);
    });
  });

  describe('przypadki negatywne: niemożliwa automatyczna konwersja', () => {
    it('zwraca requiresManual=true dla różnych typów jednostek (waga vs objętość)', () => {
      const result = checkAvailabilityWithConversion(100, 'g', 100, 'ml');

      expect(result.compatible).toBe(false);
      expect(result.requiresManual).toBe(true);
      expect(result.availableInRequiredUnit).toBeNull();
    });

    it('zwraca requiresManual=true dla różnych typów jednostek (objętość vs długość)', () => {
      const result = checkAvailabilityWithConversion(100, 'ml', 100, 'cm');

      expect(result.compatible).toBe(false);
      expect(result.requiresManual).toBe(true);
      expect(result.availableInRequiredUnit).toBeNull();
    });

    it('zwraca requiresManual=true dla nieznanych jednostek', () => {
      const result = checkAvailabilityWithConversion(100, 'unknown', 100, 'g');

      expect(result.compatible).toBe(false);
      expect(result.requiresManual).toBe(true);
      expect(result.availableInRequiredUnit).toBeNull();
    });

    it('zwraca requiresManual=true gdy obie jednostki są nieznane', () => {
      const result = checkAvailabilityWithConversion(100, 'xyz', 100, 'abc');

      expect(result.compatible).toBe(false);
      expect(result.requiresManual).toBe(true);
      expect(result.availableInRequiredUnit).toBeNull();
    });
  });

  describe('przypadki brzegowe: wartości graniczne', () => {
    it('prawidłowo obsługuje zero jako dostępną ilość', () => {
      const result = checkAvailabilityWithConversion(100, 'g', 0, 'g');

      expect(result.compatible).toBe(true);
      expect(result.availableInRequiredUnit).toBe(0);
      expect(result.originalAvailable).toBe(0);
    });

    it('prawidłowo obsługuje zero jako wymaganą ilość', () => {
      const result = checkAvailabilityWithConversion(0, 'g', 100, 'g');

      expect(result.compatible).toBe(true);
      expect(result.availableInRequiredUnit).toBe(100);
      expect(result.requiredQuantity).toBe(0);
    });

    it('prawidłowo obsługuje bardzo małe ilości z konwersją', () => {
      const result = checkAvailabilityWithConversion(0.001, 'kg', 1, 'g');

      expect(result.compatible).toBe(true);
      expect(result.availableInRequiredUnit).toBe(0.001);
    });

    it('prawidłowo obsługuje bardzo duże ilości z konwersją', () => {
      const result = checkAvailabilityWithConversion(1000000, 'g', 1000, 'kg');

      expect(result.compatible).toBe(true);
      expect(result.availableInRequiredUnit).toBe(1000000);
    });
  });

  describe('walidacja struktury zwracanego obiektu', () => {
    it('zawsze zwraca wszystkie wymagane pola', () => {
      const result = checkAvailabilityWithConversion(100, 'g', 200, 'kg');

      expect(result).toHaveProperty('compatible');
      expect(result).toHaveProperty('requiresManual');
      expect(result).toHaveProperty('availableInRequiredUnit');
      expect(result).toHaveProperty('originalAvailable');
      expect(result).toHaveProperty('fridgeUnit');
      expect(result).toHaveProperty('requiredQuantity');
      expect(result).toHaveProperty('requiredUnit');
    });

    it('zwraca poprawne typy dla wszystkich pól', () => {
      const result = checkAvailabilityWithConversion(100, 'g', 200, 'kg');

      expect(typeof result.compatible).toBe('boolean');
      expect(typeof result.requiresManual).toBe('boolean');
      expect(typeof result.originalAvailable).toBe('number');
      expect(typeof result.fridgeUnit).toBe('string');
      expect(typeof result.requiredQuantity).toBe('number');
      expect(typeof result.requiredUnit).toBe('string');
      // availableInRequiredUnit może być number | null
      expect(
        typeof result.availableInRequiredUnit === 'number' ||
          result.availableInRequiredUnit === null
      ).toBe(true);
    });

    it('zachowuje oryginalne wartości w polach informacyjnych', () => {
      const result = checkAvailabilityWithConversion(123.45, 'kg', 678.90, 'g');

      expect(result.originalAvailable).toBe(678.90);
      expect(result.fridgeUnit).toBe('g');
      expect(result.requiredQuantity).toBe(123.45);
      expect(result.requiredUnit).toBe('kg');
    });
  });

  describe('reguły biznesowe: logika compatible i requiresManual', () => {
    it('gdy compatible=true, requiresManual musi być false', () => {
      const compatibleCases = [
        { req: 100, reqUnit: 'g', avail: 200, availUnit: 'g' },
        { req: 1, reqUnit: 'kg', avail: 2000, availUnit: 'g' },
        { req: 500, reqUnit: 'ml', avail: 1, availUnit: 'l' },
      ];

      compatibleCases.forEach((testCase) => {
        const result = checkAvailabilityWithConversion(
          testCase.req,
          testCase.reqUnit,
          testCase.avail,
          testCase.availUnit
        );
        expect(result.compatible).toBe(true);
        expect(result.requiresManual).toBe(false);
      });
    });

    it('gdy compatible=false, availableInRequiredUnit musi być null', () => {
      const incompatibleCases = [
        { req: 100, reqUnit: 'g', avail: 200, availUnit: 'ml' }, // różne typy
        { req: 2, reqUnit: 'łyżka', avail: 100, availUnit: 'g' }, // ręczna konwersja
        { req: 100, reqUnit: 'xyz', avail: 200, availUnit: 'g' }, // nieznana jednostka
      ];

      incompatibleCases.forEach((testCase) => {
        const result = checkAvailabilityWithConversion(
          testCase.req,
          testCase.reqUnit,
          testCase.avail,
          testCase.availUnit
        );
        expect(result.compatible).toBe(false);
        expect(result.availableInRequiredUnit).toBeNull();
      });
    });

    it('gdy compatible=true, availableInRequiredUnit musi być liczbą', () => {
      const result = checkAvailabilityWithConversion(1, 'kg', 2000, 'g');

      expect(result.compatible).toBe(true);
      expect(typeof result.availableInRequiredUnit).toBe('number');
      expect(result.availableInRequiredUnit).not.toBeNull();
    });
  });

  describe('scenariusze rzeczywiste z przepisami', () => {
    it('przepis wymaga 500g mąki, w lodówce mamy 1kg - wystarczy', () => {
      const result = checkAvailabilityWithConversion(500, 'g', 1, 'kg');

      expect(result.compatible).toBe(true);
      expect(result.availableInRequiredUnit).toBe(1000);
      expect(result.availableInRequiredUnit! >= result.requiredQuantity).toBe(true);
    });

    it('przepis wymaga 2 łyżek oleju, w lodówce mamy 500ml - wymaga ręcznej oceny', () => {
      const result = checkAvailabilityWithConversion(2, 'łyżka', 500, 'ml');

      expect(result.compatible).toBe(false);
      expect(result.requiresManual).toBe(true);
    });

    it('przepis wymaga 250ml mleka, w lodówce mamy 0.5l - wystarczy', () => {
      const result = checkAvailabilityWithConversion(250, 'ml', 0.5, 'l');

      expect(result.compatible).toBe(true);
      expect(result.availableInRequiredUnit).toBe(500);
      expect(result.availableInRequiredUnit! >= result.requiredQuantity).toBe(true);
    });

    it('przepis wymaga 3 jajka (sztuki), w lodówce mamy 6 sztuk - wystarczy (ta sama jednostka)', () => {
      const result = checkAvailabilityWithConversion(3, 'sztuka', 6, 'sztuka');

      expect(result.compatible).toBe(true);
      expect(result.availableInRequiredUnit).toBe(6);
      expect(result.availableInRequiredUnit! >= result.requiredQuantity).toBe(true);
    });

    it('przepis wymaga 200g, w lodówce mamy 150g - nie wystarczy', () => {
      const result = checkAvailabilityWithConversion(200, 'g', 150, 'g');

      expect(result.compatible).toBe(true);
      expect(result.availableInRequiredUnit).toBe(150);
      expect(result.availableInRequiredUnit! < result.requiredQuantity).toBe(true);
    });
  });
});

