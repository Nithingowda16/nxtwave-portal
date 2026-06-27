import React from 'react';

export const StatCardSkeleton: React.FC = () => {
  return (
    <div className="animate-pulse rounded-2xl border border-google-gray-200 bg-white p-6 dark:border-google-gray-800 dark:bg-google-surface-dark">
      <div className="flex items-center justify-between">
        <div className="h-4 w-24 rounded bg-google-gray-200 dark:bg-google-gray-700" />
        <div className="h-8 w-8 rounded-full bg-google-gray-200 dark:bg-google-gray-700" />
      </div>
      <div className="mt-4 h-8 w-16 rounded bg-google-gray-300 dark:bg-google-gray-600" />
      <div className="mt-2 h-3 w-32 rounded bg-google-gray-200 dark:bg-google-gray-700" />
    </div>
  );
};

export const TableSkeleton: React.FC<{ rows?: number }> = ({ rows = 5 }) => {
  return (
    <div className="w-full animate-pulse rounded-2xl border border-google-gray-200 bg-white dark:border-google-gray-800 dark:bg-google-surface-dark">
      <div className="h-12 border-b border-google-gray-200 dark:border-google-gray-800 px-6 flex items-center">
        <div className="h-4 w-1/3 rounded bg-google-gray-200 dark:bg-google-gray-700" />
      </div>
      <div className="p-6 space-y-4">
        {Array(rows)
          .fill(0)
          .map((_, i) => (
            <div key={i} className="flex gap-4">
              <div className="h-6 w-1/4 rounded bg-google-gray-200 dark:bg-google-gray-700" />
              <div className="h-6 w-1/4 rounded bg-google-gray-200 dark:bg-google-gray-700" />
              <div className="h-6 w-1/4 rounded bg-google-gray-200 dark:bg-google-gray-700" />
              <div className="h-6 w-1/4 rounded bg-google-gray-200 dark:bg-google-gray-700" />
            </div>
          ))}
      </div>
    </div>
  );
};

export const ChartSkeleton: React.FC = () => {
  return (
    <div className="animate-pulse rounded-2xl border border-google-gray-200 bg-white p-6 dark:border-google-gray-800 dark:bg-google-surface-dark">
      <div className="h-4 w-36 rounded bg-google-gray-200 dark:bg-google-gray-700 mb-6" />
      <div className="h-64 w-full rounded bg-google-gray-100 dark:bg-google-gray-850 flex items-end justify-between p-4">
        {Array(8)
          .fill(0)
          .map((_, i) => {
            const heights = ['h-32', 'h-48', 'h-24', 'h-56', 'h-40', 'h-16', 'h-52', 'h-36'];
            return (
              <div key={i} className={`w-8 ${heights[i % heights.length]} rounded-t bg-google-gray-200 dark:bg-google-gray-700`} />
            );
          })}
      </div>
    </div>
  );
};
