import React from 'react';
import Image from 'next/image';

interface TipItem {
  tip_text: string;
}

interface TipsConclusionBlockProps {
  data: {
    tips?: TipItem[];
    conclusion_title?: string;
    conclusion_text?: string;
    conclusion_cta?: string;
    conclusion_icon?: string;
  };
}

export default function TipsConclusionBlock({ data }: TipsConclusionBlockProps) {
  return (
    <div className="border-t border-[#E5E7EB] pt-12 grid grid-cols-1 md:grid-cols-2 gap-10">
      <div>
        <h2 className="text-[#1C2530] font-bold text-2xl mb-6">
          Handige tips
        </h2>
        {data.tips && data.tips.length > 0 && (
          <ul className="flex flex-col gap-4">
            {data.tips.map((tip, idx) => (
              <li key={idx} className="flex items-start gap-3">
                <div className="w-5 h-5 rounded-full bg-[#1C2530] text-white flex items-center justify-center shrink-0 mt-0.5">
                  <svg className="w-3 h-3" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M10 3L4.5 8.5L2 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
                <span className="text-[#3D4752] text-sm md:text-base">{tip.tip_text}</span>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div>
        <h2 className="text-[#1C2530] font-bold text-2xl mb-4">
          {data.conclusion_title || "Conclusie"}
        </h2>
        {data.conclusion_text && (
          <div 
            className="text-[#3D4752] text-sm md:text-base leading-relaxed mb-4 [&>p]:mb-4"
            dangerouslySetInnerHTML={{ __html: data.conclusion_text }}
          />
        )}
        <div className="flex items-center gap-4 mt-6">
          <p className="font-bold text-[#1C2530]">
            {data.conclusion_cta}
          </p>
          {data.conclusion_icon && (
            <div className="w-12 h-12 rounded-full bg-[#F5A623] flex items-center justify-center overflow-hidden relative">
              <Image 
                src={data.conclusion_icon} 
                alt="Conclusion Icon" 
                fill 
                className="object-cover p-2" 
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
