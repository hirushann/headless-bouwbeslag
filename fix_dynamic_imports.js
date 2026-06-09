const fs = require('fs');

function makeDynamic(file) {
    let content = fs.readFileSync(file, 'utf8');

    // Make sure we have next/dynamic imported
    if (!content.includes('import dynamic from "next/dynamic";')) {
        content = content.replace('import Link from "next/link";', 'import Link from "next/link";\nimport dynamic from "next/dynamic";');
    }

    // Replace static imports with dynamic imports
    content = content.replace('import RecommendedProductItem from "@/components/RecommendedProductItem";', 'const RecommendedProductItem = dynamic(() => import("@/components/RecommendedProductItem"), { ssr: false });');
    content = content.replace('import ReviewsSection from "@/components/ReviewsSection";', 'const ReviewsSection = dynamic(() => import("@/components/ReviewsSection"), { ssr: false });');

    fs.writeFileSync(file, content);
}

makeDynamic('src/app/[...slug]/ProductPageClient.tsx');
makeDynamic('src/app/product-template-2/[...slug]/ProductPageClientV2.tsx');
