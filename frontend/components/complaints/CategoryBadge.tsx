"use client";

import { Badge } from "@/components/ui/Badge";

interface CategoryBadgeProps {
  category: string;
}

export function CategoryBadge({ category }: CategoryBadgeProps) {
  return (
    <Badge variant="default">
      {category}
    </Badge>
  );
}
