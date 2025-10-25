/**
 * RecipeInstructionsSection - Recipe preparation instructions
 */

import React from 'react';
import InstructionStep from './InstructionStep';
import { parseInstructions } from '../../lib/utils/recipe-utils';

interface RecipeInstructionsSectionProps {
  instructions: string;
  description?: string | null;
}

export default function RecipeInstructionsSection({
  instructions,
  description,
}: RecipeInstructionsSectionProps) {
  const { steps } = parseInstructions(instructions);

  return (
    <section className="mb-8">
      {/* Section header */}
      <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4">
        Instrukcje
      </h2>

      {/* Description */}
      {description && (
        <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
          <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
            {description}
          </p>
        </div>
      )}

      {/* Instructions list */}
      {steps.length > 0 ? (
        <ol className="space-y-4 list-decimal list-inside marker:font-bold marker:text-primary">
          {steps.map((step, index) => (
            <InstructionStep key={index} step={step} index={index} />
          ))}
        </ol>
      ) : (
        <p className="text-gray-500 dark:text-gray-400 italic">
          Brak instrukcji przygotowania
        </p>
      )}
    </section>
  );
}

