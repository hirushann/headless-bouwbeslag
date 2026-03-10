import React from "react";

export default function Loading() {
  return (
    <div className="flex min-h-[60vh] w-full flex-col items-center justify-center bg-[#F7F7F7]">
      <span className="loading loading-spinner loading-lg text-blue-600 w-12 h-12 mb-4"></span>
      <p className="text-gray-500 font-medium text-lg animate-pulse">Pagina laden...</p>
    </div>
  );
}
