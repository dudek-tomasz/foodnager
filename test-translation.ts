/**
 * Test script for recipe translation
 * Run with: npx tsx test-translation.ts
 */

import { translateRecipe } from './src/lib/utils/recipe-translator';

async function testTranslation() {
  console.log('🧪 Testing recipe translation...\n');

  const testRecipe = {
    title: 'Cheesy Rosemary Meatball Bake',
    description: 'A delicious Italian-inspired dish with ground beef, rosemary, and cheese.',
    instructions: '1. Heat olive oil in large oven proof skillet.\n2. Add the onion and mushroom.\n3. Cook meatballs until browned.'
  };

  console.log('📝 Original recipe (EN):');
  console.log('Title:', testRecipe.title);
  console.log('Description:', testRecipe.description);
  console.log('Instructions:', testRecipe.instructions);
  console.log('\n---\n');

  try {
    const translated = await translateRecipe(testRecipe);
    
    console.log('✅ Translated recipe (PL):');
    console.log('Title:', translated.title);
    console.log('Description:', translated.description);
    console.log('Instructions:', translated.instructions);
    
  } catch (error) {
    console.error('❌ Translation failed:', error);
  }
}

testTranslation();

