import React from 'react';
import HeroBlock from './blocks/HeroBlock';
import TextImageBlock from './blocks/TextImageBlock';
import VariantsGridBlock from './blocks/VariantsGridBlock';
import FormulaBlock from './blocks/FormulaBlock';
import TipsConclusionBlock from './blocks/TipsConclusionBlock';
import CtaBannerBlock from './blocks/CtaBannerBlock';

export interface ContentBlock {
  type: string;
  data: any;
}

interface BlockRendererProps {
  blocks: ContentBlock[];
}

export default function BlockRenderer({ blocks }: BlockRendererProps) {
  if (!blocks || !Array.isArray(blocks) || blocks.length === 0) {
    return null;
  }

  return (
    <div className="flex flex-col gap-12 lg:gap-16 pb-12 w-full">
      {blocks.map((block, index) => {
        switch (block.type) {
          case 'hero':
            return <HeroBlock key={index} data={block.data} />;
          case 'text_image':
            return <TextImageBlock key={index} data={block.data} />;
          case 'variants_grid':
            return <VariantsGridBlock key={index} data={block.data} />;
          case 'formula':
            return <FormulaBlock key={index} data={block.data} />;
          case 'tips_conclusion':
            return <TipsConclusionBlock key={index} data={block.data} />;
          case 'cta_banner':
            return <CtaBannerBlock key={index} data={block.data} />;
          default:
            return (
              <div key={index} className="p-4 border border-dashed border-red-500 text-red-500">
                Unknown block type: {block.type}
              </div>
            );
        }
      })}
    </div>
  );
}
