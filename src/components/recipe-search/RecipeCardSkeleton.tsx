/**
 * RecipeCardSkeleton - Loading skeleton for recipe cards
 *
 * Shows animated placeholder while recipes are being loaded
 */

import React from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";

export default function RecipeCardSkeleton() {
  return (
    <Card className="h-full animate-pulse">
      <CardHeader className="relative">
        {/* Badge placeholder (top-right) */}
        <div className="absolute top-4 right-4">
          <Skeleton className="h-6 w-16 rounded-full" />
        </div>

        {/* Title placeholder (2 lines) */}
        <Skeleton className="h-6 w-3/4 mb-2" />
        <Skeleton className="h-6 w-1/2" />
      </CardHeader>

      <CardContent className="space-y-3">
        {/* Ingredients placeholder (3-4 lines) */}
        <div className="space-y-2">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-5/6" />
          <Skeleton className="h-4 w-4/6" />
          <Skeleton className="h-4 w-3/4" />
        </div>

        {/* Metadata placeholder (cooking time, difficulty) */}
        <div className="flex gap-4 pt-2">
          <Skeleton className="h-5 w-20" />
          <Skeleton className="h-5 w-24" />
        </div>
      </CardContent>

      <CardFooter className="flex gap-2">
        {/* Button placeholders */}
        <Skeleton className="h-10 flex-1" />
        <Skeleton className="h-10 w-32" />
      </CardFooter>
    </Card>
  );
}
