import React from 'react';
import Image from 'next/image';
import Link from 'next/link';

interface CtaBannerBlockProps {
  data: {
    icon?: string;
    title: string;
    description?: string;
    button_text: string;
    button_link: string;
  };
}

export default function CtaBannerBlock({ data }: CtaBannerBlockProps) {
  return (
    <div className="bg-[#F2F6F9] rounded-xl p-6 lg:p-8 flex flex-col lg:flex-row items-center gap-6 mt-12 mb-12 border border-[#EAEAEA]">
      {data.icon && (
        <div className="w-16 h-16 shrink-0 relative">
          <Image 
            src={data.icon} 
            alt="CTA Icon" 
            fill 
            className="object-contain" 
          />
        </div>
      )}
      <div className="flex-1 text-center lg:text-left">
        <h3 className="text-[#1C2530] font-bold text-xl lg:text-2xl mb-1">
          {data.title}
        </h3>
        {data.description && (
          <p className="text-[#3D4752] text-sm lg:text-base">
            {data.description}
          </p>
        )}
      </div>
      <div className="shrink-0 mt-4 lg:mt-0">
        <Link 
          href={data.button_link || '#'}
          className="bg-[#1C2530] text-white px-6 py-3 rounded text-sm font-semibold hover:bg-black transition-colors flex items-center gap-2"
        >
          {data.button_text}
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M7 1L13 7M13 7L7 13M13 7H1" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </Link>
      </div>
    </div>
  );
}
