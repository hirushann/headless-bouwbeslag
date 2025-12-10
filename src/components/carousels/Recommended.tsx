"use client";

import { useRef, useState, useEffect } from "react";
import ProductCard from "@/components/ProductCard";

interface RecomendedCarouselProps {
  products: any[];
}

export default function RecommendedCarousel({ products }: RecomendedCarouselProps) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [atStart, setAtStart] = useState(true);
  const [atEnd, setAtEnd] = useState(false);

  useEffect(() => {
    const el = trackRef.current;
    if (!el) return;

    const onScroll = () => {
      const { scrollLeft, scrollWidth, clientWidth } = el;
      setAtStart(scrollLeft <= 1);
      setAtEnd(scrollLeft + clientWidth >= scrollWidth - 1);
    };

    onScroll();
    el.addEventListener("scroll", onScroll);
    return () => el.removeEventListener("scroll", onScroll);
  }, [products]);

  const scroll = (dir: 1 | -1) => {
    const el = trackRef.current;
    if (!el) return;

    const card = el.querySelector("div.snap-start") as HTMLElement;
    const amount = card ? card.offsetWidth + 16 : 300;

    el.scrollBy({ left: dir * amount, behavior: "smooth" });
  };

  return (
    <div className="hidden lg:block w-full py-10">
      <div className="flex justify-between items-center mb-2">
        <h2 className="text-3xl font-bold text-[#1C2530]">Recommended for you</h2>
        <div className="flex gap-2">
          <button onClick={() => scroll(-1)} disabled={atStart} className="btn btn-circle disabled:opacity-40 disabled:cursor-not-allowed hover:bg-[#0066FF] hover:text-white">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640" width="20" height="20"fill="currentColor" className="transition-colors"><path d="M201.4 297.4C188.9 309.9 188.9 330.2 201.4 342.7L361.4 502.7C373.9 515.2 394.2 515.2 406.7 502.7C419.2 490.2 419.2 469.9 406.7 457.4L269.3 320L406.6 182.6C419.1 170.1 419.1 149.8 406.6 137.3C394.1 124.8 373.8 124.8 361.3 137.3L201.3 297.3z"/></svg>
          </button>
          <button onClick={() => scroll(1)} disabled={atEnd} className="btn btn-circle disabled:opacity-40 disabled:cursor-not-allowed hover:bg-[#0066FF] hover:text-white">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640" width="20" height="20"fill="currentColor" className="transition-colors"><path d="M439.1 297.4C451.6 309.9 451.6 330.2 439.1 342.7L279.1 502.7C266.6 515.2 246.3 515.2 233.8 502.7C221.3 490.2 221.3 469.9 233.8 457.4L371.2 320L233.9 182.6C221.4 170.1 221.4 149.8 233.9 137.3C246.4 124.8 266.7 124.8 279.2 137.3L439.2 297.3z"/></svg>
          </button>
        </div>
      </div>

      <div ref={trackRef} className="flex gap-4 overflow-x-auto snap-x no-scrollbar">
        {(Array.isArray(products) ? products : []).map((p) => (
          <div key={p.id} className="snap-start shrink-0 w-[24%]">
            <ProductCard product={p} />
          </div>
        ))}
      </div>
    </div>
  );
}