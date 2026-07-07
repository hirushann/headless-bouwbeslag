import React from 'react';
import Image from 'next/image';

interface VariantItem {
  title: string;
  text?: string;
  icon?: string;
  image?: string;
}

interface VariantsGridBlockProps {
  data: {
    title: string;
    description?: string;
    items: VariantItem[];
  };
}

export default function VariantsGridBlock({ data }: VariantsGridBlockProps) {
  return (
    <div className="border-t border-[#E5E7EB] pt-12 flex flex-col gap-6">
      <div>
        <h2 className="text-[#1C2530] font-bold text-2xl lg:text-3xl mb-3">
          {data.title}
        </h2>
        {data.description && (
          <p className="text-[#3D4752] text-base max-w-3xl">
            {data.description}
          </p>
        )}
      </div>

      {data.items && data.items.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-4">
          {data.items.map((item, idx) => (
            <div 
              key={idx} 
              className="border border-[#EAEAEA] rounded-xl p-6 flex flex-col relative overflow-hidden shadow-sm min-h-[160px]"
            >
              <div className="flex justify-between items-start mb-4 relative z-10">
                <div className="flex items-center gap-3">
                  {item.icon ? (
                    <div className="w-8 h-8 relative shrink-0">
                      <Image src={item.icon} alt="icon" fill className="object-contain" />
                    </div>
                  ) : (
                    <div className="w-8 h-8 rounded border border-gray-300 flex items-center justify-center bg-white shrink-0">
                    </div>
                  )}
                  <h3 className="text-[#1C2530] font-semibold text-lg max-w-[140px]">
                    {item.title}
                  </h3>
                </div>
              </div>
              
              <p className="text-[#3D4752] text-sm leading-relaxed max-w-[200px] z-10 relative">
                {item.text}
              </p>

              {item.image && (
                <div className="absolute right-0 bottom-0 w-24 h-24 sm:w-32 sm:h-32 translate-x-2 translate-y-2 opacity-90 z-0">
                  <Image
                    src={item.image}
                    alt={item.title}
                    fill
                    className="object-contain"
                  />
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
