"use client";

import SearchAutosuggest from "./SearchAutosuggest";

export default function MobileMenu() {
  return (
    <div className="p-4 flex lg:hidden w-full gap-5 bg-[#1C2530]">
      <div>
        <div className="dropdown w-full">
          <div tabIndex={0} role="button" aria-label="Menu" className="btn btn-ghost btn-circle text-white">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="size-8">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
            </svg>
          </div>
          <ul tabIndex={0} className="menu menu-lg dropdown-content bg-[#1C2530] z-1 mt-4.5 w-75 p-2 shadow text-white">
            <li><a href="/categories">Categorieën</a></li>
            <li><a href="/deurbeslag/deurklink">Deurklink</a></li>
            <li><a href="/deurbeslag/cilinders">Cilinder</a></li>
            <li><a href="/deurbeslag/tochtstrip">Tochtstrip</a></li>
            <li><a href="/deurbeslag/deurstoppers">Deurstopper</a></li>
          </ul>
        </div>
      </div>
      <div className="w-full">
        <SearchAutosuggest placeholder="Start met zoeken..." />
      </div>
    </div>
  );
}
