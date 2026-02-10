"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

export default function CategoryBreadcrumbs({ categoryNames }: { categoryNames: string[] }) {
  const pathname = usePathname();
  const segments = pathname.split('/').filter(Boolean);
  
  return (
    <div className="text-sm text-gray-500 mb-6 flex items-center gap-2 flex-wrap">
      <Link href="/" className="hover:underline flex items-center gap-1 text-black font-medium">
        <span><svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="size-4"><path strokeLinecap="round" strokeLinejoin="round" d="m2.25 12 8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" /></svg></span>
        <span>Home</span>
      </Link>
      {segments.map((segment, index) => {
        const href = `/${segments.slice(0, index + 1).join('/')}`;
        const isLast = index === segments.length - 1;
        const name = categoryNames[index] || segment;
        
        return (
          <React.Fragment key={href}>
            <span className="text-gray-400">/</span>
            {isLast ? (
              <span className="text-black font-medium">{name}</span>
            ) : (
              <Link href={href} className="hover:underline hover:text-black">
                {name}
              </Link>
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}
