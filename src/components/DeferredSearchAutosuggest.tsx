"use client";

import dynamic from "next/dynamic";
import { useState } from "react";

const SearchAutosuggest = dynamic(() => import("./SearchAutosuggest"), {
  ssr: false,
});

export default function DeferredSearchAutosuggest({
  placeholder = "Zoek iets...",
  className = "",
}: {
  placeholder?: string;
  className?: string;
}) {
  const [isActivated, setIsActivated] = useState(false);

  if (isActivated) {
    return (
      <SearchAutosuggest
        placeholder={placeholder}
        className={className}
        initiallyExpanded
      />
    );
  }

  return (
    <button
      type="button"
      aria-label={`Zoeken: ${placeholder}`}
      className={`join w-full border border-[#E2E2E2] rounded-[4px] bg-white cursor-text text-left ${className}`}
      onClick={() => setIsActivated(true)}
    >
      <span className="input validator w-full border-0 rounded-[5px] bg-white flex items-center gap-2 p-0 px-3 cursor-text">
        <span className="text-gray-500 w-full py-2 text-base truncate select-none">
          {placeholder}
        </span>
      </span>
      <span
        aria-hidden="true"
        className="btn bg-[#2332C51A] rounded-[4px] border-0 shadow-none px-4 pointer-events-none"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 640 640"
          width="20"
          height="20"
          fill="#0066FF"
        >
          <path d="M480 272C480 317.9 465.1 360.3 440 394.7L566.6 521.4C579.1 533.9 579.1 554.2 566.6 566.7C554.1 579.2 533.8 579.2 521.3 566.7L394.7 440C360.3 465.1 317.9 480 272 480C157.1 480 64 386.9 64 272C64 157.1 157.1 64 272 64C386.9 64 480 157.1 480 272zM272 416C351.5 416 416 351.5 416 272C416 192.5 351.5 128 272 128C192.5 128 128 192.5 128 272C128 351.5 192.5 416 272 416z" />
        </svg>
      </span>
    </button>
  );
}
