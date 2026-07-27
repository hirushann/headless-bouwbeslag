import {
  applyDiscountToCents,
  calculateOrderAmounts,
  centsToNumber,
  grossToNetCents,
  toCents,
  vatOfCents,
} from "./checkout-state.ts";

export const DEFAULT_VAT_RATE = 21;

type PriceValue = string | number | { amount?: string | number } | null | undefined;

type PriceProduct = {
  price?: PriceValue;
  sale_price?: PriceValue;
  regular_price?: PriceValue;
  price_b2b?: PriceValue;
  price_b2c?: PriceValue;
  meta_data?: { key: string; value: unknown }[];
};

export type VolumeDiscount = {
  quantity: number;
  percentage: number;
};

const money = (value: PriceValue): number | null => {
  const raw = typeof value === "object" && value !== null ? value.amount : value;
  const parsed = typeof raw === "number" ? raw : Number.parseFloat(String(raw ?? ""));
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : null;
};

const meta = (product: PriceProduct, key: string) =>
  product.meta_data?.find((item) => item.key === key)?.value;

export const roundPrice = (value: number) =>
  centsToNumber(toCents(value));

export const addVat = (priceExVat: number, vatRate = DEFAULT_VAT_RATE) =>
  centsToNumber(toCents(priceExVat) + vatOfCents(toCents(priceExVat), vatRate));

export const removeVat = (priceInclVat: number, vatRate = DEFAULT_VAT_RATE) =>
  centsToNumber(grossToNetCents(priceInclVat, vatRate));

export const getDisplayPrice = (
  priceExVat: number,
  isB2B: boolean,
  vatRate = DEFAULT_VAT_RATE,
) => isB2B ? roundPrice(priceExVat) : addVat(priceExVat, vatRate);

export const getDisplayTotal = (
  priceExVat: number,
  quantity: number,
  isB2B: boolean,
  vatRate = DEFAULT_VAT_RATE,
) => centsToNumber(calculateOrderAmounts({
  items: [{ unitPriceExVat: priceExVat, quantity }],
  vatRate: isB2B ? 0 : vatRate,
}).totalCents);

export const formatPrice = (value: number) =>
  new Intl.NumberFormat("nl-NL", {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);

export const getVolumeDiscounts = (product: PriceProduct): VolumeDiscount[] => {
  const nested = meta(product, "crucial_data_discounts");
  const candidates: unknown[] = Array.isArray(nested) ? nested : [];
  const discounts = candidates.flatMap((entry) => {
    if (!entry || typeof entry !== "object") return [];
    const item = entry as Record<string, unknown>;
    const quantity = Number.parseInt(String(item.discount_quantity ?? ""), 10);
    const percentage = Number.parseFloat(String(item.discount_percentage ?? ""));
    return Number.isFinite(quantity) && quantity > 0 && Number.isFinite(percentage) && percentage >= 0
      ? [{ quantity, percentage }]
      : [];
  });

  if (discounts.length === 0) {
    for (let index = 1; index <= 3; index++) {
      const quantity = Number.parseInt(String(
        meta(product, `crucial_data_discounts_discount_quantity_${index}`)
        ?? meta(product, `crucial_data_discounts_${index - 1}_discount_quantity`)
        ?? meta(product, `crucial_data_discounts_${index}_discount_quantity`)
        ?? "",
      ), 10);
      const percentage = Number.parseFloat(String(
        meta(product, `crucial_data_discounts_discount_percentage_${index}`)
        ?? meta(product, `crucial_data_discounts_${index - 1}_discount_percentage`)
        ?? meta(product, `crucial_data_discounts_${index}_discount_percentage`)
        ?? "",
      ));
      if (Number.isFinite(quantity) && quantity > 0 && Number.isFinite(percentage) && percentage >= 0) {
        discounts.push({ quantity, percentage });
      }
    }
  }

  return discounts.sort((a, b) => a.quantity - b.quantity);
};

export const getVolumeDiscount = (discounts: VolumeDiscount[], quantity: number) =>
  discounts.reduce(
    (percentage, discount) => quantity >= discount.quantity ? discount.percentage : percentage,
    0,
  );

export const applyVolumeDiscount = (
  basePrice: number,
  discounts: VolumeDiscount[],
  quantity: number,
) => centsToNumber(applyDiscountToCents(
  basePrice,
  getVolumeDiscount(discounts, quantity),
));

export function getProductPricing(
  product: PriceProduct,
  {
    isB2B,
    vatRate = DEFAULT_VAT_RATE,
    quantity = 1,
    discountPercentage = 0,
  }: {
    isB2B: boolean;
    vatRate?: number;
    quantity?: number;
    discountPercentage?: number;
  },
) {
  const rolePrice = isB2B
    ? money(product.price_b2b) ?? money(meta(product, "crucial_data_b2b_and_b2c_sales_price_b2b") as PriceValue)
    : money(product.price_b2c) ?? money(meta(product, "crucial_data_b2b_and_b2c_sales_price_b2c") as PriceValue);
  const basePrice = rolePrice
    ?? money(product.price)
    ?? money(product.sale_price)
    ?? money(product.regular_price)
    ?? 0;
  const safeDiscount = Math.min(100, Math.max(0, discountPercentage));
  const unitExVat = centsToNumber(applyDiscountToCents(basePrice, safeDiscount));
  const unitInclVat = addVat(unitExVat, vatRate);
  const advisedExVat = money(meta(product, "crucial_data_unit_price") as PriceValue)
    ?? money(product.regular_price);
  const advisedDisplay = advisedExVat === null
    ? null
    : isB2B ? roundPrice(advisedExVat) : addVat(advisedExVat, vatRate);
  const finalPrice = getDisplayPrice(unitExVat, isB2B, vatRate);
  const secondaryPrice = isB2B ? unitInclVat : unitExVat;
  const discountPercent = advisedExVat && advisedExVat > unitExVat
    ? Math.round(((advisedExVat - unitExVat) / advisedExVat) * 100)
    : null;
  const safeQuantity = Math.max(1, Math.floor(quantity) || 1);

  return {
    cartPrice: unitExVat,
    unitExVat,
    unitInclVat,
    displayPrice: finalPrice,
    finalPrice,
    totalPrice: getDisplayTotal(unitExVat, safeQuantity, isB2B, vatRate),
    taxLabel: isB2B ? "(excl. BTW)" : "(incl. BTW)",
    secondaryPrice,
    secondaryTaxLabel: isB2B ? "(incl. BTW)" : "(excl. BTW)",
    advisedExVat,
    advisedDisplay,
    discountPercent,
    showStrikeThrough: advisedDisplay !== null && finalPrice < advisedDisplay,
  };
}
