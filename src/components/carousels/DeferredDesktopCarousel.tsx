"use client";

import dynamic from "next/dynamic";
import { useEffect, useRef, useState } from "react";

const BestSellersCarousel = dynamic(() => import("./BestSellers"), {
  ssr: false,
});

const RecommendedCarousel = dynamic(() => import("./Recommended"), {
  ssr: false,
});

export default function DeferredDesktopCarousel({
  products,
  variant,
}: {
  products: any[];
  variant: "best-sellers" | "recommended";
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [shouldRender, setShouldRender] = useState(false);

  useEffect(() => {
    if (!window.matchMedia("(min-width: 1024px)").matches) return;

    const container = containerRef.current;
    if (!container) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        setShouldRender(true);
        observer.disconnect();
      },
      { rootMargin: "0px", threshold: 0.01 },
    );

    observer.observe(container);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={containerRef}
      className={variant === "best-sellers" ? "hidden min-h-[598px] lg:block" : "hidden min-h-[560px] lg:block"}
    >
      {shouldRender ? (
        variant === "best-sellers" ? (
          <BestSellersCarousel products={products} />
        ) : (
          <RecommendedCarousel products={products} />
        )
      ) : null}
    </div>
  );
}
