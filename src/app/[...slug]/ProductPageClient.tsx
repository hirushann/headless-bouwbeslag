"use client";
import axios from 'axios';
import React, { useState, useRef, useEffect, use } from 'react';
import { useUserContext } from "@/context/UserContext";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";
import { checkStockAction, fetchProductByIdAction, fetchProductBySkuAction } from "@/app/actions";
import Link from "next/link";
import Image from "next/image";
import ProductCard from "@/components/ProductCard";
import RecommendedProductItem from "@/components/RecommendedProductItem";
import { useCartStore } from "@/lib/cartStore";
import { fetchMedia } from "@/lib/wordpress";
import { COLOR_MAP } from "@/config/colorMap";
import { getDeliveryInfo } from "@/lib/deliveryUtils";
import ReviewsSection from "@/components/ReviewsSection";
import PhotoSwipeLightbox from 'photoswipe/lightbox';
import 'photoswipe/dist/photoswipe.css';
import { useProductAddedModal } from "@/context/ProductAddedModalContext";

const formatSpecValue = (value: string | number | null | undefined): string => {
  if (value === null || value === undefined) return "";
  const strVal = String(value);
  if (!isNaN(Number(strVal)) && strVal.trim() !== "") {
    return String(parseFloat(strVal));
  }
  return strVal;
};

