export interface AppliedCoupon {
  code: string;
  amount: string | number;
  discount_type: "percent" | "fixed_cart" | string;
  [key: string]: any;
}

export type MoneyInput = string | number;

const BIGINT_ZERO = BigInt(0);
const BIGINT_ONE = BigInt(1);
const BIGINT_TWO = BigInt(2);
const BIGINT_HUNDRED = BigInt(100);
const pow10 = (places: number) => BigInt(10) ** BigInt(places);

const decimalToScaledInteger = (value: MoneyInput, places: number) => {
  const normalized = String(value ?? 0).trim().replace(",", ".");
  const match = normalized.match(/^(-)?(\d+)(?:\.(\d+))?$/);
  if (!match) return BIGINT_ZERO;

  const sign = match[1] ? -BIGINT_ONE : BIGINT_ONE;
  const fraction = match[3] || "";
  const kept = fraction.slice(0, places).padEnd(places, "0");
  const remainder = fraction.slice(places);
  let scaled = BigInt(match[2]) * pow10(places) + BigInt(kept || "0");

  if (remainder[0] >= "5") scaled += BIGINT_ONE;
  return scaled * sign;
};

const divideHalfUp = (numerator: bigint, denominator: bigint) => {
  const sign = numerator < BIGINT_ZERO ? -BIGINT_ONE : BIGINT_ONE;
  const absolute = numerator < BIGINT_ZERO ? -numerator : numerator;
  return sign * ((absolute + denominator / BIGINT_TWO) / denominator);
};

export const toCents = (value: MoneyInput) =>
  Number(decimalToScaledInteger(value, 2));

export const centsToAmount = (cents: number) => {
  const sign = cents < 0 ? "-" : "";
  const absolute = Math.abs(cents);
  return `${sign}${Math.floor(absolute / 100)}.${String(absolute % 100).padStart(2, "0")}`;
};

export const centsPerQuantityToPrecision = (
  cents: number,
  quantity: number,
  places = 10,
) => {
  const safeQuantity = Math.max(1, Math.floor(Number(quantity) || 1));
  const scale = pow10(places);
  const scaled = divideHalfUp(
    BigInt(cents) * scale,
    BigInt(safeQuantity) * BIGINT_HUNDRED,
  );
  const sign = scaled < BIGINT_ZERO ? "-" : "";
  const absolute = scaled < BIGINT_ZERO ? -scaled : scaled;
  const digits = absolute.toString().padStart(places + 1, "0");
  return `${sign}${digits.slice(0, -places)}.${digits.slice(-places)}`;
};

export const centsToNumber = (cents: number) => cents / 100;

export const percentageOfCents = (cents: number, percentage: MoneyInput) => {
  const rate = decimalToScaledInteger(percentage, 4);
  return Number(divideHalfUp(BigInt(cents) * rate, BIGINT_HUNDRED * pow10(4)));
};

export const applyDiscountToCents = (amount: MoneyInput, percentage: MoneyInput) => {
  const scale = pow10(4);
  const amountScaled = decimalToScaledInteger(amount, 4);
  const rate = decimalToScaledInteger(percentage, 4);
  return Number(divideHalfUp(
    amountScaled * (BIGINT_HUNDRED * scale - rate),
    BIGINT_HUNDRED * scale * BIGINT_HUNDRED,
  ));
};

export const vatOfCents = (netCents: number, vatRate: MoneyInput = 21) =>
  percentageOfCents(netCents, vatRate);

export const grossToNetCents = (gross: MoneyInput, vatRate: MoneyInput = 21) => {
  const rate = decimalToScaledInteger(vatRate, 4);
  return Number(divideHalfUp(
    BigInt(toCents(gross)) * BIGINT_HUNDRED * pow10(4),
    BIGINT_HUNDRED * pow10(4) + rate,
  ));
};

type OrderPricingItem = {
  unitPriceExVat: MoneyInput;
  quantity: number;
};

type OrderPricingFee = {
  amountExVat: MoneyInput;
};

