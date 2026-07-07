import React from 'react';
import Image from 'next/image';

interface HeroBlockProps {
  data: {
    category_tag: string;
    title: string;
    subtitle?: string;
    image: string;
  };
}

export default function HeroBlock({ data }: HeroBlockProps) {
  return (
    <div className="flex flex-col lg:flex-row items-center gap-10 mt-6 lg:mt-10">
      <div className="flex-1 max-w-2xl">
        <span className="text-[#F5A623] font-bold text-sm tracking-widest uppercase mb-4 block">
          {data.category_tag}
        </span>
        <h1 className="text-[#1C2530] font-bold text-4xl lg:text-6xl leading-tight mb-6">
          {data.title}
        </h1>
        {data.subtitle && (
          <p className="text-[#3D4752] text-lg lg:text-xl leading-relaxed">
            {data.subtitle}
          </p>
        )}
      </div>
      <div className="flex-1 w-full relative min-h-[300px] lg:min-h-[400px] rounded-full lg:rounded-bl-[100px] bg-[#F2F6F9] overflow-hidden flex items-center justify-center p-8">
        <Image
          src={data.image}
          alt={data.title}
          fill
          className="object-contain p-4 lg:p-10 scale-110"
        />
      </div>
    </div>
  );
}
