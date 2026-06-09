const fs = require('fs');
const file = 'src/app/[...slug]/ProductPageClient.tsx';
let content = fs.readFileSync(file, 'utf8');

// Ensure import Image from "next/image";
if (content.includes('// import Image from "next/image";')) {
    content = content.replace('// import Image from "next/image";', 'import Image from "next/image";');
} else if (!content.includes('import Image from "next/image";')) {
    content = content.replace('import Link from "next/link";', 'import Link from "next/link";\nimport Image from "next/image";');
}

// 1. Gallery Image
content = content.replace(
    `className="pswp-gallery-item cursor-zoom-in block"
                    >
                      <img src={img.src} alt={\`Product view \${idx + 1}\`} className="w-full h-auto rounded-lg object-contain bg-white aspect-square max-h-[280px] lg:max-h-none" />`,
    `className="pswp-gallery-item cursor-zoom-in block relative w-full aspect-square max-h-[280px] lg:max-h-none rounded-lg overflow-hidden"
                    >
                      <Image src={img.src} alt={\`Product view \${idx + 1}\`} fill sizes="(max-width: 1024px) 100vw, 50vw" className="object-contain bg-white" />`
);

// 2. Thumbnails
content = content.replace(
    `className={\`items-center justify-center border aspect-square rounded-md overflow-hidden flex-shrink-0 transition-all \${selectedImage === thumb.src ? 'border-blue-600 ring-2 ring-blue-100' : 'border-gray-200 hover:border-blue-400'}\`} aria-label={\`Thumbnail \${globalIdx + 1}\`} type="button">
                        <img src={thumb.src} alt={\`Thumbnail \${globalIdx + 1}\`} className="w-full h-full object-contain" />
                      </button>`,
    `className={\`items-center justify-center border aspect-square rounded-md overflow-hidden flex-shrink-0 transition-all relative \${selectedImage === thumb.src ? 'border-blue-600 ring-2 ring-blue-100' : 'border-gray-200 hover:border-blue-400'}\`} aria-label={\`Thumbnail \${globalIdx + 1}\`} type="button">
                        <Image src={thumb.src} alt={\`Thumbnail \${globalIdx + 1}\`} fill sizes="100px" className="object-contain" />
                      </button>`
);

// 3. Brand Logo
content = content.replace(
    `<Link prefetch={true} href={product?.brands?.[0]?.slug ? \`/merken/\${product.brands[0].slug}\` : "#"}>
                  <img
                    src={brandImageUrl}
                    alt="Brand Logo"
                    className="h-10 w-auto object-contain hover:opacity-80 transition-opacity"
                  />
                </Link>`,
    `<Link prefetch={true} href={product?.brands?.[0]?.slug ? \`/merken/\${product.brands[0].slug}\` : "#"} className="relative h-10 w-24 block">
                  <Image
                    src={brandImageUrl}
                    alt="Brand Logo"
                    fill
                    sizes="96px"
                    className="object-contain hover:opacity-80 transition-opacity"
                  />
                </Link>`
);

// 4. Related Models
content = content.replace(
    `<div className="h-32 w-full border border-[#E8E1DC] rounded-sm bg-white flex items-center justify-center overflow-hidden">
                            <img
                              src={fixImageSrc(model?.images?.[0]?.src || model?.resolved_cat_image)}
                              alt={model?.name || "Model"}
                              className="max-h-full max-w-full object-contain group-hover:scale-105 transition-transform duration-300"
                              loading="lazy"
                              decoding="async"
                            />
                          </div>`,
    `<div className="h-32 w-full border border-[#E8E1DC] rounded-sm bg-white flex items-center justify-center overflow-hidden relative">
                            <Image
                              src={fixImageSrc(model?.images?.[0]?.src || model?.resolved_cat_image)}
                              alt={model?.name || "Model"}
                              fill
                              sizes="128px"
                              className="object-contain p-2 group-hover:scale-105 transition-transform duration-300"
                            />
                          </div>`
);

// 5. Technical Drawing
content = content.replace(
    `<img
                        src={technicalDrawingUrl || ""}
                        className="w-full h-[500px] object-contain rounded-md border-0"
                        alt="Technische documentatie"
                      />`,
    `<div className="relative w-full h-[500px] rounded-md border-0 overflow-hidden">
                        <Image
                          src={technicalDrawingUrl || ""}
                          fill
                          sizes="(max-width: 1024px) 100vw, 50vw"
                          className="object-contain"
                          alt="Technische documentatie"
                        />
                      </div>`
);

// 6. Real Life Images
content = content.replace(
    `<img
                              src={img.url}
                              className='w-full h-34 lg:h-52 rounded-sm object-cover transition-transform duration-500 group-hover:scale-105'
                              alt={img.alt}
                            />`,
    `<Image
                              src={img.url}
                              fill
                              sizes="(max-width: 1024px) 50vw, 33vw"
                              className='rounded-sm object-cover transition-transform duration-500 group-hover:scale-105'
                              alt={img.alt || "Review image"}
                            />`
);

fs.writeFileSync(file, content);
