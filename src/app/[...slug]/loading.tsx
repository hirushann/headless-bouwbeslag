import React from "react";

export default function Loading() {
  return (
    <div className="bg-[#F7F7F7] min-h-screen">
      <div className="max-w-[1440px] mx-auto py-4 lg:py-8 px-5 lg:px-0">
        <div className="flex flex-col lg:flex-row gap-2 lg:gap-8">
          {/* Sidebar Skeleton */}
          <aside className="w-full lg:w-1/4">
            <div className="bg-white rounded-lg p-4 h-[600px] animate-pulse">
              <div className="h-6 bg-gray-200 rounded w-1/2 mb-6"></div>
              {[...Array(5)].map((_, i) => (
                <div key={i} className="mb-8">
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
                  <div className="space-y-2">
                    <div className="h-3 bg-gray-100 rounded w-full"></div>
                    <div className="h-3 bg-gray-100 rounded w-5/6"></div>
                    <div className="h-3 bg-gray-100 rounded w-4/6"></div>
                  </div>
                </div>
              ))}
            </div>
          </aside>

          {/* Main Content Skeleton */}
          <main className="flex-1">
            <div className="h-4 bg-gray-200 rounded w-1/4 mb-4 animate-pulse"></div>
            <div className="flex justify-between items-end mb-8">
              <div className="h-10 bg-gray-200 rounded w-1/3 animate-pulse"></div>
              <div className="h-8 bg-gray-200 rounded w-32 animate-pulse"></div>
            </div>

            <div className="flex gap-4 mb-8">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-8 bg-white border border-gray-200 rounded w-24 animate-pulse"></div>
              ))}
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 lg:gap-6">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="bg-white rounded-lg p-4 h-80 flex flex-col animate-pulse">
                  <div className="aspect-square bg-gray-100 rounded-md mb-4"></div>
                  <div className="h-4 bg-gray-200 rounded w-full mb-2"></div>
                  <div className="h-4 bg-gray-200 rounded w-2/3 mb-4"></div>
                  <div className="mt-auto h-6 bg-gray-200 rounded w-1/2"></div>
                </div>
              ))}
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}
