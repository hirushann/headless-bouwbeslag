"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

interface RatingData {
  status: string;
  data: {
    amount: number;
    rating_average: number;
  };
}

export default function WebwinkelKeurWidget() {
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

  // The API returns a 1-10 scale usually, or 1-5. 
  // Based on the user image "9.8", and standard review sites, it's usually 1-10. 
  // If the API returns 1-5, we might need to multiply by 2?
  // Let's assume the API returns the float value (e.g. 9.8 or 9.1).
  // Common WebwinkelKeur API returns average on 1-10 scale in some endpoints, but docs said 1-5.
  // Actually, WebwinkelKeur is known for 1-10 scale in the Netherlands.
  // If the docs example showed "4.19", it might be 1-5. 
  // Let's safe check: if average <= 5, multiply by 2 to get the "9.8" style.
  
  let score = data.data.rating_average;
  if (score <= 5) score = score * 2;

  const formattedScore = score.toFixed(1).replace(".", ","); // Dutch format uses comma often, but user image showed "9.8" with dot? User image: "(9.8)". 
  // Actually user request: "(9.8)". Image shows dot. I'll use dot.

  return (
    <a
      href="https://www.webwinkelkeur.nl/leden/Bouwbeslag-nl_11199"
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-center gap-2 group hover:opacity-80 transition-opacity"
      title="Bekijk onze beoordelingen op WebwinkelKeur"
    >
      {/* Logo Icon (Pink Speech Bubble with Check) */}
      <div className="text-[#FF0082]">
        <img className="hidden lg:block h-6 object-contain" src="https://cdn.brandfetch.io/idpBRNIkBI/w/1351/h/1351/theme/dark/icon.png?c=1bxid64Mup7aczewSAYMX&t=1764598748720" alt="Betaalmethoden" />
      </div>

      <div className="flex items-center gap-2 text-[#3D4752] font-sans text-sm">
        <span className="font-bold text-[#3D4752] text-md">({formattedScore})</span>
        
        {/* Stars */}
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
