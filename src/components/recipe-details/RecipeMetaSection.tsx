/**
 * RecipeMetaSection - Recipe metadata display (cooking time, difficulty, tags)
 */

import React from "react";
import MetaItem from "./MetaItem";
import TagBadge from "./TagBadge";
import type { DifficultyEnum, TagDTO } from "../../types";
import { getDifficultyLabel, getDifficultyColor, formatCookingTime } from "../../lib/utils/recipe-utils";

interface RecipeMetaSectionProps {
  cookingTime: number | null;
  difficulty: DifficultyEnum | null;
  tags: TagDTO[];
}

export default function RecipeMetaSection({ cookingTime, difficulty, tags }: RecipeMetaSectionProps) {
  const hasMeta = cookingTime !== null || difficulty !== null || tags.length > 0;

  if (!hasMeta) {
    return null;
  }

  return (
    <section className="mb-8 pb-6 border-b border-gray-200 dark:border-gray-700">
      <div className="flex flex-wrap items-start gap-6">
        {/* Cooking time */}
        {cookingTime !== null && cookingTime > 0 && (
          <MetaItem
            icon={
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            }
            label="Czas przygotowania"
            value={formatCookingTime(cookingTime)}
          />
        )}

        {/* Difficulty */}
        {difficulty !== null && (
          <MetaItem
            icon={
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                />
              </svg>
            }
            label="Poziom trudności"
            value={getDifficultyLabel(difficulty)}
            className={getDifficultyColor(difficulty)}
          />
        )}

        {/* Tags */}
        {tags.length > 0 && (
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-500">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-4 w-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"
                />
              </svg>
              <span>Tagi</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {tags.map((tag) => (
                <TagBadge key={tag.id} tag={tag} />
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
