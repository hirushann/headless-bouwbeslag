"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";

interface RatingData {
  status: string;
  data: {
    amount: number;
    rating_average: number;
  };
}

interface WebwinkelKeurWidgetProps {
  variant?: "header" | "footer";
}

export default function WebwinkelKeurWidget({ variant = "header" }: WebwinkelKeurWidgetProps) {
  const [data, setData] = useState<RatingData | null>(null);

  useEffect(() => {
    fetch("/api/webwinkelkeur")
      .then((res) => res.json())
      .then((res) => {
        if (res.status === "success") {
          setData(res);
        }
      })
      .catch((err) => console.error("Widget load error", err));
  }, []);

  if (!data) return null;

  let score = data.data.rating_average;
  if (score <= 5) score = score * 2; // Normalize to 10 scale if needed

  const formattedScore = score.toFixed(1).replace(".", ",");

  // const webwinkelUrl = "https://www.webwinkelkeur.nl/leden/Bouwbeslag-nl_11199";
  const webwinkelUrl = "https://www.webwinkelkeur.nl/webshop/Bouwbeslag-nl_11199";

  if (variant === "footer") {
    // Footer Design: Stacked / Dark Theme compatible
    // Logo Left (Big), Right: Stars+Score on top, Reviews on bottom
    return (
      <a
        href={webwinkelUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center gap-3 group hover:opacity-90 transition-opacity no-underline"
        title="Bekijk onze beoordelingen op WebwinkelKeur"
      >
        {/* Large Logo */}
        <div className="w-12 h-12 flex-shrink-0 relative">
          <Image 
            className="object-contain" 
            src="/Webwinkelicon.webp" 
            alt="WebwinkelKeur Logo" 
            width={48}
            height={48}
          />
        </div>

        <div className="flex flex-col">
           {/* Top Row: Stars + Score */}
           <div className="flex items-center gap-2">
              <div className="flex text-[#FF9E0D]">
                {[1, 2, 3, 4, 5].map((i) => (
                    <svg key={i} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="size-5">
                    <path fillRule="evenodd" d="M10.788 3.21c.448-1.077 1.976-1.077 2.424 0l2.082 5.007 5.404.433c1.164.093 1.636 1.545.749 2.305l-4.117 3.527 1.257 5.273c.271 1.136-.964 2.033-1.96 1.425L12 18.354 7.373 21.18c-.996.608-2.231-.29-1.96-1.425l1.257-5.273-4.117-3.527c-.887-.76-.415-2.212.749-2.305l5.404-.433 2.082-5.006z" clipRule="evenodd" />
                    </svg>
                ))}
            </div>
            <span className="text-white font-semibold !text-sm leading-none pt-1">({formattedScore})</span>
           </div>
           
           {/* Bottom Row: Reviews */}
           <span className="text-white text-sm font-medium">
             {data.data.amount} Reviews
           </span>
        </div>
      </a>
    );
  }

  // Header Design (Default)
  return (
    <a
      href={webwinkelUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-center gap-2 group hover:opacity-80 transition-opacity"
      title="Bekijk onze beoordelingen op WebwinkelKeur"
    >
      <div className="text-[#FF0082] relative">
        <Image 
          className="hidden lg:block object-contain" 
          src="/Webwinkelicon.webp" 
          alt="WebwinkelKeur" 
          width={24}
          height={24}
        />
      </div>

      <div className="flex items-center gap-2 text-[#3D4752] font-sans text-sm">
        <span className="font-bold text-[#3D4752] text-md">({formattedScore})</span>
        
        <div className="flex text-[#FF9E0D]">
             {[1, 2, 3, 4, 5].map((i) => (
                <svg key={i} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="size-4">
                  <path fillRule="evenodd" d="M10.788 3.21c.448-1.077 1.976-1.077 2.424 0l2.082 5.007 5.404.433c1.164.093 1.636 1.545.749 2.305l-4.117 3.527 1.257 5.273c.271 1.136-.964 2.033-1.96 1.425L12 18.354 7.373 21.18c-.996.608-2.231-.29-1.96-1.425l1.257-5.273-4.117-3.527c-.887-.76-.415-2.212.749-2.305l5.404-.433 2.082-5.006z" clipRule="evenodd" />
                </svg>
             ))}
        </div>

        <span className="text-gray-600 font-medium">
            {data.data.amount} Reviews
        </span>
      </div>
    </a>
  );
}
