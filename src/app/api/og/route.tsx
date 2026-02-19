
import { ImageResponse } from 'next/og';
import api from '@/lib/woocommerce';

export const runtime = 'edge';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const slug = searchParams.get('slug');

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://bouwbeslag.nl';
  const logoUrl = `${siteUrl}/logo.webp`;

  let title = 'Bouwbeslag';
  let imageUrl = logoUrl;
  let label = 'Bekijk nu';

  if (slug) {
    try {
        const currentSlug = decodeURIComponent(slug);

        // 1. Try Product
        const pRes = await api.get("products", {
            slug: currentSlug,
            _fields: "id,name,images,price,regular_price,sale_price"
        });

        if (pRes.data && pRes.data.length > 0) {
            const product = pRes.data[0];
            title = product.name;
            if (product.images && product.images.length > 0) {
                imageUrl = product.images[0].src;
            }
            label = 'Bestel direct';
        } else {
            // 2. Try Category
            const cRes = await api.get("products/categories", {
                slug: currentSlug,
                _fields: "id,name,image"
            });

            if (cRes.data && cRes.data.length > 0) {
                const category = cRes.data[0];
                title = category.name;
                if (category.image && category.image.src) {
                    imageUrl = category.image.src;
                }
                label = 'Bekijk assortiment';
            }
        }
    } catch(e) {
        console.error("OG Image Error:", e);
    }
  }

  return new ImageResponse(
    (
      <div
        style={{
          background: 'white',
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {/* Left/Main Image Section */}
        <div style={{
            display: 'flex',
            flex: 1,
            height: '100%',
            justifyContent: 'center',
            alignItems: 'center',
            padding: '40px',
            background: '#f8fafc',
        }}>
            {/* Using img tag with absolute URL */}
            <img 
                src={imageUrl} 
                height="500" 
                style={{ 
                    objectFit: 'contain', 
                    maxHeight: '550px', 
                    maxWidth: '100%',
                    borderRadius: '12px'
                }} 
            />
        </div>

        {/* Right Info Section */}
        <div style={{
            display: 'flex',
            flex: 0.8,
            height: '100%',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'flex-start',
            padding: '60px',
            background: 'white',
        }}>
             {/* Logo */}
             <img src={logoUrl} width="200" style={{ objectFit: "contain", marginBottom: '40px' }} />

             {/* Title */}
             <div style={{ 
                 fontSize: 50, 
                 fontWeight: 'bold', 
                 color: '#1e293b', 
                 marginBottom: '20px', 
                 lineHeight: 1.2,
                 display: 'flex',
                 flexWrap: 'wrap'
             }}>
                {title}
             </div>

             {/* CTA Button */}
             <div style={{
                 background: '#0066FF',
                 color: 'white',
                 fontSize: 28,
                 fontWeight: 'bold',
                 padding: '16px 40px',
                 borderRadius: '50px',
                 marginTop: '40px',
                 display: 'flex',
                 alignItems: 'center',
                 justifyContent: 'center',
             }}>
                 {label}
             </div>
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
    }
  );
}
