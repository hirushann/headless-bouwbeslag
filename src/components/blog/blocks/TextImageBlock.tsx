import React from 'react';
import Image from 'next/image';

interface TextImageBlockProps {
  data: {
    title: string;
    text: string;
    image?: string;
    image_position?: 'left' | 'right';
  };
}

export default function TextImageBlock({ data }: TextImageBlockProps) {
  const isLeft = data.image_position === 'left';
  
  return (
    <div className={`flex flex-col lg:flex-row items-start gap-10 border-t border-[#E5E7EB] pt-12 ${isLeft ? 'lg:flex-row-reverse' : ''}`}>
      <div className="flex-1 w-full lg:max-w-[50%]">
        <h2 className="text-[#1C2530] font-bold text-2xl lg:text-3xl mb-4">
          {data.title}
        </h2>
        <div 
          className="text-[#3D4752] text-base leading-relaxed space-y-4 [&>p]:mb-4"
          dangerouslySetInnerHTML={{ __html: data.text }} 
        />
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
