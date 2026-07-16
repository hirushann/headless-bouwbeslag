export interface AppliedCoupon {
  code: string;
  amount: string | number;
  discount_type: "percent" | "fixed_cart" | string;
  [key: string]: any;
}

export const calculateCouponDiscount = (
  subtotalExVat: number,
  coupon: AppliedCoupon | null,
  vatRate = 0.21,
) => {
  if (!coupon) return 0;
  const amount = Number(coupon.amount) || 0;
  if (coupon.discount_type === "percent") {
    return (subtotalExVat * amount) / 100;
  }
  if (coupon.discount_type === "fixed_cart") {
    return amount / (1 + vatRate);
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
  const round = (value: number) => Math.round((value + 1e-9) * 100) / 100;
  const netTotal = Math.max(subtotalExVat - discountExVat + shippingExVat + feesExVat, 0);
  const tax = round(netTotal * vatRate);
  return { netTotal: round(netTotal), tax, grossTotal: round(netTotal + tax) };
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