export const calculateOrderAmounts = ({
  items,
  shippingExVat = 0,
  fees = [],
  discountExVat = 0,
  vatRate = 21,
}: {
  items: OrderPricingItem[];
  shippingExVat?: MoneyInput;
  fees?: OrderPricingFee[];
  discountExVat?: MoneyInput;
  vatRate?: MoneyInput;
}) => {
  const lines = items.map((item) => {
    const quantity = Math.max(1, Math.floor(Number(item.quantity) || 1));
    const unitExVatCents = toCents(item.unitPriceExVat);
    const lineExVatCents = unitExVatCents * quantity;
    const unitVatCents = vatOfCents(unitExVatCents, vatRate);
    const lineVatCents = vatOfCents(lineExVatCents, vatRate);
    return {
      quantity,
      unitExVat: centsToAmount(unitExVatCents),
      unitVat: centsToAmount(unitVatCents),
      unitInclVat: centsToAmount(unitExVatCents + unitVatCents),
      lineExVat: centsToAmount(lineExVatCents),
      lineVat: centsToAmount(lineVatCents),
      lineTotal: centsToAmount(lineExVatCents + lineVatCents),
      unitExVatCents,
      lineExVatCents,
      lineVatCents,
      lineTotalCents: lineExVatCents + lineVatCents,
    };
  });
  const shippingExVatCents = toCents(shippingExVat);
  const shippingVatCents = vatOfCents(shippingExVatCents, vatRate);
  const feeLines = fees.map((fee) => {
    const exVatCents = toCents(fee.amountExVat);
    return { exVatCents, vatCents: vatOfCents(exVatCents, vatRate) };
  });
  const discountExVatCents = Math.max(0, toCents(discountExVat));
  const discountVatCents = vatOfCents(discountExVatCents, vatRate);
  const subtotalExVatCents = lines.reduce((sum, line) => sum + line.lineExVatCents, 0);
  const subtotalVatCents = lines.reduce((sum, line) => sum + line.lineVatCents, 0);
  const feesExVatCents = feeLines.reduce((sum, fee) => sum + fee.exVatCents, 0);
  const feesVatCents = feeLines.reduce((sum, fee) => sum + fee.vatCents, 0);
  const netTotalCents = Math.max(
    subtotalExVatCents - discountExVatCents + shippingExVatCents + feesExVatCents,
    0,
  );
  const taxCents = Math.max(
    lines.reduce((sum, line) => sum + line.lineVatCents, 0)
      - discountVatCents
      + shippingVatCents
      + feesVatCents,
    0,
  );
  const totalCents = netTotalCents + taxCents;

  return {
    lines,
    feeLines: feeLines.map((fee) => ({
      exVat: centsToAmount(fee.exVatCents),
      vat: centsToAmount(fee.vatCents),
      total: centsToAmount(fee.exVatCents + fee.vatCents),
    })),
    subtotalExVat: centsToAmount(subtotalExVatCents),
    subtotalVat: centsToAmount(subtotalVatCents),
    subtotalTotal: centsToAmount(subtotalExVatCents + subtotalVatCents),
    shippingExVat: centsToAmount(shippingExVatCents),
    shippingVat: centsToAmount(shippingVatCents),
    shippingTotal: centsToAmount(shippingExVatCents + shippingVatCents),
    feesExVat: centsToAmount(feesExVatCents),
    feesVat: centsToAmount(feesVatCents),
    discountExVat: centsToAmount(discountExVatCents),
    discountVat: centsToAmount(discountVatCents),
    netTotal: centsToAmount(netTotalCents),
    tax: centsToAmount(taxCents),
    total: centsToAmount(totalCents),
    subtotalExVatCents,
    shippingExVatCents,
    shippingVatCents,
    netTotalCents,
    taxCents,
    totalCents,
  };
};

export const calculateCouponDiscount = (
  subtotalExVat: number,
  coupon: AppliedCoupon | null,
  vatRate = 0.21,
) => {
  if (!coupon) return 0;
  const amount = Number(coupon.amount) || 0;
  if (coupon.discount_type === "percent") {
    return centsToNumber(percentageOfCents(toCents(subtotalExVat), amount));
  }
  if (coupon.discount_type === "fixed_cart") {
    return centsToNumber(grossToNetCents(amount, vatRate * 100));
  }
  return 0;
};

export const resolveCouponValidation = (result: {
  success: boolean;
  coupon?: AppliedCoupon | null;
  message?: string;
}) => {
  if (result.success && result.coupon) {
    return {
      coupon: result.coupon,
      message: { type: "success" as const, text: `Coupon "${result.coupon.code}" applied!` },
    };
  }
  return {
    coupon: null,
    message: { type: "error" as const, text: result.message || "Invalid coupon" },
  };
};

export const calculateCheckoutTotals = ({
  subtotalExVat,
  discountExVat = 0,
  shippingExVat = 0,
  feesExVat = 0,
  vatRate = 0.21,
}: {
  subtotalExVat: number;
  discountExVat?: number;
  shippingExVat?: number;
  feesExVat?: number;
  vatRate?: number;
}) => {
  const result = calculateOrderAmounts({
    items: [{ unitPriceExVat: subtotalExVat, quantity: 1 }],
    discountExVat,
    shippingExVat,
    fees: [{ amountExVat: feesExVat }],
    vatRate: vatRate * 100,
  });
  return {
    netTotal: centsToNumber(result.netTotalCents),
    tax: centsToNumber(result.taxCents),
    grossTotal: centsToNumber(result.totalCents),
  };
};

export const createSubmissionGuard = () => {
  let active = false;
  return {
    tryStart: () => {
      if (active) return false;
      active = true;
      return true;
    },
    release: () => {
      active = false;
    },
  };
};

export type OrderUiStatus = "success" | "failed" | "cancelled" | "backend_failed" | "pending";

export const resolveOrderVerification = (result: {
  success: boolean;
  status?: string;
  message?: string;
}): { status: OrderUiStatus; clearCart: boolean; message: string } => {
  if (!result.success) {
    return {
      status: result.status === "backend_failed" ? "backend_failed" : "failed",
      clearCart: false,
      message: result.message || "Er is iets misgegaan met de order verificatie.",
    };
  }
  if (result.status && ["processing", "completed", "on-hold"].includes(result.status)) {
    return { status: "success", clearCart: true, message: "" };
  }
  if (result.status === "cancelled") return { status: "cancelled", clearCart: false, message: "" };
  if (result.status === "failed") return { status: "failed", clearCart: false, message: "" };
  return {
    status: "pending",
    clearCart: false,
    message: "We wachten nog op de bevestiging van je betaling. Probeer het over een moment opnieuw.",
  };
};
