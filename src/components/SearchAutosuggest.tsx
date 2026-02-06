"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

import { searchProducts, SearchResult, Facet, FilterState } from "@/actions/search";
import { useUserContext } from "@/context/UserContext";
import ProductCard from "./ProductCard";
import ShopProductCard from "./ShopProductCard";

function FilterGroup({
    facet,
    filters,
    onFilterChange,
}: {
    facet: Facet;
    filters: FilterState;
    onFilterChange: (facetName: string, value: string) => void;
}) {
    const [isOpen, setIsOpen] = useState(true);

    return (
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center justify-between w-full group"
            >
                <h3 className="font-semibold text-base capitalize text-gray-800">
                    {facet.name === "product_cat" ? "Categories" : facet.name}
                </h3>
                <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className={`text-gray-400 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
                >
                    <polyline points="6 9 12 15 18 9"></polyline>
                </svg>
            </button>

            {isOpen && (
                <div className="mt-3 space-y-2 max-h-[300px] overflow-y-auto custom-scrollbar">
                    {facet.buckets.map((bucket) => {
                        const isChecked = filters[facet.name]?.includes(bucket.key) || false;
                        return (
                            <label
                                key={bucket.key}
                                className="flex items-center gap-2 cursor-pointer group"
                            >
                                <input
                                    type="checkbox"
                                    className="checkbox checkbox-sm checkbox-primary rounded-sm"
                                    checked={isChecked}
                                    onChange={() => onFilterChange(facet.name, bucket.key)}
                                />
                                <span
                                    className={`text-sm group-hover:text-blue-600 transition capitalize ${isChecked ? "font-medium text-gray-900" : "text-gray-600"
                                        }`}
                                >
                                    {bucket.label}
                                </span>
                                <span className="text-xs text-gray-400 ml-auto tabular-nums">
                                    ({bucket.doc_count})
                                </span>
                            </label>
                        );
                    })}
                </div>
            )}
        </div>
    );
}

export default function SearchAutosuggest({
    placeholder = "Zoek iets...",
    className = "",
}: {
    placeholder?: string;
    className?: string;
}) {
    const [query, setQuery] = useState("");
    const { userRole } = useUserContext();
    const [results, setResults] = useState<SearchResult[]>([]);
    const [facets, setFacets] = useState<Facet[]>([]);
    const [filters, setFilters] = useState<FilterState>({});

    // UI States
    const [isExpanded, setIsExpanded] = useState(false);
    const [showFiltersMobile, setShowFiltersMobile] = useState(false);
    const [loading, setLoading] = useState(false);

    const router = useRouter();
    const containerRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    // Prevent scrolling when expanded
    useEffect(() => {
        if (isExpanded) {
            document.body.style.overflow = "hidden";
            // Autofocus input
            setTimeout(() => {
                inputRef.current?.focus();
            }, 50);
        } else {
            document.body.style.overflow = "";
        }
        return () => {
            document.body.style.overflow = "";
        };
    }, [isExpanded]);

    // Search Logic
    useEffect(() => {
        const delayDebounceFn = setTimeout(async () => {
            // Search if empty (show all) or at least 2 chars
            if (query.trim().length === 0 || query.trim().length >= 2) {
                setLoading(true);
                try {
                    const response = await searchProducts(query, filters);
                    console.log(response);
                    setResults(response.products);
                    setFacets(response.facets);
                } catch (error) {
                    // console.error("Search error:", error);
                } finally {
                    setLoading(false);
                }
            } else {
                // Clear if 1 char? Or simpler: just let it search if > 0 too? 
                // Let's stick to '0 or >=2' to avoid 1-char noise, 
                // but ensure we clear results if it falls into the '1 char' hole?
                // Actually if query is 1 char, we might WANT to clear.
                setResults([]);
                setFacets([]);
            }
        }, 300);

        return () => clearTimeout(delayDebounceFn);
    }, [query, filters]);

    const handleFilterChange = (facetName: string, value: string) => {
        setFilters(prev => {
            const current = prev[facetName] || [];
            const exists = current.includes(value);
            let updated;
            if (exists) {
                updated = current.filter(v => v !== value);
            } else {
                updated = [...current, value];
            }

            // Cleanup empty
            if (updated.length === 0) {
                const { [facetName]: _, ...rest } = prev;
                return rest;
            }

            return { ...prev, [facetName]: updated };
        });
    };

    const handleClose = () => {
        setIsExpanded(false);
        // Optional: clear query or keep it? Keeping it is better for UX if they re-open.
    };

    return (
        <div ref={containerRef} className={`relative w-full ${className}`}>
            {/* Initial Input (Visible when collapsed) */}
            <div
                className="join w-full border border-[#E2E2E2] rounded-[4px] bg-white cursor-text"
                onClick={() => {
                    setIsExpanded(true);
                }}
            >
                <div className="w-full rounded-[4px]">
                    <div className="input validator w-full border-0 rounded-[5px] bg-white flex items-center gap-2 p-0 px-3 cursor-text">
                        <span className="text-gray-400 w-full py-2 text-base truncate select-none">
                            {query || placeholder}
                        </span>
                    </div>
                </div>
                <button
                    type="button"
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
                </button>
            </div>

            {/* Expanded Overlay */}
            {isExpanded && (
                <div
                    className="fixed inset-0 z-[9999] bg-slate-300 bg-opacity-5 flex items-center justify-center animate-fade-in"
                    onClick={handleClose}
                >
                    <div
                        className="bg-[#F7F7F7] w-full h-full md:m-12 md:h-auto md:max-h-[90vh] md:rounded-lg shadow-lg flex flex-col overflow-hidden"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Header */}
                        <div className="bg-white border-b border-[#E2E2E2] px-4 py-4 shadow-sm shrink-0">
                            <div className="max-w-[1440px] mx-auto flex items-center gap-4">
                                <form
                                    onSubmit={(e) => e.preventDefault()}
                                    className="flex-1 join border border-[#E2E2E2] rounded-[4px] bg-white h-[50px]"
                                >
                                    <div className="w-full h-full">
                                        <input
                                            ref={inputRef}
                                            className="input border-0 focus:outline-none w-full h-full px-4 text-lg bg-transparent"
                                            type="text"
                                            placeholder={placeholder}
                                            value={query}
                                            onChange={(e) => setQuery(e.target.value)}
                                            autoComplete="off"
                                        />
                                    </div>
                                    <button
                                        type="submit"
                                        className="btn bg-[#2332C51A] border-0 shadow-none px-6 h-full rounded-r-[4px]"
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
                                    </button>
                                </form>

                                <button
                                    onClick={handleClose}
                                    className="btn btn-ghost btn-circle"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            </div>
                        </div>

                        {/* Main Content */}
                        <div className="flex-1 overflow-y-auto px-4 py-6">
                            <div className="max-w-[1440px] mx-auto flex flex-col lg:flex-row gap-8 pb-10">

                                {/* Filters Sidebar */}
                                {results.length > 0 && ( /* Only show filters if we have results or active query? */
                                    <aside className="w-full lg:w-1/4 shrink-0">
                                        <div
                                            className="flex items-center justify-between lg:hidden mb-2 cursor-pointer bg-white p-3 rounded-lg border border-gray-200"
                                            onClick={() => setShowFiltersMobile(!showFiltersMobile)}
                                        >
                                            <div className="flex items-center gap-2">
                                                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"></polygon></svg>
                                                <span className="font-bold text-gray-800">Filters</span>
                                            </div>
                                            <div className="flex items-center gap-3">
                                                {Object.keys(filters).length > 0 && (
                                                    <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">
                                                        {Object.keys(filters).length}
                                                    </span>
                                                )}
                                                <svg
                                                    xmlns="http://www.w3.org/2000/svg"
                                                    width="20"
                                                    height="20"
                                                    viewBox="0 0 24 24"
                                                    fill="none"
                                                    stroke="currentColor"
                                                    strokeWidth="2"
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                    className={`text-gray-500 transition-transform ${showFiltersMobile ? "rotate-180" : ""}`}
                                                >
                                                    <polyline points="6 9 12 15 18 9"></polyline>
                                                </svg>
                                            </div>
                                        </div>

                                        <div className={`space-y-4 ${showFiltersMobile ? 'block' : 'hidden'} lg:block`}>
                                            <div className="flex items-center justify-between lg:hidden mb-2 px-1">
                                                {Object.keys(filters).length > 0 && (
                                                    <button onClick={() => setFilters({})} className="text-sm text-red-500 hover:text-red-600 font-medium">
                                                        Clear All Filters
                                                    </button>
                                                )}
                                            </div>

                                            {facets.map((facet) => (
                                                <FilterGroup
                                                    key={facet.name}
                                                    facet={facet}
                                                    filters={filters}
                                                    onFilterChange={handleFilterChange}
                                                />
                                            ))}

                                            {/* Clear Filters Button (Desktop) */}
                                            {Object.keys(filters).length > 0 && (
                                                <button
                                                    onClick={() => setFilters({})}
                                                    className="hidden lg:block w-full py-2 text-sm text-red-600 border border-red-200 rounded-md hover:bg-red-50 transition"
                                                >
                                                    Clear Filters
                                                </button>
                                            )}
                                        </div>
                                    </aside>
                                )}

                                {/* Product Grid */}
                                <main className="flex-1">
                                    {loading ? (
                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                                            {[...Array(8)].map((_, i) => (
                                                <div key={i} className="h-80 bg-gray-200 rounded animate-pulse" />
                                            ))}
                                        </div>
                                    ) : results.length > 0 ? (
                                        <>
                                            <p className="text-sm text-gray-500 mb-4">{results.length} results found</p>
                                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                                                {results.map((result) => (
                                                    <div
                                                        key={result.ID}
                                                        onClick={(e) => {
                                                            // Close on click, but NOT if clicking value inputs or buttons (like Add To Cart)
                                                            const target = e.target as HTMLElement;
                                                            if (target.closest('button') || target.closest('input')) {
                                                                return;
                                                            }
                                                            handleClose();
                                                        }}
                                                    >
                                                        <ShopProductCard product={result} />
                                                    </div>
                                                ))}
                                            </div>
                                        </>
                                    ) : (
                                        <div className="text-center py-20">
                                            <div className="bg-gray-100 rounded-full h-20 w-20 flex items-center justify-center mx-auto mb-4">
                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                                </svg>
                                            </div>
                                            <h3 className="text-lg font-medium text-gray-900">No results found</h3>
                                            <p className="text-gray-500">Try adjusting your search or filters.</p>
                                        </div>
                                    )}
                                </main>

                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
