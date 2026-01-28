"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

import { searchProducts, SearchResult } from "@/actions/search";

export default function SearchAutosuggest({
    placeholder = "Zoek iets...",
    className = "",
}: {
    placeholder?: string;
    className?: string;
}) {
    const [query, setQuery] = useState("");
    const [results, setResults] = useState<SearchResult[]>([]);
    const [showDropdown, setShowDropdown] = useState(false);
    const [loading, setLoading] = useState(false);
    const router = useRouter();
    const containerRef = useRef<HTMLDivElement>(null);

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (
                containerRef.current &&
                !containerRef.current.contains(event.target as Node)
            ) {
                setShowDropdown(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, []);

    useEffect(() => {
        const delayDebounceFn = setTimeout(async () => {
            if (query.trim().length >= 2) {
                setLoading(true);
                try {
                    const hits = await searchProducts(query);
                    setResults(hits);
                    setShowDropdown(true);
                } catch (error) {
                    console.error("Search error:", error);
                } finally {
                    setLoading(false);
                }
            } else {
                setResults([]);
                setShowDropdown(false);
            }
        }, 300);

        return () => clearTimeout(delayDebounceFn);
    }, [query]);

    const handleCreateSearch = (e: React.FormEvent) => {
        e.preventDefault();
        if (query.trim()) {
            setShowDropdown(false);
            router.push(`/search?q=${encodeURIComponent(query)}`);
        }
    };

    return (
        <div ref={containerRef} className={`relative w-full ${className}`}>
            <form
                onSubmit={handleCreateSearch}
                className="join w-full border border-[#E2E2E2] rounded-[4px] bg-white"
            >
                <div className="w-full rounded-[4px]">
                    <label className="input validator w-full border-0 rounded-[5px] bg-white flex items-center gap-2 p-0 px-3">
                        <input
                            className="bg-white w-full h-full py-2 outline-none text-base"
                            type="text"
                            placeholder={placeholder}
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            onFocus={() => {
                                if (results.length > 0) setShowDropdown(true);
                            }}
                        />
                    </label>
                </div>
                <button
                    type="submit"
                    className="btn bg-[#2332C51A] rounded-[4px] border-0 shadow-none px-4"
                    id="headersearchbutton" 
                    aria-label="Search"
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

            {showDropdown && results.length > 0 && (
                <div className="absolute top-full left-0 w-full bg-white shadow-lg rounded-b-md border border-t-0 border-[#E2E2E2] z-50 overflow-hidden">
                    <ul>
                        {results.map((result) => (
                            <li key={result.ID} className="border-b border-gray-100 last:border-0">
                                <Link
                                    href={`/${result.post_name}`}
                                    className="block px-4 py-3 hover:bg-gray-50 text-sm text-gray-700"
                                    onClick={() => setShowDropdown(false)}
                                >
                                    <span dangerouslySetInnerHTML={{ __html: result.post_title }} />
                                </Link>
                            </li>
                        ))}
                    </ul>
                </div>
            )}
        </div>
    );
}
