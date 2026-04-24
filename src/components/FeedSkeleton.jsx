import React from 'react';
import { Skeleton } from '@/components/ui/skeleton';

export default function FeedSkeleton() {
  return (
    <div className="pt-4">
      {Array.from({ length: 12 }).map((_, i) => (
        <div key={i} className="flex items-center gap-3 px-6 py-3">
          <Skeleton className="h-3.5 w-3.5 rounded-sm" />
          <Skeleton className="h-4 w-20 rounded" />
          <Skeleton className="h-4 flex-1 max-w-md rounded" />
          <Skeleton className="ml-auto h-3 w-16 rounded" />
          <Skeleton className="h-3 w-10 rounded" />
        </div>
      ))}
    </div>
  );
}