export default function ProductPageClient({ product, taxRate = 21, slug }: { product: any; taxRate?: number; slug?: string[] }) {
  useEffect(() => {
  }, [product]);

  const fadeInUp = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.5 }
    }
  };

  const staggerContainer = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };
  const addItem = useCartStore((state) => state.addItem);
  const items = useCartStore((state) => state.items);
  const [selectedImage, setSelectedImage] = useState('/afbeelding.webp');
  const [galleryImages, setGalleryImages] = useState<any[]>([]);
  const [currentUrl, setCurrentUrl] = useState("");


  useEffect(() => {
    setCurrentUrl(window.location.href);
  }, []); // Only run once for URL

  const { userRole, isLoading } = useUserContext();

  useEffect(() => {
    // console.log("💰 VAT Rate (from Server):", taxRate);
  }, [taxRate]);

  // ✅ Initialize gallery images from SSR product
  useEffect(() => {
    const imgs =
      Array.isArray(product.images)
        ? product.images.filter((img: any) => !!img?.src).map((img: any) => ({
          src: img.src,
          width: img.width || 1200,
          height: img.height || 1200,
          alt: img.alt || product.name
        }))
        : [];

    if (imgs.length > 0) {
      setGalleryImages(imgs);
      setSelectedImage((prev) =>
        prev && prev !== "/afbeelding.webp" ? prev : imgs[0].src
      );
    }
  }, [product]);

  useEffect(() => {
    let lightbox = new PhotoSwipeLightbox({
      gallery: '.pswp-gallery',
      children: 'a.pswp-gallery-item',
      pswpModule: () => import('photoswipe'),
    });
    lightbox.init();

    return () => {
      lightbox.destroy();
      lightbox = null as any;
    };
  }, []);
  const [thumbIndex, setThumbIndex] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [selectedDiscount, setSelectedDiscount] = useState<number | null>(null);
  // --- DISCOUNTS LOGIC ---
  const discounts = React.useMemo(() => {
    const arr: { quantity: number; percentage: number }[] = [];
    if (!product?.meta_data) return arr;
    for (let i = 1; i <= 3; i++) {
      const qRaw = product.meta_data.find((m: any) => m.key === `crucial_data_discounts_discount_quantity_${i}`)?.value;
      const pRaw = product.meta_data.find((m: any) => m.key === `crucial_data_discounts_discount_percentage_${i}`)?.value;
      const q = qRaw && !isNaN(parseInt(qRaw)) ? parseInt(qRaw) : null;
      const p = pRaw && !isNaN(parseInt(pRaw)) ? parseInt(pRaw) : null;
      if (q !== null && p !== null) {
        arr.push({ quantity: q, percentage: p });
      }
    }
    return arr.sort((a, b) => a.quantity - b.quantity);
  }, [product]);




  // --- PRICE CALCULATION LOGIC (Hoisted) ---
  const getMeta = (key: string) => product?.meta_data?.find((m: any) => m.key === key)?.value;

  // Dynamic Price Logic
  const isB2B = userRole && (userRole.includes("b2b_customer") || userRole.includes("administrator"));

  let sale = 0;

  if (isB2B) {
    // B2B Logic: Check ACF field first
    const b2bKey = "crucial_data_b2b_and_b2c_sales_price_b2b";
    const acfB2BPriceRaw = getMeta(b2bKey);

    if (acfB2BPriceRaw && !isNaN(parseFloat(acfB2BPriceRaw))) {
      sale = parseFloat(acfB2BPriceRaw);
    } else {
      // Fallback to standard price
      if (product.regular_price) {
        sale = parseFloat(product.regular_price);
      } else if (product.price) {
        sale = parseFloat(product.price);
      }
    }
  } else {
    // B2C Logic
    sale = product.price ? parseFloat(product.price) : 0;
    const b2cKey = "crucial_data_b2b_and_b2c_sales_price_b2c";
    const acfPriceRaw = getMeta(b2cKey);
    if (acfPriceRaw && !isNaN(parseFloat(acfPriceRaw))) {
      sale = parseFloat(acfPriceRaw);
    }
  }

  const advisedRaw = getMeta("crucial_data_unit_price");
  const advised = advisedRaw && !isNaN(parseFloat(advisedRaw)) ? parseFloat(advisedRaw) : null;

  // Tax Logic
  const taxMultiplier = 1 + (taxRate / 100);
  const finalPrice = isB2B ? sale : (sale ? sale * taxMultiplier : 0);
  const taxLabel = isB2B ? "(excl. BTW)" : "(incl. BTW)";

  // Base Price for Total Display (Inc/Ex VAT dependent on role)
  let displayBasePrice = finalPrice ?? advised ?? 0;
  // Base Price for Cart (Always Ex-VAT 'sale' price, logic handled below)
  let cartBasePrice = sale;

  let discountPercent: number | null = null;
  if (advised && sale && advised > 0) {
    const advisedWithTax = advised * taxMultiplier;
    const comparePrice = isB2B ? sale : (sale ? sale * taxMultiplier : 0);
    discountPercent = Math.round(((advisedWithTax - comparePrice) / advisedWithTax) * 100);
  }

  // Apply volume discount if selected
  if (selectedDiscount !== null) {
    const pct = discounts[selectedDiscount]?.percentage ?? 0;
    if (pct > 0) {
      displayBasePrice = displayBasePrice - (displayBasePrice * pct) / 100;
      cartBasePrice = cartBasePrice - (cartBasePrice * pct) / 100;
    }
  }

  const totalPrice = displayBasePrice * quantity;
  const currency = product.currency_symbol || "€";


  const [brandImageUrl, setBrandImageUrl] = useState<string | null>(null);

  useEffect(() => {
    // Use the logoUrl that was fetched server-side in page.tsx
    setBrandImageUrl(product?.brands?.[0]?.logoUrl || null);
  }, [product]);



  // Find highest applicable tier for a given quantity
  const findDiscountIndex = React.useCallback((qty: number) => {
    let idx = -1;
    for (let i = 0; i < discounts.length; i++) {
      if (qty >= discounts[i].quantity) idx = i;
    }
    return idx;
  }, [discounts]);

  const addToCartRef = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        // Show sticky footer only when the main button is scrolled OUT of view (top < 0)
        setIsVisible(!entry.isIntersecting && entry.boundingClientRect.top < 0);
      },
      {
        threshold: 0,
        rootMargin: "0px"
      }
    );

    if (addToCartRef.current) {
      observer.observe(addToCartRef.current);
    }

    return () => {
      observer.disconnect();
    };
  }, []);


  // When quantity changes, auto-select the right tier
  useEffect(() => {
    if (discounts.length === 0) {
      if (selectedDiscount !== null) setSelectedDiscount(null);
      return;
    }
    const idx = findDiscountIndex(quantity);
    setSelectedDiscount(idx >= 0 ? idx : null);
  }, [quantity, discounts, findDiscountIndex]);

  // When user selects a tier, snap quantity to that tier's minimum
  const onDiscountToggle = (idx: number) => {
    if (selectedDiscount === idx) {
      setSelectedDiscount(null);
      setQuantity(1);
      return;
    }
    setSelectedDiscount(idx);
    const targetQty = discounts[idx]?.quantity ?? 1;
    setQuantity(targetQty > 0 ? targetQty : 1);
  };
  const [technicalDrawingUrl, setTechnicalDrawingUrl] = useState<string | null>(null);

  // Related products state
  const [relatedProducts, setRelatedProducts] = useState<any[]>([]);
  // Matching accessories products state
  const [matchingProducts, setMatchingProducts] = useState<any[]>([]);
  const [matchingKnobroseKeys, setMatchingKnobRoseProducts] = useState<any[]>([]);
  const [matchingRoseKeys, setMatchingRoseKeys] = useState<any[]>([]);
  const [pcroseKeys, setPcRoseKeys] = useState<any[]>([]);
  const [blindtoiletroseKeys, setblindtoiletroseKeys] = useState<any[]>([]);
  const [musthaveprodKeys, setMusthaveprodKeys] = useState<any[]>([]);

  const accessoriesRef = useRef<HTMLDivElement>(null);
  const knobroseRef = useRef<HTMLDivElement>(null);
  const keyrosesRef = useRef<HTMLDivElement>(null);
  const cillinderrosesRef = useRef<HTMLDivElement>(null);
  const blindrosesRef = useRef<HTMLDivElement>(null);
  const mustneedRef = useRef<HTMLDivElement>(null);


  const scrollCarousel = (ref: React.RefObject<HTMLDivElement | null>, direction: "left" | "right") => {
    if (!ref.current) return;
    const scrollAmount = direction === "left" ? -300 : 300;
    ref.current.scrollBy({ left: scrollAmount, behavior: "smooth" });
  };

  const [manualPdf, setManualPdf] = useState<string | null>(null);
  const [installationGuide, setInstallationGuide] = useState<string | null>(null);
  const [certificate, setCertificate] = useState<string | null>(null);
  const [careInstructions, setCareInstructions] = useState<string | null>(null);
  const [ambianceImages, setAmbianceImages] = useState<any[]>([]);
  // --- Dynamic order colors/models
  type OrderColor = {
    name: string;
    color: string;
    slug: string;
  };
  const [orderColors, setOrderColors] = useState<OrderColor[]>([]);
  const [orderModels, setOrderModels] = useState<any[]>([]);

  const [isAddingToCart, setIsAddingToCart] = useState(false);
  const [isOutOfStock, setIsOutOfStock] = useState(false);
  const [availableStock, setAvailableStock] = useState<number | null>(() => {
    // Initial state from SSR product prop
    if (!product) return null;
    const totalStockMeta = product.meta_data?.find((m: any) => m.key === "crucial_data_total_stock")?.value;
    const totalStock = totalStockMeta !== undefined && totalStockMeta !== null && totalStockMeta !== ""
      ? parseInt(totalStockMeta, 10)
      : (typeof product.stock_quantity === "number" ? product.stock_quantity : null);
    
    // Safety check just like in the async function
    if (totalStock !== null && !isNaN(totalStock)) return totalStock;
    return null;
  });
  const [backordersAllowed, setBackordersAllowed] = useState(() => {
    if (!product) return false;
    return product.backorders === "yes" || product.backorders === "notify" || product.backorders_allowed === true;
  });
  const [addCartSuccess, setAddCartSuccess] = useState(false);
  const [addCartError, setAddCartError] = useState(false);
  const { openModal } = useProductAddedModal();
  // Derived state: is quantity input exceeding available stock
  const isQuantityInvalid =
    availableStock !== null &&
    !backordersAllowed && // Only block if backorders DISABLED
    quantity > availableStock;
  // Cart-aware: quantity of this product already in cart
  const cartItemQuantity =
    items?.find((item: any) => item.id === product?.id)?.quantity ?? 0;
  const isStockLimitReached =
    availableStock !== null &&
    !backordersAllowed && // Only block if backorders DISABLED
    cartItemQuantity >= availableStock;
  // UX-grade stock check on page load
  useEffect(() => {
    if (!product?.id) return;

    const checkInitialStock = async () => {
      try {
        const res = await fetchProductByIdAction(product.id);
        if (!res.success || !res.data) return;
        const wcProduct = res.data;

        console.log("🟦 ProductPageClient Stock Check Response:", wcProduct);

        // Check if backorders are allowed (yes or notify)
        const isBackorder = wcProduct.backorders === "yes" || wcProduct.backorders === "notify" || wcProduct.backorders_allowed === true;
        setBackordersAllowed(isBackorder);

        // Extract Total Stock from ACF
        const totalStockMeta = wcProduct.meta_data?.find((m: any) => m.key === "crucial_data_total_stock")?.value;
        const totalStock = totalStockMeta !== undefined && totalStockMeta !== null && totalStockMeta !== "" 
          ? parseInt(totalStockMeta, 10) 
          : (typeof wcProduct.stock_quantity === "number" ? wcProduct.stock_quantity : null);

        if (wcProduct.stock_status !== "instock" && !isBackorder) {
          setIsOutOfStock(true);
          // If explicitly out of stock status, we might still want to show 0 stock? 
          // But strict Woo logic usually trusts status. 
          // However for total_stock logic, often quantity is the truth. 
          // Staying consistent with existing logic:
          return;
        }

        if (totalStock !== null) {
          setAvailableStock(totalStock);
          if (totalStock <= 0 && !isBackorder) {
             // If status says instock but total_stock is 0, we treat it as out of stock?
             // Or rely on status? Existing code relied on stock_quantity logic:
             // if (wcProduct.stock_quantity <= 0 && !isBackorder) setIsOutOfStock(true);
             setIsOutOfStock(true);
          }
        }
      } catch (err) {
        // console.error("❌ Initial stock fetch failed:", err);
      }
    };

    checkInitialStock();
  }, [product?.id]);

  type MetaData = {
    key: string;
    value: any;
  };

  const metaData: MetaData[] = product?.meta_data || [];
  const cheapestPriceOption = metaData.find(
    (m) => m.key === "crucial_data_cheapest_price_option"
  )?.value;
  const isCheapestPriceEnabled = cheapestPriceOption === "1" || cheapestPriceOption === 1;

  const scrollRef = useRef<HTMLDivElement>(null);
  const thumbsRef = useRef<HTMLDivElement>(null);

  const [matchingRoses, setMatchingRoses] = useState<any[]>([]);
  const vergelijkRef = useRef<HTMLDetailsElement>(null);

  const scrollBy = (offset: number) => {
    if (scrollRef.current) {
      scrollRef.current.scrollBy({ left: offset, behavior: 'smooth' });
    }
  };



  const resolveColor = (value: string): string => {
    if (!value) return "#D1D5DB";

    const key = value.trim().toLowerCase();

    if (/^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(key)) return key;

    if (COLOR_MAP[key]) return COLOR_MAP[key];

    for (const mapKey of Object.keys(COLOR_MAP)) {
      if (key.includes(mapKey)) {
        return COLOR_MAP[mapKey];
      }
    }

    return "#D1D5DB";
  };

  // ✅ Restore Order Colors & Order Models from SSR product
  useEffect(() => {
    if (!product || !Array.isArray(product.meta_data)) return;

    /* ---------------------------
     | ORDER COLORS
     --------------------------- */
    const orderColorKeys = [
      "related_order_color_1",
      "related_order_color_2",
      "related_order_color_3",
      "related_order_color_4",
      "related_order_color_5",
      "related_order_color_6",
      "related_order_color_7",
      "related_order_color_8",
    ];

    const colorSkus = orderColorKeys
      .map((key) =>
        product.meta_data.find((m: any) => m.key === key)?.value
      )
      .filter((sku) => sku && String(sku).trim() !== "");

    if (colorSkus.length > 0) {
      Promise.all(
        colorSkus.map(async (sku: string) => {
          try {
            const res = await fetchProductBySkuAction(sku);
            const linked = res.data; // Already the product object or null
            if (!linked) return null;

            const colorAttr = linked.attributes?.find(
              (attr: any) =>
                attr.slug === "color" || attr.slug === "pa_color"
            );

            const colorName = colorAttr?.options?.[0];
            if (!colorName) return null;

            return {
              name: colorName,
              color: resolveColor(colorName),
              slug: linked.slug,
            };
          } catch {
            return null;
          }
        })
      ).then((results) => {
        setOrderColors(
          results.filter(
            (c): c is OrderColor =>
              !!c && typeof c.name === "string" && typeof c.color === "string" && typeof c.slug === "string"
          )
        );
      });
    } else {
      setOrderColors([]);
    }

    /* ---------------------------
     | ORDER MODELS (ACF ordered + text-safe)
     --------------------------- */
    type OrderModelEntry = {
      sku: string;
      displayText: string | null;
      position: number;
    };

    const modelEntries: OrderModelEntry[] = Array.from({ length: 8 }, (_, i) => {
      const index = i + 1; // 1..8

      const sku = product.meta_data.find(
        (m: any) => m.key === `related_order_model_${index}`
      )?.value;

      const text = product.meta_data.find(
        (m: any) => m.key === `related_other_model_text_${index}`
      )?.value;

      if (!sku || String(sku).trim() === "") return null;

      return {
        sku: String(sku).trim(),
        displayText: text ? String(text) : null,
        position: index,
      };
    })
      .filter(Boolean) as OrderModelEntry[];

    // Debug log to verify correct mapping between model positions and texts
    // console.log("🟦 DEBUG order model entries (sku + text by position):", modelEntries);

    if (modelEntries.length > 0) {
      Promise.all(
        modelEntries.map(async ({ sku, displayText }) => {
          try {
            const res = await fetchProductBySkuAction(sku);
            const productModel = res.data;

            if (!productModel) return null;

            return {
              ...productModel,
              displayText,
            };
          } catch {
            return null;
          }
        })
      ).then((models) => {
        setOrderModels(models.filter(Boolean));
      });
    } else {
      setOrderModels([]);
    }
  }, [product]);

  // --- Helper to fetch and set related products by meta key prefix ---
  const fetchRelatedGroup = React.useCallback(async (prefix: string, setter: React.Dispatch<React.SetStateAction<any[]>>, limit: number = 8, fetchType: 'sku' | 'id' = 'sku') => {
    if (!product || !Array.isArray(product.meta_data)) return;

    const identifiers: string[] = [];
    for (let i = 1; i <= limit; i++) {
      // Try exact match first
      const val = product.meta_data.find((m: any) => m.key === `${prefix}${i}`)?.value;
      if (val && (typeof val === 'string' || typeof val === 'number') && String(val).trim() !== '') {
        identifiers.push(String(val).trim());
      }
    }

    if (identifiers.length === 0) {
      setter([]);
      return;
    }

    // console.log(`🔍 Fetching related group for prefix "${prefix}": found items`, identifiers);

    try {
      const results = await Promise.all(
        identifiers.map(async (identifier) => {
          try {
            if (fetchType === 'id') {
              const res = await fetchProductByIdAction(Number(identifier));
              return res.data;
            } else {
              const res = await fetchProductBySkuAction(identifier);
              return res.data;
            }
          } catch (e) {
            // console.error(`Failed to fetch related product for ${prefix} (val: ${identifier})`, e);
            return null;
          }
        })
      );
      setter(results.filter((item) => item !== null));
    } catch (err) {
      // console.error(`Error in fetchRelatedGroup for ${prefix}`, err);
    }
  }, [product]);

  // --- Fetch Related Accessories & Parts ---
  useEffect(() => {
    // 1. Matching Accessories -> matchingProducts
    // Key found: related_matching_product_1
    fetchRelatedGroup('related_matching_product_', setMatchingProducts);

    // 2. Matching Knob Roses -> matchingKnobroseKeys
    // Key found: related_matching_knobrose_1
    fetchRelatedGroup('related_matching_knobrose_', setMatchingKnobRoseProducts);

    // 3. Matching Key Roses -> matchingRoseKeys
    // Key found: related_matching_keyrose_1
    fetchRelatedGroup('related_matching_keyrose_', setMatchingRoseKeys);

    // 4. Matching PC Roses -> pcroseKeys
    // Key found: related_matching_pcrose_1
    fetchRelatedGroup('related_matching_pcrose_', setPcRoseKeys);

    // 5. Matching Blind Toilet Roses -> blindtoiletroseKeys
    // Key found: related_matching_toiletrose_1
    fetchRelatedGroup('related_matching_toiletrose_', setblindtoiletroseKeys);

    // 6. Must Have Products -> musthaveprodKeys
    // Key found: related_must_have_product_1
    // User confirmed these are SKUs
    fetchRelatedGroup('related_must_have_product_', setMusthaveprodKeys, 8, 'sku');

  }, [fetchRelatedGroup]);

  const scrollToSection = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      const yOffset = -30;
      const y = el.getBoundingClientRect().top + window.pageYOffset + yOffset;

      window.scrollTo({ top: y, behavior: "smooth" });

      el.classList.add("highlight-section");
      setTimeout(() => {
        el.classList.remove("highlight-section");
      }, 5000);
    }
  };


  useEffect(() => {
    // ----------------------
    // Ambiance images (assets_ambiance_pictures -> media IDs -> URLs)
    // ----------------------
    if (product && Array.isArray(product.meta_data)) {
      const ambianceMeta = product.meta_data.find(
        (m: any) => m.key === "assets_ambiance_pictures"
      );

      const ambianceImageIds = Array.isArray(ambianceMeta?.value)
        ? ambianceMeta.value
        : [];

      // console.log("🔍 DEBUG: Ambiance image IDs:", ambianceImageIds);

      const fetchAmbianceImages = async () => {
        if (ambianceImageIds.length === 0) {
          setAmbianceImages([]);
          return;
        }

        try {
          const responses = await Promise.all(
            ambianceImageIds.map(async (id: string) => {
              try {
                return await fetchMedia(id);
              } catch {
                return null;
              }
            })
          );

          // console.log("🔍 DEBUG: Ambiance media objects:", responses);

          setAmbianceImages(
            responses
              .filter((img: any) => img && img.source_url)
              .map((img: any) => ({
                id: img.id,
                url: img.source_url,
                alt: img.alt_text || img.title?.rendered || "Ambiance image",
                width: img.media_details?.width || 1200,
                height: img.media_details?.height || 1200,
              }))
          );
        } catch (err) {
          // console.error("❌ Error fetching ambiance images:", err);
        }
      };

      fetchAmbianceImages();
    }

    const pdfMeta = product?.meta_data?.find((m: { key: string; value: any }) => m.key === "assets_manual_pdf");
    if (pdfMeta?.value) {
      fetchMedia(pdfMeta.value).then(media =>
        setManualPdf(media?.source_url || null)
      );
    }

    const installMeta = product?.meta_data?.find((m: { key: string; value: any }) => m.key === "assets_installation_guide");
    if (installMeta?.value) {
      fetchMedia(installMeta.value).then(media =>
        setInstallationGuide(media?.source_url || null)
      );
    }

    const certMeta = product?.meta_data?.find((m: { key: string; value: any }) => m.key === "assets_product_certificate");
    if (certMeta?.value) {
      fetchMedia(certMeta.value).then(media =>
        setCertificate(media?.source_url || null)
      );
    }

    const careMeta = product?.meta_data?.find((m: { key: string; value: any }) => m.key === "assets_care_instructions");
    if (careMeta?.value) {
      fetchMedia(careMeta.value).then(media =>
        setCareInstructions(media?.source_url || null)
      );
    }

    const techDrawMeta = product?.meta_data?.find((m: { key: string; value: any }) => m.key === "assets_technical_drawing");
    // console.log("🔍 DEBUG: Tech Drawing Meta:", techDrawMeta);
    if (techDrawMeta?.value) {
      // console.log("🔍 DEBUG: Fetching Tech Drawing for ID:", techDrawMeta.value);
      fetchMedia(techDrawMeta.value).then(media => {
        // console.log("🔍 DEBUG: Tech Drawing Media Result for ID " + techDrawMeta.value + ":", media);
        setTechnicalDrawingUrl(media?.source_url || null);
      });
    } else {
      // console.log("❌ DEBUG: No assets_technical_drawing meta key found in product:", product?.name);
    }
  }, [product]);

  // const productTitle = product?.meta_data?.find((m: any) => m.key === "crucial_data_product_name")?.value || product?.name || "";
  const productTitle = product?.meta_data?.find((m: any) => m.key === "description_bouwbeslag_title")?.value || product?.name || "";

  const getMetaValue = (key: string) =>
    product?.meta_data?.find((m: any) => m.key === key)?.value || null;

  // --- Core product info
  const productSKU = product?.sku;
  const productCategories = product?.categories || [];
  const productBrands = product?.brands || [];

  // --- Dimensions
  const productWidth = getMetaValue("dimensions_product_width");
  const productWidthUnit = getMetaValue("dimensions_product_width_unit");
  const productHeight = getMetaValue("dimensions_product_height");
  const productHeightUnit = getMetaValue("dimensions_product_height_unit");
  const productLength = getMetaValue("dimensions_product_length");
  const productLengthUnit = getMetaValue("dimensions_product_length_unit");

  // --- Length Freight Logic
  const packageLengthRaw = getMetaValue("dimensions_package_length");
  const packageLengthUnit = getMetaValue("dimensions_package_length_unit");

  const packageLength = packageLengthRaw && !isNaN(parseFloat(packageLengthRaw)) ? parseFloat(packageLengthRaw) : 0;
  // Rule: > 100cm OR > 1600mm
  const hasLengthFreight =
    (packageLengthUnit === 'cm' && packageLength > 100) ||
    (packageLengthUnit === 'mm' && packageLength > 1600);

  const packingType = product?.attributes?.find((attr: any) => attr.slug === "pa_packing_type")?.options?.[0];

  // --- WooCommerce stock check helper ---
  // Checks real-time stock before allowing add-to-cart
  const checkStockBeforeAdd = async (productId: number, qty: number) => {
    try {
      const res = await checkStockAction(productId);

      if (!res.success || !res.data) {
        throw new Error(res.error || "Failed to fetch product data");
      }

      const wcProduct = res.data;

      // Check backorders again just to be safe with the fresh data
      const backordersAllowed = wcProduct.backorders === "yes" || wcProduct.backorders === "notify" || wcProduct.backorders_allowed === true;

      // If Woo says out of stock AND backorders not allowed
      if (wcProduct.stock_status !== "instock" && wcProduct.stock_status !== "onbackorder" && !backordersAllowed) {
        toast.error("Dit product is momenteel niet op voorraad.");
        return false;
      }

      // Extract Total Stock from ACF
      const totalStockMeta = wcProduct.meta_data?.find((m: any) => m.key === "crucial_data_total_stock")?.value;
      const totalStock = totalStockMeta !== undefined && totalStockMeta !== null && totalStockMeta !== ""
        ? parseInt(totalStockMeta, 10)
        : (typeof wcProduct.stock_quantity === "number" ? wcProduct.stock_quantity : null);

      console.log("🟦 [checkStockBeforeAdd] Resolved Total Stock:", totalStock, "Original Stock Qty:", wcProduct.stock_quantity);

      // If stock management enabled, validate quantity ONLY if backorders are NOT allowed
      if (
        totalStock !== null &&
        !backordersAllowed &&
        qty > totalStock
      ) {
        toast.error(
          `Maximale beschikbare voorraad: ${totalStock}`
        );
        return false;
      }

      return true;
    } catch (err) {
      // console.error("❌ Stock check failed:", err);
      toast.error("Voorraadcontrole mislukt. Probeer opnieuw.");
      return false;
    }
  };


  if (!product) {
    return (
      <div className="flex justify-center items-center min-h-[300px]">
        <span>Product niet gevonden.</span>
      </div>
    );
  }

  // --- SHARED ADD TO CART HANDLER ---
  // --- SHARED ADD TO CART HANDLER ---
  const handleAddToCart = async () => {
    if (isAddingToCart) return;
    setAddCartError(false);
    setAddCartSuccess(false);
    try {
      setIsAddingToCart(true);

      const stockOk = await checkStockBeforeAdd(product.id, quantity);
      if (!stockOk) {
        setIsAddingToCart(false);
        return;
      }

      const stockLeadRaw = getMetaValue("crucial_data_delivery_if_stock");
      const noStockLeadRaw = getMetaValue("crucial_data_delivery_if_no_stock");

      const leadTimeInStock = stockLeadRaw && !isNaN(parseInt(stockLeadRaw)) ? parseInt(stockLeadRaw) : 1;
      const leadTimeNoStock = noStockLeadRaw && !isNaN(parseInt(noStockLeadRaw)) ? parseInt(noStockLeadRaw) : 30;

      console.log("🟦 [handleAddToCart] Delivery Params:", {
         stockStatus: product.stock_status,
         quantity,
         availableStock,
         leadTimeInStock,
         leadTimeNoStock
      });

      const deliveryInfo = getDeliveryInfo(
        product.stock_status,
        quantity + cartItemQuantity,
        availableStock ?? product.stock_quantity ?? null,
        leadTimeInStock,
        leadTimeNoStock
      );
      
      console.log("🟦 [handleAddToCart] Calculated Delivery Info:", deliveryInfo);

      await addItem({
        id: product.id,
        name: productTitle,
        price: cartBasePrice, // Use the shared Ex-VAT price
        quantity,
        image: product?.images?.[0]?.src || "/afbeelding.webp",
        deliveryText: deliveryInfo.short,
        deliveryType: deliveryInfo.type,
        slug: product.slug,
        stockStatus: product.stock_status,
        stockQuantity: availableStock ?? product.stock_quantity ?? null,
        leadTimeInStock,
        leadTimeNoStock,
        isMaatwerk: getMetaValue("crucial_data_maatwerk") === "1",
        hasLengthFreight
      });
      setAddCartSuccess(true);
      openModal({
        product,
        quantity,
        totalPrice,
        currency,
        userRole: userRole || undefined,
        // Pass all recommendations
        musthaveprodKeys,
        matchingProducts,
        matchingKnobroseKeys,
        matchingRoseKeys,
        pcroseKeys,
        blindtoiletroseKeys,

        deliveryText: deliveryInfo.short,
        deliveryType: deliveryInfo.type
      });

      setTimeout(() => {
        setAddCartSuccess(false);
      }, 3000);
    } catch (error) {
      setAddCartError(true);
      setTimeout(() => {
        setAddCartError(false);
      }, 3000);
    } finally {
      setIsAddingToCart(false);
    }
  };

  return (
    <div className='bg-[#F5F5F5] font-sans'>
      <motion.div
        className="max-w-[1440px] mx-auto py-4 lg:py-8 px-5 lg:px-0"
        initial="hidden"
        animate="visible"
        variants={staggerContainer}
      >
        {/* ✅ Dynamic Breadcrumb */}
        <motion.div variants={fadeInUp} className="text-sm text-gray-500 mb-6 flex items-center gap-2 flex-wrap">
          {/* Home */}
          <Link href="/" className="hover:underline flex items-center gap-1 text-black">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth="1.5"
              stroke="currentColor"
              className="size-4"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="m2.25 12 8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25"
              />
            </svg>
            <span>Home</span>
          </Link>

          {/* Categories */}
          {(() => {
            if (!Array.isArray(product?.categories) || product.categories.length === 0) {
              return null;
            }

            // Sort: parent category first, then child
            const sorted = [...product.categories].sort(
              (a: any, b: any) => (a.parent || 0) - (b.parent || 0)
            );

            return sorted.slice(0, 2).map((cat: any, idx: number) => {
              // Construct nested path using the sorted array up to the current index
              // e.g. Parent -> /parent-slug
              //      Child  -> /parent-slug/child-slug
              const nestedPath = sorted
                .slice(0, idx + 1)
                .map((c: any) => c.slug)
                .join("/");

              return (
                <React.Fragment key={cat.id}>
                  <span>/</span>
                  <Link
                    href={`/${nestedPath}`}
                    className="hover:underline text-black"
                  >
                    {cat.name}
                  </Link>
                </React.Fragment>
              );
            });
          })()}
        </motion.div>
        <div className="flex flex-col lg:flex-row gap-6 lg:gap-8">
          {/* Left side: Images */}
          <motion.div variants={fadeInUp} className="lg:w-1/2 pswp-gallery" id="product-gallery">
            <div className="mb-4 relative group">
              <a
                href={selectedImage}
                data-pswp-width={galleryImages.find(img => img.src === selectedImage)?.width || 1200}
                data-pswp-height={galleryImages.find(img => img.src === selectedImage)?.height || 1200}
                target="_blank"
                rel="noreferrer"
                className="pswp-gallery-item cursor-zoom-in"
              >
                <img src={selectedImage} alt="Main Product" className="w-full h-auto rounded-lg object-cover" />
              </a>

              {/* Hidden links for the rest of the gallery so they are all available in the lightbox */}
              <div className="hidden">
                {galleryImages.filter(img => img.src !== selectedImage).map((img, idx) => (
                  <a
                    key={idx}
                    href={img.src}
                    data-pswp-width={img.width}
                    data-pswp-height={img.height}
                    className="pswp-gallery-item"
                    target="_blank"
                    rel="noreferrer"
                  >
                    <img src={img.src} alt={`Gallery image ${idx}`} />
                  </a>
                ))}
              </div>
            </div>

            {/* Thumbnails Carousel with slice-based logic */}
            <div className="flex items-center gap-2 mt-2">
              {galleryImages.length > 4 && (
                <button type="button" onClick={() => setThumbIndex((prev) => Math.max(0, prev - 1))} className="w-8 h-8 flex items-center justify-center rounded-full border border-white hover:border-gray-300 bg-gray-300 hover:bg-gray-100 cursor-pointer" aria-label="Previous thumbnails" disabled={thumbIndex === 0} style={{ opacity: thumbIndex === 0 ? 0.5 : 1 }}>
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                </button>
              )}
              <div className="grid grid-cols-4 gap-4 pb-1 w-[90%]">
                {(galleryImages && galleryImages.length > 0 ? galleryImages : [])
                  .slice(thumbIndex, thumbIndex + 4)
                  .map((thumb, idx) => {
                    const globalIdx = thumbIndex + idx; // Use global index for aria-label and key
                    return (
                      <button key={globalIdx} onClick={() => setSelectedImage(thumb.src)} className={`items-center justify-center border aspect-square rounded-md overflow-hidden flex-shrink-0 transition-all ${selectedImage === thumb.src ? 'border-blue-600 ring-2 ring-blue-100' : 'border-gray-200 hover:border-blue-400'}`} aria-label={`Thumbnail ${globalIdx + 1}`} type="button">
                        <img src={thumb.src} alt={`Thumbnail ${globalIdx + 1}`} className="w-full h-full object-contain" />
                      </button>
                    );
                  })}
              </div>
              {galleryImages.length > 4 && (
                <button type="button"
                  onClick={() =>
                    setThumbIndex((prev) =>
                      Math.min(
                        (galleryImages && galleryImages.length > 0 ? galleryImages.length : 0) - 4,
                        prev + 1
                      )
                    )
                  }
                  className="w-8 h-8 flex items-center justify-center rounded-full border border-white hover:border-gray-300 bg-gray-300 hover:bg-gray-100 cursor-pointer"
                  aria-label="Next thumbnails"
                  disabled={
                    thumbIndex >=
                    ((galleryImages && galleryImages.length > 0 ? galleryImages.length : 0) - 4)
                  }
                  style={{
                    opacity:
                      thumbIndex >=
                        ((galleryImages && galleryImages.length > 0 ? galleryImages.length : 0) - 4)
                        ? 0.5
                        : 1,
                  }}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                </button>
              )}
            </div>

            {/* Unified Related Products Section */}
            {(musthaveprodKeys.length > 0 ||
              matchingProducts.length > 0 ||
              matchingKnobroseKeys.length > 0 ||
              matchingRoseKeys.length > 0 ||
              pcroseKeys.length > 0 ||
              blindtoiletroseKeys.length > 0) && (
                <motion.div initial="visible" animate="visible" variants={fadeInUp} className="mt-8 space-y-8 hidden lg:block">

                  {/* 1. Must Have Products */}
                  {musthaveprodKeys.length > 0 && (
                    <div id="musthaveprod-section">
                      <div className="mb-4">
                        <h3 className="text-[#1C2530] font-bold text-2xl lg:text-3xl">Aanbevolen producten</h3>
                      </div>
                      <div className="space-y-3">
                        {musthaveprodKeys.map((item, index) => (
                          <RecommendedProductItem key={item.id || index} item={item} />
                        ))}
                      </div>
                    </div>
                  )}

                  {/* 2. Accessories */}
                  {matchingProducts.length > 0 && (
                    <div id="accessories-section">
                      <div className="mb-4">
                        <h3 className="text-[#1C2530] font-bold text-2xl lg:text-3xl">Bijpassende accessoires</h3>
                      </div>
                      <div className="space-y-3">
                        {matchingProducts.map((item, index) => (
                          <RecommendedProductItem key={item.id || index} item={item} />
                        ))}
                      </div>
                    </div>
                  )}

                  {/* 3. Matching Knob Roses */}
                  {matchingKnobroseKeys.length > 0 && (
                    <div id="knobroses-section">
                      <div className="mb-4">
                        <h3 className="text-[#1C2530] font-bold text-2xl lg:text-3xl">Bijpassende rozetten</h3>
                      </div>
                      <div className="space-y-3">
                        {matchingKnobroseKeys.map((item, index) => (
                          <RecommendedProductItem key={item.id || index} item={item} />
                        ))}
                      </div>
                    </div>
                  )}

                  {/* 4. Matching Key Roses */}
                  {matchingRoseKeys.length > 0 && (
                    <div id="matchingroses-section">
                      <div className="mb-4">
                        <h3 className="text-[#1C2530] font-bold text-2xl lg:text-3xl">Bijpassende sleutelrozetten</h3>
                      </div>
                      <div className="space-y-3">
                        {matchingRoseKeys.map((item, index) => (
                          <RecommendedProductItem key={item.id || index} item={item} />
                        ))}
                      </div>
                    </div>
                  )}

                  {/* 5. PC Roses */}
                  {pcroseKeys.length > 0 && (
                    <div id="pcroses-section">
                      <div className="mb-4">
                        <h3 className="text-[#1C2530] font-bold text-2xl lg:text-3xl">Bijpassende cilinderrozetten</h3>
                      </div>
                      <div className="space-y-3">
                        {pcroseKeys.map((item, index) => (
                          <RecommendedProductItem key={item.id || index} item={item} />
                        ))}
                      </div>
                    </div>
                  )}

                  {/* 6. Blind / Toilet Roses */}
                  {blindtoiletroseKeys.length > 0 && (
                    <div id="blindtoiletroses-section">
                      <div className="mb-4">
                        <h3 className="text-[#1C2530] font-bold text-2xl lg:text-3xl">Bijpassende toiletgarnituren</h3>
                      </div>
                      <div className="space-y-3">
                        {blindtoiletroseKeys.map((item, index) => (
                          <RecommendedProductItem key={item.id || index} item={item} />
                        ))}
                      </div>
                    </div>
                  )}

                </motion.div>
              )}


          </motion.div>

          {/* Right side: Product details */}
          <motion.div variants={fadeInUp} className="lg:w-1/2 flex flex-col gap-5">
            <div className="flex items-center gap-4">
              {/* <Image src="/productcatlogo.png" className="w-auto h-auto" alt="Product Category Logo" width={50} height={50} /> */}
              {brandImageUrl && (
                <img
                  src={brandImageUrl}
                  alt="Brand Logo"
                  className="h-10 w-auto object-contain hidden lg:block"
                />
              )}

              {/* Review Summary */}
              {product.rating_count > 0 && (
                <div className="flex items-center gap-2 cursor-pointer" onClick={() => {
                  const el = document.getElementById('reviews-accordion') as HTMLDetailsElement | null;
                  if (el) {
                    el.open = true;
                    el.scrollIntoView({ behavior: 'smooth', block: 'start' });
                  }
                }}>
                  <div className="flex text-[#FF9E0D]">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <svg key={star} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill={star <= Math.round(parseFloat(product.average_rating || "0")) ? "currentColor" : "none"} stroke="currentColor" strokeWidth={star <= Math.round(parseFloat(product.average_rating || "0")) ? 0 : 1} className="size-5">
                        <path fillRule="evenodd" d="M10.788 3.21c.448-1.077 1.976-1.077 2.424 0l2.082 5.007 5.404.433c1.164.093 1.636 1.545.749 2.305l-4.117 3.527 1.257 5.273c.271 1.136-.964 2.033-1.96 1.425L12 18.354 7.373 21.18c-.996.608-2.231-.29-1.96-1.425l1.257-5.273-4.117-3.527c-.887-.76-.415-2.212.749-2.305l5.404-.433 2.082-5.006z" clipRule="evenodd" />
                      </svg>
                    ))}
                  </div>
                  <span className="text-sm font-medium text-gray-500 underline decoration-gray-300 underline-offset-2">
                    {product.rating_count} reviews
                  </span>
                </div>
              )}
            </div>
            {/* Title and Brand */}
            <div>
              <h1 className="text-2xl lg:text-3xl font-bold text-[#1C2530]">{productTitle}</h1>
            </div>

            {/* Price and Discount */}
            {(() => {
              const getMeta = (key: string) => product?.meta_data?.find((m: any) => m.key === key)?.value;

              // Dynamic Price Logic
              const isB2B = userRole && (userRole.includes("b2b_customer") || userRole.includes("administrator"));
              const b2bKey = "crucial_data_b2b_and_b2c_sales_price_b2b";
              const b2cKey = "crucial_data_b2b_and_b2c_sales_price_b2c";

              // 1. Get Advised Price
              const advisedRaw = getMeta("crucial_data_unit_price");
              const advised = advisedRaw !== undefined && advisedRaw !== null && !isNaN(parseFloat(advisedRaw)) ? parseFloat(advisedRaw) : null;

              if (isLoading) {
                return <div className="h-8 w-32 bg-gray-200 animate-pulse rounded"></div>;
              }

              // 2. Get Sales Price (B2B or B2C)
              // 2. Get Sales Price (B2B or B2C)
              let sale = 0;

              if (isB2B) {
                if (product.regular_price) {
                  sale = parseFloat(product.regular_price);
                } else if (product.price) {
                  sale = parseFloat(product.price);
                }
              } else {
                // B2C: Standard Product Price or ACF override
                sale = product.price ? parseFloat(product.price) : 0;
                const acfPriceRaw = getMeta(b2cKey);
                if (acfPriceRaw && !isNaN(parseFloat(acfPriceRaw))) {
                  sale = parseFloat(acfPriceRaw);
                }
              }


              const currency = product.currency_symbol || "€";

              // Tax Logic
              const taxMultiplier = 1 + (taxRate / 100);
              const finalPrice = isB2B ? sale : (sale ? sale * taxMultiplier : null);
              const taxLabel = isB2B ? "(excl. BTW)" : "(incl. BTW)";

              let discountPercent: number | null = null;
              if (advised && sale && advised > 0) {
                const advisedWithTax = advised * taxMultiplier;
                const comparePrice = isB2B ? sale : (sale ? sale * taxMultiplier : 0);
                discountPercent = Math.round(((advisedWithTax - comparePrice) / advisedWithTax) * 100);
              }

              return (
                <div className="flex justify-evenly lg:justify-start items-center gap-1.5 lg:gap-4">
                  {finalPrice !== null && finalPrice !== undefined ? (
                    <>
                      <div className="flex items-baseline gap-1.5">
                        <div className='flex flex-col lg:flex-row items-baseline gap-1.5'>
                          <span className="text-xl md:text-2xl lg:text-3xl font-bold text-[#0066FF]">
                            {currency}
                            {finalPrice.toFixed(2).replace('.', ',')}
                          </span>
                          <span className="text-xs font-normal text-[#3D4752]">
                            {taxLabel}
                          </span>
                        </div>
                        {packingType && (
                          <span className="text-md font-normal text-[#3D4752] lowercase">
                            per {packingType}
                          </span>
                        )}
                      </div>
                      <div className='flex gap-1.5 lg:gap-4 flex-col lg:flex-row'>
                        {advised !== null && sale !== null && discountPercent !== null && advised > sale ? (
                          <div
                            className="tooltip tooltip-right"
                            // data-tip={`Discount from ${currency}${advised.toFixed(2)}`}
                            data-tip={`T.o.v. verkoopadviesprijs leverancier`}
                          >
                            <button className="bg-[#FF5E00] px-[6px] lg:px-[12px] py-[2px] lg:py-[5px] rounded-sm text-white text-[12px] lg:text-[13px] font-bold cursor-pointer">
                              {discountPercent}% korting
                            </button>
                          </div>
                        ) : null}

                        {isCheapestPriceEnabled && (
                          <button
                            className='bg-[#5ca139] px-[6px] lg:px-[12px] py-[2px] lg:py-[5px] rounded-sm text-white text-[12px] lg:text-[13px] font-bold cursor-pointer'
                            onClick={() => {
                              if (vergelijkRef.current) {
                                vergelijkRef.current.open = true;
                                const yOffset = -280; // Increased offset to prevent header overlap
                                const y = vergelijkRef.current.getBoundingClientRect().top + window.pageYOffset + yOffset;
                                window.scrollTo({ top: y, behavior: "smooth" });
                              }
                            }}
                          >
                            Laagste prijs garantie
                          </button>
                        )}
                      </div>
                    </>
                  ) : (
                    advised !== null ? (
                      <span className="text-2xl lg:text-3xl font-bold text-[#0066FF]">
                        {currency}
                        {advised.toFixed(2)}
                      </span>
                    ) : (
                      <span className="text-2xl lg:text-3xl font-bold text-[#0066FF]">
                        Price not available
                      </span>
                    )
                  )}
                </div>
              );
            })()}

            {/* Features */}
            {(() => {
              const usps = [];
              if (product?.meta_data) {
                for (let i = 1; i <= 8; i++) {
                  const usp = product.meta_data.find((m: any) => m.key === `description_usp_${i}`)?.value;
                  if (usp) {
                    usps.push(usp);
                  }
                }
              }
              if (usps.length === 0) return null;
              return (
                <div>
                  <ul className="list-none list-inside text-gray-700 space-y-2">
                    {usps.map((usp, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <span>
                          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="#03B955" className="size-6">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                          </svg>
                        </span>
                        <span>{usp}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })()}

            {/* Dynamic Order Colours */}
            {orderColors.length > 0 && (
              <div className="flex gap-2 items-center">
                <p className="font-semibold text-base lg:text-lg lg:mb-2">
                  Andere kleuren van dit product:
                </p>

                <div className="flex gap-3">
                  {orderColors.map((colour: { name: string; color: string; slug?: string }) => (
                    <Link key={colour.slug} href={colour.slug ? `/${colour.slug}` : "#"}>
                      <button className="w-8 h-8 rounded-full border border-gray-300 cursor-pointer hover:ring-2 hover:ring-blue-500" style={{ backgroundColor: colour.color }} aria-label={colour.name} title={colour.name} />
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* Dynamic Order Models Carousel */}
            {orderModels.length > 0 && (
              <div>
                <div className="flex items-center justify-between mb-2">
                  <p className="font-semibold text-base lg:text-lg">Zoek je soms een ander model?</p>
                  {orderModels.length > 5 && (
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => scrollBy(-200)}
                        className="w-8 h-8 flex items-center justify-center rounded-full border border-white hover:border-gray-300 bg-gray-300 hover:bg-gray-100 cursor-pointer"
                        aria-label="Previous models"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="w-4 h-4">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                      </button>

                      <button
                        type="button"
                        onClick={() => scrollBy(200)}
                        className="w-8 h-8 flex items-center justify-center rounded-full border-white hover:border-gray-300 bg-gray-300 hover:bg-gray-100 cursor-pointer"
                        aria-label="Next models"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="w-4 h-4">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </button>
                    </div>
                  )}
                </div>

                <div
                  ref={scrollRef}
                  className="flex gap-4 overflow-x-auto scrollbar-hide pb-2 scroll-smooth"
                >
                  {orderModels.map((model: any, index: number) => (
                    <Link
                      href={`/${model.slug}`}
                      key={`${model.id}-${index}`}
                      className="flex-shrink-0 w-32 flex flex-col items-center gap-2"
                    >
                      <div className="h-32 w-full border border-[#E8E1DC] rounded-sm bg-white flex items-center justify-center">
                        <img
                          src={model?.images?.[0]?.src || "/afbeelding.webp"}
                          alt={model?.name || "Model"}
                          className="max-h-full max-w-full object-contain"
                        />
                      </div>
                      {model.displayText && (
                        <p className="text-xs text-center text-[#3D4752] leading-tight">
                          {model.displayText}
                        </p>
                      )}
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* Volume Discount Section - B2C Only */}
            {discounts.length > 0 && !(userRole && (userRole.includes("b2b_customer") || userRole.includes("administrator"))) && (
              <div className="bg-white border border-white rounded-lg p-4 flex items-center gap-8">
                <p className="font-semibold text-base lg:text-lg">Volume korting:</p>
                <div className="flex gap-8 items-start">
                  <div>
                    <p className='mb-1 text-[#3D4752] font-medium text-base lg:text-lg'>Aantal:</p>
                    {discounts.map((d, idx) => (
                      <label key={idx} className="text-[#3D4752] font-normal text-base flex items-center gap-2">
                        <input
                          type="checkbox"
                          className="w-4 h-4 !border-[#DCDCDC] !rounded-[3px]"
                          checked={selectedDiscount === idx}
                          onChange={() => onDiscountToggle(idx)}
                        />
                        {d.quantity}
                      </label>
                    ))}
                  </div>
                  <div>
                    <p className='mb-1 text-[#3D4752] font-medium text-base lg:text-lg'>Korting</p>
                    {discounts.map((d, idx) => (
                      <p key={idx} className='text-[#03B955] font-medium text-base'>{d.percentage}%</p>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* B2B Upsell - Hide for existing B2B users */}
            {!isB2B && (
              <div className='bg-[#E4EFFF] py-3 px-5 rounded-md'>
                <p className='text-[#3D4752] font-normal text-base'>Heb jij beroepsmatig op regelmatige basis bouwbeslag nodig? <a href="/zakelijk-aanmelden" className='text-[#0066FF] font-bold'>Klik hier </a> en meld je aan voor een zakelijk account met de scherpste inkoopprijzen.</p>
              </div>
            )}

            {/* Maatwerk Warning */}
            {(() => {
              const isMaatwerk = getMetaValue("crucial_data_maatwerk") === "1";
              if (!isMaatwerk) return null;
              return (
                <div className="bg-amber-50 border border-amber-200 text-amber-900 px-5 py-3 rounded-md mt-4 text-base font-medium flex items-center gap-2">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="size-6 text-amber-600">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z" />
                  </svg>
                  <span>Let op:  dit is een maatwerk product dat speciaal voor u wordt besteld en dit kan zodoende niet geretourneerd worden.</span>
                </div>
              );
            })()}

            {/* Quantity Selector and Add to Cart */}
            <div className="flex flex-wrap lg:flex-nowrap items-center gap-3 lg:gap-4 mt-4 justify-between">
              <div className='w-5/12 lg:w-4/12 flex flex-col justify-center items-center'>
                <div className='flex items-baseline'>
                  <p className="text-xl lg:text-3xl font-bold text-[#1C2530]">
                    {isLoading ? "..." : `${currency}${totalPrice.toFixed(2)}`}
                  </p>
                  <span className="text-xs text-gray-500 font-normal ml-2">
                    {userRole && (userRole.includes("b2b_customer") || userRole.includes("administrator")) ? "(excl. BTW)" : "(incl. BTW)"}
                  </span>
                </div>
                {selectedDiscount !== null && (
                  <span className="text-xs text-gray-500 font-normal mt-1">
                    {currency}{displayBasePrice.toFixed(2)}
                  </span>
                )}
                <span className="text-md font-normal text-[#3D4752] lowercase">{packingType && `per ${packingType}`}</span>
              </div>

              <div className="flex border border-[#EDEDED] shadow-xs rounded-sm overflow-hidden bg-white w-auto">
                <button
                  type="button"
                  onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                  className="px-5 py-3 text-2xl cursor-pointer border-r border-[#EDEDED] min-w-[50px]"
                >-</button>
                <div className="px-6 py-2 text-base font-medium text-center min-w-[60px] flex items-center justify-center">
                  {quantity.toString().padStart(1, '0')}
                </div>
                <button
                  type="button"
                  onClick={() =>
                    setQuantity((prev) => {
                      // If limit exists AND backorders disabled, clamp. Else just increment.j
                      if (availableStock !== null && !backordersAllowed) {
                        return Math.min(prev + 1, availableStock);
                      }
                      return prev + 1;
                    })
                  }
                  className="flex justify-center px-5 py-3 text-2xl cursor-pointer border-l border-[#EDEDED] min-w-[50px]"
                >+</button>
              </div>

              <div className='w-full lg:w-5/12' ref={addToCartRef}>
                <div className="relative group">
                  <button
                    type="button"
                    disabled={
                      isAddingToCart ||
                      isOutOfStock ||
                      isQuantityInvalid ||
                      isStockLimitReached
                    }
                    className={`cursor-pointer flex-1 px-6 py-4 rounded-sm transition font-semibold flex items-center justify-center gap-3 w-full
                                ${isOutOfStock || isQuantityInvalid || isStockLimitReached
                        ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                        : "bg-blue-600 text-white hover:bg-blue-700"
                      }`}
                    onClick={handleAddToCart}
                  >
                    {/* Loader spinner if adding, else success, error or cart icon */}
                    {isAddingToCart ? (
                      <svg className="size-6 animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="white" strokeWidth="4"></circle><path className="opacity-75" fill="white" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path></svg>
                    ) : addCartSuccess ? (
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2.5" stroke="white" className="size-6"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                    ) : addCartError ? (
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="#FF3B3B" className="size-6">
                        <circle cx="12" cy="12" r="10" stroke="#FF3B3B" strokeWidth="2" fill="none" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 7v5m0 4h.01" stroke="#FF3B3B" strokeWidth="2" />
                      </svg>
                    ) : (
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="white" className="size-6"><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 0 0-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 0 0-16.536-1.84M7.5 14.25 5.106 5.272M6 20.25a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Zm12.75 0a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Z" /></svg>
                    )}
                    In winkelwagen
                  </button>
                  {(isOutOfStock || isQuantityInvalid || isStockLimitReached) && (
                    <div className="absolute z-20 bottom-full mb-3 hidden group-hover:block w-full">
                      <div className="bg-black text-white text-sm rounded px-4 py-2 shadow-lg text-center">
                        {isOutOfStock
                          ? "Dit product is momenteel niet op voorraad"
                          : isStockLimitReached
                            ? "Je hebt de maximale voorraad al in je winkelwagen"
                            : "De geselecteerde hoeveelheid overschrijdt de beschikbare voorraad"}
                        {availableStock !== null && (
                          <div className="text-xs opacity-80 mt-1">
                            Beschikbare voorraad: {availableStock}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Delivery Info Box */}
            {(() => {
              const getMeta = (key: string) => product?.meta_data?.find((m: any) => m.key === key)?.value;

              // Defaults: 1 day if stock, 30 days if no stock (from user request)
              const stockLeadRaw = getMeta("crucial_data_delivery_if_stock");
              const noStockLeadRaw = getMeta("crucial_data_delivery_if_no_stock");

              const leadTimeInStock = stockLeadRaw && !isNaN(parseInt(stockLeadRaw)) ? parseInt(stockLeadRaw) : 1;
              const leadTimeNoStock = noStockLeadRaw && !isNaN(parseInt(noStockLeadRaw)) ? parseInt(noStockLeadRaw) : 30;

              // Stock data
              const stockStatus = product?.stock_status || 'instock';
              const stockQty = availableStock; // Use our state which is synced with Woo

              const info = getDeliveryInfo(
                stockStatus,
                quantity + cartItemQuantity,
                stockQty,
                leadTimeInStock,
                leadTimeNoStock
              );

              if (info.type === "IN_STOCK") {
                return (
                  <div className='bg-[#EDFCF2] py-3 px-5 rounded-md'>
                    <p className='text-[#03B955] font-semibold text-lg'>Dit product is op voorraad</p>
                    <p className='text-[#3D4752] font-normal text-sm'>{info.message}</p>
                  </div>
                );
              } else if (info.type === "PARTIAL_STOCK") {
                return (
                  <div className='bg-[#FFF9E6] py-3 px-5 rounded-md border border-[#FFCC00]'>
                    <p className='text-[#B28900] font-semibold text-lg'>Deels op voorraad</p>
                    <p className='text-[#3D4752] font-normal text-sm'>{info.message}</p>
                  </div>
                );
              } else {
                // Backorder / No Stock
                return (
                  <div className='bg-[#FFE1E1] py-3 px-5 rounded-md'>
                    <p className='text-[#FF5E00] font-semibold text-lg'>Dit artikel moet besteld worden</p>
                    <p className='text-[#3D4752] font-bold text-sm'>{info.message}</p>
                  </div>
                );
              }
            })()}

            <div>
              <p className='text-[#212121] font-medium text-lg mb-3'>Heb je vragen over dit product? Wij helpen je graag!</p>
              <div className='flex gap-1.5 lg:gap-3 items-center justify-center'>
                <a href={`mailto:contact@bouwbeslag.nl?subject=${encodeURIComponent(productTitle)}`} className='border border-[#0066FF] rounded-sm py-2.5 bg-white text-[#0066FF] font-bold text-sm flex items-center justify-center gap-1.5 lg:gap-3 w-full cursor-pointer hover:text-white hover:bg-[#0066FF] transition-colors'>
                  <span><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="size-5 transition-colors"><path d="M1.5 8.67v8.58a3 3 0 0 0 3 3h15a3 3 0 0 0 3-3V8.67l-8.928 5.493a3 3 0 0 1-3.144 0L1.5 8.67Z" /><path d="M22.5 6.908V6.75a3 3 0 0 0-3-3h-15a3 3 0 0 0-3 3v.158l9.714 5.978a1.5 1.5 0 0 0 1.572 0L22.5 6.908Z" /></svg></span>
                  Mail ons
                </a>
                <a href={`https://wa.me/31578760508?text=${encodeURIComponent(`Hoi! Ik heb een vraag over ${productTitle} (SKU: ${productSKU}). Die vraag luidt:`)}`} className='border border-[#0066FF] rounded-sm py-2 bg-white text-[#0066FF] font-bold text-sm flex items-center justify-center gap-1.5 lg:gap-3 w-full cursor-pointer hover:text-white hover:bg-[#0066FF] transition-colors' target="_blank" rel="noopener noreferrer">
                  <span><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640" fill="currentColor" className="size-6"><path d="M476.9 161.1C435 119.1 379.2 96 319.9 96C197.5 96 97.9 195.6 97.9 318C97.9 357.1 108.1 395.3 127.5 429L96 544L213.7 513.1C246.1 530.8 282.6 540.1 319.8 540.1L319.9 540.1C442.2 540.1 544 440.5 544 318.1C544 258.8 518.8 203.1 476.9 161.1zM319.9 502.7C286.7 502.7 254.2 493.8 225.9 477L219.2 473L149.4 491.3L168 423.2L163.6 416.2C145.1 386.8 135.4 352.9 135.4 318C135.4 216.3 218.2 133.5 320 133.5C369.3 133.5 415.6 152.7 450.4 187.6C485.2 222.5 506.6 268.8 506.5 318.1C506.5 419.9 421.6 502.7 319.9 502.7zM421.1 364.5C415.6 361.7 388.3 348.3 383.2 346.5C378.1 344.6 374.4 343.7 370.7 349.3C367 354.9 356.4 367.3 353.1 371.1C349.9 374.8 346.6 375.3 341.1 372.5C308.5 356.2 287.1 343.4 265.6 306.5C259.9 296.7 271.3 297.4 281.9 276.2C283.7 272.5 282.8 269.3 281.4 266.5C280 263.7 268.9 236.4 264.3 225.3C259.8 214.5 255.2 216 251.8 215.8C248.6 215.6 244.9 215.6 241.2 215.6C237.5 215.6 231.5 217 226.4 222.5C221.3 228.1 207 241.5 207 268.8C207 296.1 226.9 322.5 229.6 326.2C232.4 329.9 268.7 385.9 324.4 410C359.6 425.2 373.4 426.5 391 423.9C401.7 422.3 423.8 410.5 428.4 397.5C433 384.5 433 373.4 431.6 371.1C430.3 368.6 426.6 367.2 421.1 364.5z" /></svg></span>
                  WhatsApp
                </a>
                <a href="tel:0031578760508" className='border border-[#0066FF] rounded-sm py-2.5 bg-white text-[#0066FF] font-bold text-sm flex items-center justify-center gap-1.5 lg:gap-3 w-full cursor-pointer hover:text-white hover:bg-[#0066FF] transition-colors'>
                  <span><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640" fill="currentColor" className="size-5"><path d="M376 32C504.1 32 608 135.9 608 264C608 277.3 597.3 288 584 288C570.7 288 560 277.3 560 264C560 162.4 477.6 80 376 80C362.7 80 352 69.3 352 56C352 42.7 362.7 32 376 32zM384 224C401.7 224 416 238.3 416 256C416 273.7 401.7 288 384 288C366.3 288 352 273.7 352 256C352 238.3 366.3 224 384 224zM352 152C352 138.7 362.7 128 376 128C451.1 128 512 188.9 512 264C512 277.3 501.3 288 488 288C474.7 288 464 277.3 464 264C464 215.4 424.6 176 376 176C362.7 176 352 165.3 352 152zM176.1 65.4C195.8 60 216.4 70.1 224.2 88.9L264.7 186.2C271.6 202.7 266.8 221.8 252.9 233.2L208.8 269.3C241.3 340.9 297.8 399.3 368.1 434.2L406.7 387C418 373.1 437.1 368.4 453.7 375.2L551 415.8C569.8 423.6 579.9 444.2 574.5 463.9L573 469.4C555.4 534.1 492.9 589.3 416.6 573.2C241.6 536.1 103.9 398.4 66.8 223.4C50.7 147.1 105.9 84.6 170.5 66.9L176 65.4z" /></svg></span>
                  Bel ons
                </a>
              </div>
            </div>
          </motion.div>

          {/* Unified Related Products Section */}
          {(musthaveprodKeys.length > 0 ||
            matchingProducts.length > 0 ||
            matchingKnobroseKeys.length > 0 ||
            matchingRoseKeys.length > 0 ||
            pcroseKeys.length > 0 ||
            blindtoiletroseKeys.length > 0) && (
              <motion.div initial="visible" animate="visible" variants={fadeInUp} className="mt-8 space-y-8 block lg:hidden">

                {/* 1. Must Have Products */}
                {musthaveprodKeys.length > 0 && (
                  <div id="musthaveprod-section">
                    <div className="mb-4">
                      <h3 className="text-[#1C2530] font-bold text-2xl lg:text-3xl">Aanbevolen producten</h3>
                    </div>
                    <div className="space-y-3">
                      {musthaveprodKeys.map((item, index) => (
                        <RecommendedProductItem key={item.id || index} item={item} />
                      ))}
                    </div>
                  </div>
                )}

                {/* 2. Accessories */}
                {matchingProducts.length > 0 && (
                  <div id="accessories-section">
                    <div className="mb-4">
                      <h3 className="text-[#1C2530] font-bold text-2xl lg:text-3xl">Bijpassende accessoires</h3>
                    </div>
                    <div className="space-y-3">
                      {matchingProducts.map((item, index) => (
                        <RecommendedProductItem key={item.id || index} item={item} />
                      ))}
                    </div>
                  </div>
                )}

                {/* 3. Matching Knob Roses */}
                {matchingKnobroseKeys.length > 0 && (
                  <div id="knobroses-section">
                    <div className="mb-4">
                      <h3 className="text-[#1C2530] font-bold text-2xl lg:text-3xl">Bijpassende rozetten</h3>
                    </div>
                    <div className="space-y-3">
                      {matchingKnobroseKeys.map((item, index) => (
                        <RecommendedProductItem key={item.id || index} item={item} />
                      ))}
                    </div>
                  </div>
                )}

                {/* 4. Matching Key Roses */}
                {matchingRoseKeys.length > 0 && (
                  <div id="matchingroses-section">
                    <div className="mb-4">
                      <h3 className="text-[#1C2530] font-bold text-2xl lg:text-3xl">Bijpassende sleutelrozetten</h3>
                    </div>
                    <div className="space-y-3">
                      {matchingRoseKeys.map((item, index) => (
                        <RecommendedProductItem key={item.id || index} item={item} />
                      ))}
                    </div>
                  </div>
                )}

                {/* 5. PC Roses */}
                {pcroseKeys.length > 0 && (
                  <div id="pcroses-section">
                    <div className="mb-4">
                      <h3 className="text-[#1C2530] font-bold text-2xl lg:text-3xl">Bijpassende cilinderrozetten</h3>
                    </div>
                    <div className="space-y-3">
                      {pcroseKeys.map((item, index) => (
                        <RecommendedProductItem key={item.id || index} item={item} />
                      ))}
                    </div>
                  </div>
                )}

                {/* 6. Blind / Toilet Roses */}
                {blindtoiletroseKeys.length > 0 && (
                  <div id="blindtoiletroses-section">
                    <div className="mb-4">
                      <h3 className="text-[#1C2530] font-bold text-2xl lg:text-3xl">Bijpassende toiletgarnituren</h3>
                    </div>
                    <div className="space-y-3">
                      {blindtoiletroseKeys.map((item, index) => (
                        <RecommendedProductItem key={item.id || index} item={item} />
                      ))}
                    </div>
                  </div>
                )}

              </motion.div>
            )}
        </div>

        <div className='mt-8'>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 h-full">
            <div className='flex flex-col gap-5'>
              {/* first row left accordion */}
              {product?.meta_data?.find((m: any) => m.key === "description_description")?.value && (
                <div className="bg-white rounded-lg border border-white">
                  <details className="group" open>
                    <summary className="flex justify-between items-center cursor-pointer px-4 py-3 lg:px-6 lg:py-5 font-semibold text-base lg:text-xl text-[#1C2530]">
                      Product omschrijving
                      <span className="flex items-center justify-center w-7 h-7 rounded-full bg-blue-100 text-blue-500 group-open:hidden text-2xl">+</span>
                      <span className="items-center justify-center w-7 h-7 rounded-full bg-[#0066FF] text-white hidden group-open:flex text-2xl">−</span>
                    </summary>
                    <div className="px-6 pb-4 text-[#3D4752] space-y-4 font-normal text-sm lg:text-base">
                      {(() => {
                        // const desc = product?.meta_data?.find((m: any) => m.key === "description_description")?.value;
                        const desc = product?.description;
                        if (!desc) return null;
                        return (
                          <div
                            className="prose prose-sm lg:prose-base text-[#3D4752]"
                            dangerouslySetInnerHTML={{ __html: desc }}
                          />
                        );
                      })()}
                    </div>
                  </details>
                </div>
              )}

              {/* second row left accordion */}
              {(productSKU ||
                productWidth ||
                productHeight ||
                productLength ||
                productCategories.length > 0 ||
                productBrands.length > 0 ||
                (product.attributes && product.attributes.length > 0)
              ) && (
                  <div className="bg-white rounded-lg border border-white">
                    <details className="group">
                      <summary className="flex justify-between items-center cursor-pointer px-4 py-3 lg:px-6 lg:py-5 font-semibold text-base lg:text-xl text-[#1C2530]">
                        Productspecificaties
                        <span className="flex items-center justify-center w-7 h-7 rounded-full bg-blue-100 text-blue-500 group-open:hidden text-2xl">+</span>
                        <span className="items-center justify-center w-7 h-7 rounded-full bg-[#0066FF] text-white hidden group-open:flex text-2xl">−</span>
                      </summary>

                      <div className="px-6 pb-4 text-gray-700 space-y-4">
                        <div className="overflow-x-auto">
                          <table className="w-full text-sm text-left text-gray-700">
                            <tbody>

                              {productSKU && (
                                <tr className="">
                                  <td className="px-6 py-3 font-medium text-gray-900">SKU</td>
                                  <td className="px-6 py-3">{formatSpecValue(productSKU)}</td>
                                </tr>
                              )}

                              {productWidth && (
                                <tr>
                                  <td className="px-6 py-3 font-medium text-gray-900">Breedte</td>
                                  <td className="px-6 py-3">
                                    {formatSpecValue(productWidth)}{productWidthUnit}
                                  </td>
                                </tr>
                              )}

                              {productHeight && (
                                <tr className="bg-[#F3F8FF]">
                                  <td className="px-6 py-3 font-medium text-gray-900">Hoogte</td>
                                  <td className="px-6 py-3">
                                    {formatSpecValue(productHeight)}{productHeightUnit}
                                  </td>
                                </tr>
                              )}

                              {productLength && (
                                <tr>
                                  <td className="px-6 py-3 font-medium text-gray-900">Lengte</td>
                                  <td className="px-6 py-3">
                                    {formatSpecValue(productLength)} {productLengthUnit}
                                  </td>
                                </tr>
                              )}

                              {productCategories.length > 0 && (
                                <tr className="bg-[#F3F8FF]">
                                  <td className="px-6 py-3 font-medium text-gray-900">Categorie</td>
                                  <td className="px-6 py-3">
                                    {productCategories.map((c: any) => c.name).join(", ")}
                                  </td>
                                </tr>
                              )}

                              {productBrands.length > 0 && (
                                <tr>
                                  <td className="px-6 py-3 font-medium text-gray-900">Merk</td>
                                  <td className="px-6 py-3">
                                    {productBrands.map((b: any) => b.name).join(", ")}
                                  </td>
                                </tr>
                              )}

                              {/* ------------------------- */}
                              {/* WooCommerce Product Attributes */}
                              {/* ------------------------- */}
                              {product.attributes && product.attributes.length > 0 &&
                                product.attributes
                                  .filter((attr: any) => !attr.name.toLowerCase().endsWith(" unit"))
                                  .map((attr: any, idx: number) => {
                                    const isEven = (idx % 2 === 0);
                                    // Find corresponding unit attribute (e.g. "Values" -> "Values Unit")
                                    // Helper to find case-insensitive match
                                    const unitAttrName = `${attr.name} Unit`;
                                    const unitAttr = product.attributes.find(
                                      (a: any) => a.name.toLowerCase() === unitAttrName.toLowerCase()
                                    );
                                    const unitValue = unitAttr ? unitAttr.options?.[0] : "";
                                    const mainValue = attr.options?.join(", ");

                                    return (
                                      <tr key={idx} className={isEven ? "" : "bg-[#F3F8FF]"}>
                                        <td className="px-6 py-3 font-medium text-gray-900">
                                          {attr.name}
                                        </td>
                                        <td className="px-6 py-3">
                                          {formatSpecValue(mainValue)} {unitValue}
                                        </td>
                                      </tr>
                                    );
                                  })
                              }

                            </tbody>
                          </table>
                        </div>
                      </div>
                    </details>
                  </div>
                )}

              {/* third row left accordion */}
              {isCheapestPriceEnabled && !isB2B && (
                <div className="bg-white rounded-lg border border-white">
                  <details className="group" ref={vergelijkRef}>
                    <summary className="flex justify-between items-center cursor-pointer px-4 py-3 lg:px-6 lg:py-5 font-semibold text-base lg:text-xl text-[#1C2530]">
                      Laagste prijs garantie voor dit product!
                      <span className="flex items-center justify-center w-7 h-7 rounded-full bg-blue-100 text-blue-500 group-open:hidden text-2xl">+</span>
                      <span className="items-center justify-center w-7 h-7 rounded-full bg-[#0066FF] text-white hidden group-open:flex text-2xl">−</span>
                    </summary>
                    <div className="px-6 pb-4 text-gray-700 space-y-4">
                      <div className='mt-1 flex flex-col gap-3'>
                        <p className='text-[#3D4752] font-normal text-base'>
                          Wij beloven je dat je dit artikel elders niet goedkoper tegenkomt. Is dat wel zo? Dan matchen wij de prijs én geven je nog eens 10% extra korting op de prijs van de concurrent.
                          <a
                            className='text-[#0066FF] font-bold mx-1.5' rel='nofollow'
                            href={`/laagste-prijs-garantie?product=${encodeURIComponent(currentUrl)}`}
                          >
                            Meld hier
                          </a>
                          je laagste prijs match aanvraag. <br></br> Om je te helpen te googelen om de producten bij concurrenten te vinden geven we hier al de artikelnummers waarvan wij weten dat dit artikel bekend staat:
                        </p>
                        {(() => {
                          if (!product?.meta_data) return null;
                          const keys = [
                            "crucial_data_product_sku",
                            "crucial_data_product_ean_code",
                            "crucial_data_product_bol_ean_code",
                            "crucial_data_product_factory_sku",
                            "crucial_data_product_alternate_sku_1",
                            "crucial_data_product_alternate_sku_2",
                          ];
                          const values = keys
                            .map((key) => product.meta_data.find((m: any) => m.key === key)?.value)
                            .filter((v) => v !== undefined && v !== null && String(v).trim() !== "");
                          if (values.length === 0) return null;
                          return (
                            <div className='flex gap-4 flex-wrap w-full'>
                              {values.map((value: string, idx: number) => (
                                <div
                                  key={idx}
                                  className="border border-[#E7ECF3] bg-[#F3F8FF] py-[3px] px-2.5 rounded-sm w-max text-[#3D4752] font-normal text-sm"
                                >
                                  {value}
                                </div>
                              ))}
                            </div>
                          );
                        })()}
                      </div>
                    </div>
                  </details>
                </div>
              )}

              {/* fourth row left accordion */}
              {(manualPdf || installationGuide || certificate || careInstructions) && (
                <div className="bg-white rounded-lg border border-white">
                  <details className="group">
                    <summary className="flex justify-between items-center cursor-pointer px-4 py-3 lg:px-6 lg:py-5 font-semibold text-base lg:text-xl text-[#1C2530]">
                      Downloads & Documentatie
                      <span className="flex items-center justify-center w-7 h-7 rounded-full bg-blue-100 text-blue-500 group-open:hidden text-2xl">+</span>
                      <span className="items-center justify-center w-7 h-7 rounded-full bg-[#0066FF] text-white hidden group-open:flex text-2xl">−</span>
                    </summary>
                    <div className="px-6 pb-4 text-gray-700 space-y-4">
                      <div className='flex flex-col gap-4'>
                        <p className='text-[#3D4752] font-normal text-base'>Download Technische documentatie, Installatie instructies, Product certificaat en Onderhoudsinstructies.</p>
                        <div className='grid grid-cols-1 lg:grid-cols-2 gap-4'>
                          {manualPdf && (
                            <div className='bg-[#F3F8FF] rounded-sm p-4 flex items-center justify-between'>
                              <div>
                                <p className='text-[#1C2530] font-semibold text-base'>Technische Tekening</p>
                                <p className='text-[#3D4752] font-normal text-xs'>CAD-bestand met afmetingen</p>
                              </div>
                              <div>
                                <a href={manualPdf} target="_blank" rel="noopener noreferrer" className='w-max border border-[#03B955] px-5 py-1 rounded-full text-[#03B955] font-normal text-sm'>Downloaden</a>
                              </div>
                            </div>
                          )}

                          {installationGuide && (
                            <div className='bg-[#F3F8FF] rounded-sm p-4 flex items-center justify-between'>
                              <div>
                                <p className='text-[#1C2530] font-semibold text-base'>Installatiehandleiding</p>
                                <p className='text-[#3D4752] font-normal text-xs'>Stap-voor-stap PDF-handleiding</p>
                              </div>
                              <div>
                                <a href={installationGuide} target="_blank" rel="noopener noreferrer" className='w-max border border-[#03B955] px-5 py-1 rounded-full text-[#03B955] font-normal text-sm'>Downloaden</a>
                              </div>
                            </div>
                          )}
                          {certificate && (
                            <div className='bg-[#F3F8FF] rounded-sm p-4 flex items-center justify-between'>
                              <div>
                                <p className='text-[#1C2530] font-semibold text-base'>Productcertificaat</p>
                                <p className='text-[#3D4752] font-normal text-xs'>EN1906:2012 conformiteit</p>
                              </div>
                              <div>
                                <a href={certificate} target="_blank" rel="noopener noreferrer" className='w-max border border-[#03B955] px-5 py-1 rounded-full text-[#03B955] font-normal text-sm'>Downloaden</a>
                              </div>
                            </div>
                          )}
                          {careInstructions && (
                            <div className='bg-[#F3F8FF] rounded-sm p-4 flex items-center justify-between'>
                              <div>
                                <p className='text-[#1C2530] font-semibold text-base'>Onderhoudsinstructies</p>
                                <p className='text-[#3D4752] font-normal text-xs'>Onderhoudsrichtlijnen</p>
                              </div>
                              <div>
                                <a href={careInstructions} target="_blank" rel="noopener noreferrer" className='w-max border border-[#03B955] px-5 py-1 rounded-full text-[#03B955] font-normal text-sm'>Downloaden</a>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </details>
                </div>
              )}

              {/* fifth row left accordion */}
              {/* <div className="bg-white rounded-lg border border-white">
                            <details className="group">
                                <summary className="flex justify-between items-center cursor-pointer px-4 py-3 lg:px-6 lg:py-5 font-semibold text-base lg:text-xl text-[#1C2530]">
                                    Video's
                                    <span className="flex items-center justify-center w-7 h-7 rounded-full bg-blue-100 text-blue-500 group-open:hidden text-2xl">+</span>
                                    <span className="items-center justify-center w-7 h-7 rounded-full bg-[#0066FF] text-white hidden group-open:flex text-2xl">−</span>
                                </summary>
                                <div className="px-6 pb-4 text-gray-700 space-y-4">
                                    <p className='text-[#3D4752] font-normal text-base'>Watch our professional installation demonstration for optimal results.</p>
                                    <iframe width="100%" height="350" className='rounded-md' src="https://www.youtube.com/embed/u31qwQUeGuM?si=WIn23DoCPBrCzbg7" title="YouTube video player" frameBorder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" referrerPolicy="strict-origin-when-cross-origin" allowFullScreen></iframe>
                                </div>
                            </details>
                        </div> */}
            </div>

            <div className='flex flex-col gap-5'>
              {/* first row right accordion */}
              {technicalDrawingUrl && (
                <div className="bg-white rounded-lg border border-white">
                  <details className="group" open>
                    <summary className="flex justify-between items-center cursor-pointer px-4 py-3 lg:px-6 lg:py-5 font-semibold text-base lg:text-xl text-[#1C2530]">
                      Technische documentatie
                      <span className="flex items-center justify-center w-7 h-7 rounded-full bg-blue-100 text-blue-500 group-open:hidden text-2xl">+</span>
                      <span className="items-center justify-center w-7 h-7 rounded-full bg-[#0066FF] text-white hidden group-open:flex text-2xl">−</span>
                    </summary>
                    <div className="px-6 pb-4 text-gray-700 space-y-4">
                      {/* <iframe 
                                          src={`/api/proxy?url=${encodeURIComponent(technicalDrawingUrl || "")}`}
                                          className="w-full h-[500px] rounded-md border-0"
                                          title="Technische documentatie"
                                      /> */}
                      <img
                        src={`/api/proxy?url=${encodeURIComponent(technicalDrawingUrl || "")}`}
                        className="w-full h-[500px] object-contain rounded-md border-0"
                        alt="Technische documentatie"
                      />
                    </div>
                  </details>
                </div>
              )}

              {/* second row right accordion */}
              {ambianceImages.length > 0 && (
                <div className="bg-white rounded-lg border border-white">
                  <details className="group">
                    <summary className="flex justify-between items-center cursor-pointer px-4 py-3 lg:px-6 lg:py-5 font-semibold text-base lg:text-xl text-[#1C2530]">
                      Gebruikersfoto's
                      <span className="flex items-center justify-center w-7 h-7 rounded-full bg-blue-100 text-blue-500 group-open:hidden text-2xl">+</span>
                      <span className="items-center justify-center w-7 h-7 rounded-full bg-[#0066FF] text-white hidden group-open:flex text-2xl">−</span>
                    </summary>
                    <div className="px-6 pb-4 text-gray-700 space-y-4">
                      <div className='grid grid-cols-2 lg:grid-cols-3 gap-3 lg:gap-4 pswp-gallery' id="ambiance-gallery">
                        {ambianceImages.map((img, idx) => (
                          <a
                            key={img.id || idx}
                            href={img.url}
                            data-pswp-width={img.width}
                            data-pswp-height={img.height}
                            target="_blank"
                            rel="noreferrer"
                            className="pswp-gallery-item block group relative overflow-hidden rounded-sm cursor-zoom-in"
                          >
                            <img
                              src={img.url}
                              className='w-full h-34 lg:h-52 rounded-sm object-cover transition-transform duration-500 group-hover:scale-105'
                              alt={img.alt}
                            />
                            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-300 flex items-center justify-center">
                              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="white" className="w-8 h-8 opacity-0 group-hover:opacity-100 transition-opacity scale-75 group-hover:scale-100 duration-300">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607zM10.5 7.5v6m3-3h-6" />
                              </svg>
                            </div>
                          </a>
                        ))}
                      </div>
                      <div>
                        <p className='text-[#3D4752] font-normal text-base'>Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry's standard dummy text ever since the 1500s, when an unknown printer took a galley of type and scrambled it to make a type specimen book. It has survived not only five centuries,</p>
                      </div>
                    </div>
                  </details>
                </div>
              )}

              {/* third row right accordion */}
              <div className="bg-white rounded-lg border border-white">
                <details className="group">
                  <summary className="flex justify-between items-center cursor-pointer px-4 py-3 lg:px-6 lg:py-5 font-semibold text-base lg:text-xl text-[#1C2530]">
                    Garantie
                    <span className="flex items-center justify-center w-7 h-7 rounded-full bg-blue-100 text-blue-500 group-open:hidden text-2xl">+</span>
                    <span className="items-center justify-center w-7 h-7 rounded-full bg-[#0066FF] text-white hidden group-open:flex text-2xl">−</span>
                  </summary>
                  <div className="px-6 pb-4 text-gray-700 space-y-4">
                    <p className='text-[#3D4752] font-semibold text-lg'>
                      {(() => {
                        const guarantee = product?.meta_data?.find((m: any) => m.key === "crucial_data_guarantee_period")?.value;
                        return guarantee
                          ? `Dit product heeft ${guarantee} jaar fabrieksgarantie.`
                          : "Dit product heeft [x] jaar fabrieksgarantie.";
                      })()}
                    </p>
                  </div>
                  <div className="px-6 pb-4 text-gray-700 space-y-4">
                    <p className='text-[#3D4752] font-semibold text-lg'>Garantie omvat:</p>
                    <ul className='list-disc list-inside text-[#3D4752] font-normal text-base'>
                      <li>Fabricagefouten in materialen en afwerking</li>
                      <li>Vroegtijdige slijtage van bewegende onderdelen bij normaal gebruik</li>
                      <li>Voortijdige slijtage van bewegende delen bij normaal gebruik</li>
                      <li>Coatingfouten en verkleuring (uitgezonderd normale slijtage)</li>
                    </ul>

                  </div>
                  <div className="px-6 pb-4 text-gray-700 space-y-4">
                    <p className='text-[#3D4752] font-normal text-base'>Als jij denkt recht te hebben op garantie kun je <a href='#'>hier</a> een aanvraag doen. Let op dat je de originele aankoopfactuur van bouwbeslag.nl daarbij paraat hebt. De afhandeling kan (afhankelijk van de fabrikant) bestaan uit:</p>
                    <ul className='list-disc list-inside text-[#3D4752] font-normal text-base'>
                      <li>Gratis vervanging of reparatie</li>
                      <li>Creditering van het aankoopbedrag</li>
                    </ul>
                    <p>Mogelijk moet u het products eerst toezenden alvorens wij een claim kunnen maken.</p>
                  </div>
                </details>
              </div>

              {/* fourth row right accordion - FAQ Accordion */}
              {(() => {
                const faqs: { question: string; answer: string }[] = [];
                if (product?.meta_data) {
                  for (let i = 1; i <= 8; i++) {
                    const q = product.meta_data.find((m: any) => m.key === `description_faq_${i}_question`)?.value;
                    const a = product.meta_data.find((m: any) => m.key === `description_faq_${i}_answer`)?.value;
                    if (
                      q &&
                      typeof q === "string" &&
                      q.trim() !== "" &&
                      a &&
                      typeof a === "string" &&
                      a.trim() !== ""
                    ) {
                      faqs.push({ question: q.trim(), answer: a.trim() });
                    }
                  }
                }
                if (faqs.length === 0) return null;
                const faqSchema = {
                  "@context": "https://schema.org",
                  "@type": "FAQPage",
                  "mainEntity": faqs.map((faq) => ({
                    "@type": "Question",
                    "name": faq.question,
                    "acceptedAnswer": {
                      "@type": "Answer",
                      "text": faq.answer,
                    },
                  })),
                };
                return (
                  <div className="bg-white rounded-lg border border-white">
                    <details className="group">
                      <summary className="flex justify-between items-center cursor-pointer px-4 py-3 lg:px-6 lg:py-5 font-semibold text-base lg:text-xl text-[#1C2530]">
                        Veelgestelde vragen
                        <span className="flex items-center justify-center w-7 h-7 rounded-full bg-blue-100 text-blue-500 group-open:hidden text-2xl">+</span>
                        <span className="items-center justify-center w-7 h-7 rounded-full bg-[#0066FF] text-white hidden group-open:flex text-2xl">−</span>
                      </summary>
                      <div className="px-3 lg:px-6 pb-3 lg:pb-4 text-gray-700 space-y-4 mt-3 lg:mt-0">
                        {faqs.map((faq, idx) => (
                          <div
                            key={idx}
                            className="collapse collapse-arrow border-0 border-base-300 !p-0"
                          >
                            <input
                              type="radio"
                              name="faq-accordion"
                              defaultChecked={idx === 0}
                            />
                            <div className="collapse-title text-[#3D4752] text-base lg:text-lg font-semibold p-2">
                              {faq.question}
                            </div>
                            <div className="collapse-content text-[#808D9A] text-normal text-sm p-2">
                              {faq.answer}
                            </div>
                          </div>
                        ))}
                        <script
                          type="application/ld+json"
                          dangerouslySetInnerHTML={{
                            __html: JSON.stringify(faqSchema),
                          }}
                        />
                      </div>
                    </details>
                  </div>
                );
              })()}

              {/* Reviews Accordion */}
              <div className="bg-white rounded-lg border border-white">
                <details className="group" id="reviews-accordion">
                  <summary className="flex justify-between items-center cursor-pointer px-4 py-3 lg:px-6 lg:py-5 font-semibold text-base lg:text-xl text-[#1C2530]">
                    Reviews
                    <span className="flex items-center justify-center w-7 h-7 rounded-full bg-blue-100 text-blue-500 group-open:hidden text-2xl">+</span>
                    <span className="items-center justify-center w-7 h-7 rounded-full bg-[#0066FF] text-white hidden group-open:flex text-2xl">−</span>
                  </summary>
                  <div className="px-6 pb-6 w-full">
                    <ReviewsSection productId={product.id} productName={product.name} />
                  </div>
                </details>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-100px" }}
        transition={{ duration: 0.6 }}
        className='bg-white py-4'
      >
        {/* <div className='max-w-[1440px] mx-auto py-8 px-5 lg:px-0'>
          <div className='grid grid-cols-1 lg:grid-cols-2 gap-8'>
            {matchingProducts && matchingProducts.length > 0 && (
              <div id="accessories-section" className='lg:bg-[#F7F7F7] rounded-md p-5'>
                <div className='flex justify-between items-center mb-5'>
                  <div className='flex flex-col gap-2'>
                    <p className='text-[#1C2530] font-bold text-3xl'>Bijpassende accessoires</p>
                    <p className='text-[#3D4752] font-normal text-sm lg:text-base'>Bekijk bijpassende accessoires van bouwbeslag.nl</p>
                  </div>
                  {matchingProducts.length > 2 && (
                    <div className='hidden lg:flex gap-5 items-center justify-between'>
                      <button
                        className='bg-[#e6e6e6] cursor-pointer hover:bg-[#c4c0c0] rounded-full p-2 flex text-black'
                        onClick={() => scrollCarousel(accessoriesRef, "left")}
                        aria-label="Scroll matching products left"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="size-6"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" /></svg>
                      </button>
                      <button
                        className='bg-[#0066FF] cursor-pointer rounded-full p-2 flex text-white'
                        onClick={() => scrollCarousel(accessoriesRef, "right")}
                        aria-label="Scroll matching products right"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="size-6"><path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" /></svg>
                      </button>
                    </div>
                  )}
                </div>
                <div>
                  <div className="relative">
                    <div
                      ref={accessoriesRef}
                      className="flex gap-4 overflow-x-auto scrollbar-hide snap-x snap-mandatory pb-2 scroll-smooth"
                      style={{ scrollSnapType: "x mandatory" }}
                    >
                      {matchingProducts.map((mp) => (
                        <div
                          key={mp.id}
                          className="flex-shrink-0 w-[320px] snap-start"
                          style={{ scrollSnapAlign: "start" }}
                        >
                          <ProductCard product={mp} userRole={userRole} />
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
                <div className='flex lg:hidden gap-5 items-center justify-center mt-5'>
                  <button
                    className='bg-[#e6e6e6] cursor-pointer hover:bg-[#c4c0c0] rounded-full p-2 flex text-black'
                    onClick={() => scrollCarousel(accessoriesRef, "left")}
                    aria-label="Scroll matching products left"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="size-6"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" /></svg>
                  </button>
                  <button
                    className='bg-[#0066FF] cursor-pointer rounded-full p-2 flex text-white'
                    onClick={() => scrollCarousel(accessoriesRef, "right")}
                    aria-label="Scroll matching products right"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="size-6"><path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" /></svg>
                  </button>
                </div>
              </div>
            )}

            {matchingKnobroseKeys && matchingKnobroseKeys.length > 0 && (
              <div id="knobroses-section" className='lg:bg-[#F7F7F7] rounded-md p-5'>
                <div className='flex justify-between items-center mb-5'>
                  <div className='flex flex-col gap-2'>
                    <p className='text-[#1C2530] font-bold text-3xl'>Bijpassende rozetten</p>
                    <p className='text-[#3D4752] font-normal text-sm lg:text-base'>Bekijk bijpassende rozetten van bouwbeslag.nl</p>
                  </div>
                  {matchingKnobroseKeys.length > 2 && (
                    <div className='hidden lg:flex gap-5 items-center justify-between'>
                      <button
                        className='bg-[#e6e6e6] cursor-pointer hover:bg-[#c4c0c0] rounded-full p-2 flex text-black'
                        onClick={() => scrollCarousel(knobroseRef, "left")}
                        aria-label="Scroll matching products left"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="size-6"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" /></svg>
                      </button>
                      <button
                        className='bg-[#0066FF] cursor-pointer rounded-full p-2 flex text-white'
                        onClick={() => scrollCarousel(knobroseRef, "right")}
                        aria-label="Scroll matching products right"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="size-6"><path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" /></svg>
                      </button>
                    </div>
                  )}
                </div>
                <div>
                  <div className="relative">
                    <div
                      ref={knobroseRef}
                      className="flex gap-4 overflow-x-auto scrollbar-hide snap-x snap-mandatory pb-2 scroll-smooth"
                      style={{ scrollSnapType: "x mandatory" }}
                    >
                      {matchingKnobroseKeys.map((mkk) => (
                        <div
                          key={mkk.id}
                          className="flex-shrink-0 w-[320px] snap-start"
                          style={{ scrollSnapAlign: "start" }}
                        >
                          <ProductCard product={mkk} />
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
                <div className='flex lg:hidden gap-5 items-center justify-center mt-5'>
                  <button
                    className='bg-[#e6e6e6] cursor-pointer hover:bg-[#c4c0c0] rounded-full p-2 flex text-black'
                    onClick={() => scrollCarousel(knobroseRef, "left")}
                    aria-label="Scroll matching products left"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="size-6"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" /></svg>
                  </button>
                  <button
                    className='bg-[#0066FF] cursor-pointer rounded-full p-2 flex text-white'
                    onClick={() => scrollCarousel(knobroseRef, "right")}
                    aria-label="Scroll matching products right"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="size-6"><path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" /></svg>
                  </button>
                </div>
              </div>
            )}

            {matchingRoseKeys && matchingRoseKeys.length > 0 && (
              <div id="matchingroses-section" className='lg:bg-[#F7F7F7] rounded-md p-5'>
                <div className='flex justify-between items-center mb-5'>
                  <div className='flex flex-col gap-2'>
                    <p className='text-[#1C2530] font-bold text-3xl'>Matching keyroses</p>
                    <p className='text-[#3D4752] font-normal text-sm lg:text-base'>Check out Matching keyroses from bouwbeslag.nl</p>
                  </div>
                  {matchingRoseKeys.length > 2 && (
                    <div className='hidden lg:flex gap-5 items-center justify-between'>
                      <button
                        className='bg-[#e6e6e6] cursor-pointer hover:bg-[#c4c0c0] rounded-full p-2 flex text-black'
                        onClick={() => scrollCarousel(keyrosesRef, "left")}
                        aria-label="Scroll matching products left"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="size-6"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" /></svg>
                      </button>
                      <button
                        className='bg-[#0066FF] cursor-pointer rounded-full p-2 flex text-white'
                        onClick={() => scrollCarousel(keyrosesRef, "right")}
                        aria-label="Scroll matching products right"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="size-6"><path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" /></svg>
                      </button>
                    </div>
                  )}
                </div>
                <div>
                  <div className="relative">
                    <div
                      ref={keyrosesRef}
                      className="flex gap-4 overflow-x-auto scrollbar-hide snap-x snap-mandatory pb-2 scroll-smooth"
                      style={{ scrollSnapType: "x mandatory" }}
                    >
                      {matchingRoseKeys.map((mrk) => (
                        <div
                          key={mrk.id}
                          className="flex-shrink-0 w-[320px] snap-start"
                          style={{ scrollSnapAlign: "start" }}
                        >
                          <ProductCard product={mrk} />
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
                <div className='flex lg:hidden gap-5 items-center justify-center mt-5'>
                  <button
                    className='bg-[#e6e6e6] cursor-pointer hover:bg-[#c4c0c0] rounded-full p-2 flex text-black'
                    onClick={() => scrollCarousel(keyrosesRef, "left")}
                    aria-label="Scroll matching products left"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="size-6"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" /></svg>
                  </button>
                  <button
                    className='bg-[#0066FF] cursor-pointer rounded-full p-2 flex text-white'
                    onClick={() => scrollCarousel(keyrosesRef, "right")}
                    aria-label="Scroll matching products right"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="size-6"><path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" /></svg>
                  </button>
                </div>
              </div>
            )}

            {pcroseKeys && pcroseKeys.length > 0 && (
              <div id="pcroses-section" className='lg:bg-[#F7F7F7] rounded-md p-5'>
                <div className='flex justify-between items-center mb-5'>
                  <div className='flex flex-col gap-2'>
                    <p className='text-[#1C2530] font-bold text-3xl'>Matching cilinderosses</p>
                    <p className='text-[#3D4752] font-normal text-sm lg:text-base'>Check out Matching cilinderosses from bouwbeslag.nl</p>
                  </div>
                  {pcroseKeys.length > 2 && (
                    <div className='hidden lg:flex gap-5 items-center justify-between'>
                      <button
                        className='bg-[#e6e6e6] cursor-pointer hover:bg-[#c4c0c0] rounded-full p-2 flex text-black'
                        onClick={() => scrollCarousel(cillinderrosesRef, "left")}
                        aria-label="Scroll matching products left"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="size-6"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" /></svg>
                      </button>
                      <button
                        className='bg-[#0066FF] cursor-pointer rounded-full p-2 flex text-white'
                        onClick={() => scrollCarousel(cillinderrosesRef, "right")}
                        aria-label="Scroll matching products right"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="size-6"><path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" /></svg>
                      </button>
                    </div>
                  )}
                </div>
                <div>
                  <div className="relative">
                    <div
                      ref={cillinderrosesRef}
                      className="flex gap-4 overflow-x-auto scrollbar-hide snap-x snap-mandatory pb-2 scroll-smooth"
                      style={{ scrollSnapType: "x mandatory" }}
                    >
                      {pcroseKeys.map((pk) => (
                        <div
                          key={pk.id}
                          className="flex-shrink-0 w-[320px] snap-start"
                          style={{ scrollSnapAlign: "start" }}
                        >
                          <ProductCard product={pk} />
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
                <div className='flex lg:hidden gap-5 items-center justify-center mt-5'>
                  <button
                    className='bg-[#e6e6e6] cursor-pointer hover:bg-[#c4c0c0] rounded-full p-2 flex text-black'
                    onClick={() => scrollCarousel(cillinderrosesRef, "left")}
                    aria-label="Scroll matching products left"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="size-6"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" /></svg>
                  </button>
                  <button
                    className='bg-[#0066FF] cursor-pointer rounded-full p-2 flex text-white'
                    onClick={() => scrollCarousel(cillinderrosesRef, "right")}
                    aria-label="Scroll matching products right"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="size-6"><path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" /></svg>
                  </button>
                </div>
              </div>
            )}

            {blindtoiletroseKeys && blindtoiletroseKeys.length > 0 && (
              <div id="blindtoiletroses-section" className='lg:bg-[#F7F7F7] rounded-md p-5'>
                <div className='flex justify-between items-center mb-5'>
                  <div className='flex flex-col gap-2'>
                    <p className='text-[#1C2530] font-bold text-3xl'>Matching blind roses</p>
                    <p className='text-[#3D4752] font-normal text-sm lg:text-base'>Check out Matching blind roses from bouwbeslag.nl</p>
                  </div>
                  {blindtoiletroseKeys.length > 2 && (
                    <div className='hidden lg:flex gap-5 items-center justify-between'>
                      <button
                        className='bg-[#e6e6e6] cursor-pointer hover:bg-[#c4c0c0] rounded-full p-2 flex text-black'
                        onClick={() => scrollCarousel(blindrosesRef, "left")}
                        aria-label="Scroll matching products left"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="size-6"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" /></svg>
                      </button>
                      <button
                        className='bg-[#0066FF] cursor-pointer rounded-full p-2 flex text-white'
                        onClick={() => scrollCarousel(blindrosesRef, "right")}
                        aria-label="Scroll matching products right"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="size-6"><path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" /></svg>
                      </button>
                    </div>
                  )}
                </div>
                <div>
                  <div className="relative">
                    <div
                      ref={blindrosesRef}
                      className="flex gap-4 overflow-x-auto scrollbar-hide snap-x snap-mandatory pb-2 scroll-smooth"
                      style={{ scrollSnapType: "x mandatory" }}
                    >
                      {blindtoiletroseKeys.map((btk) => (
                        <div
                          key={btk.id}
                          className="flex-shrink-0 w-[320px] snap-start"
                          style={{ scrollSnapAlign: "start" }}
                        >
                          <ProductCard product={btk} />
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
                <div className='flex lg:hidden gap-5 items-center justify-center mt-5'>
                  <button
                    className='bg-[#e6e6e6] cursor-pointer hover:bg-[#c4c0c0] rounded-full p-2 flex text-black'
                    onClick={() => scrollCarousel(blindrosesRef, "left")}
                    aria-label="Scroll matching products left"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="size-6"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" /></svg>
                  </button>
                  <button
                    className='bg-[#0066FF] cursor-pointer rounded-full p-2 flex text-white'
                    onClick={() => scrollCarousel(blindrosesRef, "right")}
                    aria-label="Scroll matching products right"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="size-6"><path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" /></svg>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div> */}
      </motion.div>

      <div className={`fixed bottom-0 left-0 w-full bg-white text-black p-3 lg:p-4 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)] 
                  transition-transform duration-300 ease-in-out z-50 ${isVisible ? 'translate-y-0' : 'translate-y-full'
        }`}>

        <div className="flex flex-col lg:flex-row items-center gap-3 lg:gap-4 justify-center max-w-[1440px] mx-auto">
          <div className="flex flex-nowrap lg:flex-nowrap items-center gap-1 lg:gap-4 justify-between">
            <div className='flex justify-center items-center w-[35%]'>
              <p className="text-lg lg:text-3xl font-bold text-[#1C2530]">
                {(() => {
                  const getMeta = (key: string) => product?.meta_data?.find((m: any) => m.key === key)?.value;
                  const currency = product.currency_symbol || "€";

                  // Dynamic Price Logic (duped for now)
                  const isB2B = userRole && (userRole.includes("b2b_customer") || userRole.includes("administrator"));
                  const b2bKey = "crucial_data_b2b_and_b2c_sales_price_b2b";
                  const b2cKey = "crucial_data_b2b_and_b2c_sales_price_b2c";

                  let sale = 0;

                  if (isB2B) {
                    if (product.regular_price) {
                      sale = parseFloat(product.regular_price);
                    } else if (product.price) {
                      sale = parseFloat(product.price);
                    }
                  } else {
                    sale = product.price ? parseFloat(product.price) : 0;
                    const acfPriceRaw = getMeta(b2cKey);
                    if (acfPriceRaw && !isNaN(parseFloat(acfPriceRaw))) {
                      sale = parseFloat(acfPriceRaw);
                    }
                  }

                  const advisedRaw = getMeta("crucial_data_unit_price");
                  const advised = advisedRaw && !isNaN(parseFloat(advisedRaw)) ? parseFloat(advisedRaw) : null;

                  // Tax Logic
                  const taxMultiplier = 1 + (taxRate / 100);
                  const finalPrice = isB2B ? sale : (sale ? sale * taxMultiplier : 0);

                  let basePrice = finalPrice ?? advised ?? 0;

                  // Apply volume discount if selected
                  if (selectedDiscount !== null) {
                    const pct = discounts[selectedDiscount]?.percentage ?? 0;
                    if (pct > 0) {
                      basePrice = basePrice - (basePrice * pct) / 100;
                    }
                  }

                  const totalPrice = basePrice * quantity;

                  return isLoading ? "..." : `${currency}${totalPrice.toFixed(2)}`;
                })()}
              </p>
              <span className="text-xs text-gray-500 font-normal ml-2">
                {userRole && (userRole.includes("b2b_customer") || userRole.includes("administrator")) ? "(excl. BTW)" : "(incl. BTW)"}
              </span>
            </div>

            <div className="flex border border-[#EDEDED] shadow-xs rounded-sm overflow-hidden bg-white">
              <button
                type="button"
                onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                className="px-2.5 py-1.5 text-lg cursor-pointer border-r border-[#EDEDED]"
              >-</button>
              <div className="px-1.5 py-1 text-base font-medium text-center min-w-[40px] flex items-center justify-center">
                {quantity.toString().padStart(1, '0')}
              </div>
              <button
                type="button"
                onClick={() =>
                  setQuantity((prev) => {
                    // If limit exists AND backorders disabled, clamp. Else just increment.
                    if (availableStock !== null && !backordersAllowed) {
                      return Math.min(prev + 1, availableStock);
                    }
                    return prev + 1;
                  })
                }
                className="flex justify-center px-2.5 py-1.5 text-lg cursor-pointer border-l border-[#EDEDED]"
              >+</button>
            </div>

            <div className=''>
              <div className="relative group">
                <button
                  type="button"
                  disabled={
                    isAddingToCart ||
                    isOutOfStock ||
                    isQuantityInvalid ||
                    isStockLimitReached
                  }
                  className={`cursor-pointer flex-1 px-2.5 py-2.5 rounded-sm transition font-semibold flex items-center justify-center gap-3 w-full text-sm
                            ${isOutOfStock || isQuantityInvalid || isStockLimitReached
                      ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                      : "bg-blue-600 text-white hover:bg-blue-700"
                    }`}
                  onClick={handleAddToCart}
                >
                  {/* Loader spinner if adding, else success, error or cart icon */}
                  {isAddingToCart ? (
                    <svg className="size-5 lg:size-6 animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="white" strokeWidth="4"></circle><path className="opacity-75" fill="white" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path></svg>
                  ) : addCartSuccess ? (
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2.5" stroke="white" className="size-5 lg:size-6"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                  ) : addCartError ? (
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="#FF3B3B" className="size-5 lg:size-6">
                      <circle cx="12" cy="12" r="10" stroke="#FF3B3B" strokeWidth="2" fill="none" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 7v5m0 4h.01" stroke="#FF3B3B" strokeWidth="2" />
                    </svg>
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="white" className="size-5 lg:size-6 hidden"><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 0 0-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 0 0-16.536-1.84M7.5 14.25 5.106 5.272M6 20.25a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Zm12.75 0a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Z" /></svg>
                  )}
                  In winkelwagen
                </button>
                {(isOutOfStock || isQuantityInvalid || isStockLimitReached) && (
                  <div className="absolute z-20 bottom-full mb-3 hidden group-hover:block w-full">
                    <div className="bg-black text-white text-sm rounded px-4 py-2 shadow-lg text-center">
                      {isOutOfStock
                        ? "Dit product is momenteel niet op voorraad"
                        : isStockLimitReached
                          ? "Je hebt de maximale voorraad al in je winkelwagen"
                          : "De geselecteerde hoeveelheid overschrijdt de beschikbare voorraad"}
                      {availableStock !== null && (
                        <div className="text-xs opacity-80 mt-1">
                          Beschikbare voorraad: {availableStock}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>


    </div>
  );
};

// export default ProductPage;