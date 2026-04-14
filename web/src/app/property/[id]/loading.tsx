import React from 'react';

export default function Loading() {
  return (
    <div className="min-h-screen bg-white dark:bg-zinc-950 pb-24 font-sans animate-pulse">
      {/* Sticky Top Bar Skeleton */}
      <div className="sticky top-0 z-40 bg-white/80 dark:bg-zinc-950/80 border-b border-zinc-200 dark:border-zinc-800 px-4 py-3 flex items-center justify-between">
        <div className="h-8 w-24 bg-zinc-200 dark:bg-zinc-800 rounded-lg"></div>
        <div className="h-8 w-32 bg-zinc-200 dark:bg-zinc-800 rounded-lg"></div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Main Content Skeleton */}
          <div className="lg:col-span-2 space-y-6">
            {/* Title Block */}
            <div className="space-y-3">
              <div className="flex gap-2">
                <div className="h-6 w-16 bg-blue-100 dark:bg-blue-900/40 rounded-full"></div>
                <div className="h-6 w-20 bg-green-100 dark:bg-green-900/40 rounded-full"></div>
              </div>
              <div className="h-10 w-3/4 bg-zinc-200 dark:bg-zinc-800 rounded-xl"></div>
              <div className="h-6 w-1/2 bg-zinc-100 dark:bg-zinc-800/50 rounded-lg"></div>
            </div>

            {/* Image Gallery Skeleton */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-4 rounded-xl overflow-hidden aspect-[16/9] lg:aspect-auto lg:h-[400px]">
              <div className="h-full bg-zinc-200 dark:bg-zinc-800 min-h-[250px]"></div>
              <div className="hidden sm:grid grid-cols-2 grid-rows-2 gap-2">
                <div className="bg-zinc-200 dark:bg-zinc-800"></div>
                <div className="bg-zinc-200 dark:bg-zinc-800"></div>
                <div className="bg-zinc-200 dark:bg-zinc-800"></div>
                <div className="bg-zinc-200 dark:bg-zinc-800"></div>
              </div>
            </div>

            {/* Quick Info Tags */}
            <div className="flex flex-wrap gap-2 py-4">
              <div className="h-8 w-24 bg-zinc-200 dark:bg-zinc-800 rounded-full"></div>
              <div className="h-8 w-32 bg-zinc-200 dark:bg-zinc-800 rounded-full"></div>
              <div className="h-8 w-20 bg-zinc-200 dark:bg-zinc-800 rounded-full"></div>
              <div className="h-8 w-28 bg-zinc-200 dark:bg-zinc-800 rounded-full"></div>
            </div>

            {/* AI Analysis Block */}
            <div className="bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-950/30 dark:to-purple-950/30 rounded-2xl p-6 border border-indigo-100 dark:border-indigo-900/50 mt-6">
              <div className="h-8 w-64 bg-indigo-200 dark:bg-indigo-900/50 rounded-lg mb-4"></div>
              <div className="space-y-3">
                <div className="h-4 w-full bg-indigo-100 dark:bg-indigo-900/30 rounded"></div>
                <div className="h-4 w-full bg-indigo-100 dark:bg-indigo-900/30 rounded"></div>
                <div className="h-4 w-3/4 bg-indigo-100 dark:bg-indigo-900/30 rounded"></div>
              </div>
            </div>
          </div>

          {/* Right Sidebar Skeleton */}
          <div className="space-y-6">
            {/* Court Valuation Card */}
            <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-none p-6 border border-zinc-100 dark:border-zinc-800">
              <div className="h-6 w-32 bg-zinc-200 dark:bg-zinc-800 rounded pb-4"></div>
              <div className="mt-4 space-y-4">
                <div>
                  <div className="h-4 w-24 bg-zinc-100 dark:bg-zinc-800/50 rounded mb-2"></div>
                  <div className="h-10 w-full bg-zinc-200 dark:bg-zinc-800 rounded-lg"></div>
                </div>
                <div className="grid grid-cols-2 gap-4 pt-4 border-t border-zinc-100 dark:border-zinc-800">
                  <div>
                    <div className="h-4 w-16 bg-zinc-100 dark:bg-zinc-800/50 rounded mb-2"></div>
                    <div className="h-6 w-24 bg-zinc-200 dark:bg-zinc-800 rounded"></div>
                  </div>
                  <div>
                    <div className="h-4 w-16 bg-zinc-100 dark:bg-zinc-800/50 rounded mb-2"></div>
                    <div className="h-6 w-24 bg-zinc-200 dark:bg-zinc-800 rounded"></div>
                  </div>
                </div>
              </div>
              <div className="mt-6 pt-6 border-t border-zinc-100 dark:border-zinc-800">
                <div className="h-12 w-full bg-orange-200 dark:bg-orange-900/30 rounded-xl"></div>
              </div>
            </div>

            {/* Map Skeleton */}
            <div className="h-[250px] bg-zinc-200 dark:bg-zinc-800 rounded-2xl w-full"></div>
          </div>

        </div>
      </div>
    </div>
  );
}
