import React from 'react';
import Image from 'next/image';

interface FormulaBlockProps {
  data: {
    title: string;
    text?: string;
    formula_title?: string;
    formula_text?: string;
    image?: string;
  };
}

export default function FormulaBlock({ data }: FormulaBlockProps) {
  return (
    <div className="border-t border-[#E5E7EB] pt-12 flex flex-col lg:flex-row gap-10 items-center">
      <div className="flex-1 w-full lg:max-w-[50%]">
        <h2 className="text-[#1C2530] font-bold text-2xl lg:text-3xl mb-4">
          {data.title}
        </h2>
        {data.text && (
          <div 
            className="text-[#3D4752] text-base leading-relaxed mb-6"
            dangerouslySetInnerHTML={{ __html: data.text }} 
          />
        )}
        
        {data.formula_text && (
          <div className="bg-[#FFF8EA] rounded-xl p-6 relative">
            {/* Ruler Icon placeholder */}
            <div className="absolute left-6 top-6 w-8 h-8 text-[#F5A623]">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                <path d="M4 2h16c1.1 0 2 .9 2 2v4c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2zm0 2v4h16V4H4zm2 2v-2h2v2H6zm4 0v-2h2v2h-2zm4 0v-2h2v2h-2z" transform="rotate(45 12 12)" />
              </svg>
            </div>
            <div className="ml-12">
              <div 
                className="text-[#1C2530] font-semibold text-base [&>p]:mb-1 [&>strong]:font-bold"
                dangerouslySetInnerHTML={{ __html: data.formula_text }}
              />
            </div>
          </div>
        )}
      </div>

      {data.image && (
        <div className="flex-1 w-full flex justify-center items-center">
          <div className="relative w-full max-w-[400px] aspect-[4/3]">
            <Image
              src={data.image}
              alt={data.title}
              fill
              className="object-contain"
            />
          </div>
        </div>
      )}
    </div>
  );
}
