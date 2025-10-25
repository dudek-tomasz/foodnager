/**
 * InstructionStep - Single instruction step in a numbered list
 */

import React from 'react';

interface InstructionStepProps {
  step: string;
  index: number;
}

export default function InstructionStep({ step, index }: InstructionStepProps) {
  return (
    <li className="text-gray-700 dark:text-gray-300 leading-relaxed">
      {step}
    </li>
  );
}

