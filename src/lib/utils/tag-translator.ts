/**
 * Tag Translator - Translate recipe tags from English to Polish
 */

/**
 * Dictionary of English to Polish tag translations
 */
const ENGLISH_TO_POLISH_TAGS: Record<string, string> = {
  // Dietary
  'gluten free': 'bezglutenowe',
  'gluten-free': 'bezglutenowe',
  'dairy free': 'bez laktozy',
  'dairy-free': 'bez laktozy',
  'vegetarian': 'wegetariańskie',
  'vegan': 'wegańskie',
  'ketogenic': 'ketogeniczne',
  'keto': 'keto',
  'paleo': 'paleo',
  'whole 30': 'whole 30',
  'whole30': 'whole 30',
  'low carb': 'niskowęglowodanowe',
  
  // Meal types
  'breakfast': 'śniadanie',
  'lunch': 'obiad',
  'dinner': 'kolacja',
  'snack': 'przekąska',
  'dessert': 'deser',
  'appetizer': 'przystawka',
  'starter': 'starter',
  'main course': 'danie główne',
  'side dish': 'dodatek',
  
  // Cuisines
  'italian': 'włoskie',
  'mexican': 'meksykańskie',
  'asian': 'azjatyckie',
  'indian': 'indyjskie',
  'chinese': 'chińskie',
  'japanese': 'japońskie',
  'thai': 'tajskie',
  'french': 'francuskie',
  'american': 'amerykańskie',
  'mediterranean': 'śródziemnomorskie',
  'middle eastern': 'bliskowschodnie',
  
  // Types
  'antipasti': 'przystawki',
  'antipasto': 'przystawka',
  'hor d\'oeuvre': 'przystawka',
  'hors d\'oeuvre': 'przystawka',
  'soup': 'zupa',
  'salad': 'sałatka',
  'sandwich': 'kanapka',
  'pasta': 'makaron',
  'pizza': 'pizza',
  'burger': 'burger',
  'sauce': 'sos',
  'dip': 'dip',
  'spread': 'pasta do smarowania',
  
  // Cooking methods
  'baked': 'pieczone',
  'grilled': 'grillowane',
  'fried': 'smażone',
  'roasted': 'pieczone',
  'steamed': 'gotowane na parze',
  'slow cooker': 'wolnowar',
  'instant pot': 'instant pot',
  
  // Other
  'quick': 'szybkie',
  'easy': 'łatwe',
  'healthy': 'zdrowe',
  'comfort food': 'comfort food',
  'kid friendly': 'dla dzieci',
  'budget': 'budżetowe',
  'cheap': 'tanie',
};

/**
 * Translate tag from English to Polish
 * 
 * @param englishTag - English tag name
 * @returns Polish tag name (or original if no translation found)
 */
export function translateTag(englishTag: string): string {
  if (!englishTag) {
    return englishTag;
  }

  const normalized = englishTag.toLowerCase().trim();
  
  // Direct match
  if (ENGLISH_TO_POLISH_TAGS[normalized]) {
    return ENGLISH_TO_POLISH_TAGS[normalized];
  }

  // Return original if no translation
  return englishTag;
}

/**
 * Translate array of tags from English to Polish
 * 
 * @param englishTags - Array of English tag names
 * @returns Array of Polish tag names (unique)
 */
export function translateTags(englishTags: string[]): string[] {
  if (!englishTags || englishTags.length === 0) {
    return [];
  }

  const translated = englishTags.map(translateTag);
  
  // Remove duplicates
  return [...new Set(translated)];
}

