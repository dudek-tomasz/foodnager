/**
 * MetaItem - Single metadata item with icon and value
 */

import React from 'react';

interface MetaItemProps {
  icon: React.ReactNode;
  label: string;
  value: string;
  className?: string;
}

export default function MetaItem({
  icon,
  label,
  value,
  className = '',
}: MetaItemProps) {
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <div className="text-gray-500 dark:text-gray-400" aria-hidden="true">
        {icon}
      </div>
      <div className="flex flex-col">
        <span className="text-xs text-gray-500 dark:text-gray-500">
          {label}
        </span>
        <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
          {value}
        </span>
      </div>
    </div>
  );
}

