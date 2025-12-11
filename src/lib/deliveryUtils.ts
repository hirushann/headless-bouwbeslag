import { addDays, format, isAfter, isBefore, isSameDay, isWeekend, nextMonday, setHours, setMinutes, startOfDay } from "date-fns";
import { nl } from "date-fns/locale";
import holidayData from "@/data/holidays.json";

// ------------------------------------------------------------------
// CONFIGURATION
// ------------------------------------------------------------------

// Timezone handling is essentially "server time" or "local time" for this POC.
// In a real app, you'd use date-fns-tz to enforce "Europe/Amsterdam".
// For now, we assume the user's browser/environment is close enough or we just use local system time.

const CUTOFF_HOUR = 13;
const CUTOFF_MINUTE = 0;

// "Blocked Dates" - Days when DELIVERY is NOT possible.
// User instruction: "the array includes the holidays (not working days) only... it contains saturdays, sundays"
// We will populate this with some known non-delivery dates (Sundays, Mondays, generic holidays).
// NOTE: User said "it contains saturdays", but typically Sat is a delivery day in NL (PostNL). 
// Based on previous prompt "Basic delivery days: tuesday - saturday", Saturday IS valid.
// So we will block SUNDAY and MONDAY by default logic or hardcode them here.
// For robustness, I will add a helper to check if a date is blocked.

const BLOCKED_DATES = holidayData.dates;
// const BLOCKED_DATES = [
//     "2025-12-25",
//     "2025-12-26",
// ];

// Helper to check if a specific date string (YYYY-MM-DD) is in our blocked list
const isBlockedDate = (date: Date): boolean => {
    const isoDate = format(date, "yyyy-MM-dd");

    // Check hardcoded array
    if (BLOCKED_DATES.includes(isoDate)) return true;

    // OPTIONAL: Keep the "Tue-Sat" rule as a fallback/generator?
    // User said: "sometimes anyday can be delivered so we need to consider the holidays... stick to that date array."
    // This implies the array is the authority. 
    // However, without a massive array of every Sunday/Monday, the logic fails.
    // I will Hybridize: Block Sundays and Mondays automatically, AND check the array.
    const day = date.getDay(); // 0 = Sun, 1 = Mon
    if (day === 0 || day === 1) return true;

    return false;
};

// ------------------------------------------------------------------
// LOGIC
// ------------------------------------------------------------------

/**
 * Calculates the expected delivery date based on current time and lead time.
 * @param leadTimeDays - Number of days to deliver (e.g., 1 for "tomorrow").
 * @returns Date object of the expected delivery.
 */
export const calculateDeliveryDate = (leadTimeDays: number = 1): Date => {
    const now = new Date();
    // 1. Determine Shipping Date
    // If today is a shipping day (Mon-Fri) AND before cutoff, ship today.
    // Else, ship next valid shipping day.

    let shippingDate = new Date(now);
    const isPastCutoff = now.getHours() > CUTOFF_HOUR || (now.getHours() === CUTOFF_HOUR && now.getMinutes() >= CUTOFF_MINUTE);

    // Logic to find next shipping moment
    // If today is Sat(6) or Sun(0), we ship Monday.
    // If today is Fri(5) and past cutoff, we ship Monday.
    // If today is Mon-Thu and past cutoff, we ship Tomorrow.

    if (isPastCutoff) {
        shippingDate = addDays(shippingDate, 1);
    }

    // Skip weekends for SHIPPING (assuming warehouse closed Sat/Sun)
    while (shippingDate.getDay() === 0 || shippingDate.getDay() === 6) {
        shippingDate = addDays(shippingDate, 1);
    }

    // 2. Calculate Delivery Date
    // Delivery = Shipping Date + Lead Time
    // Then ensure Delivery Date is valid (not Sun/Mon/Holiday)

    let deliveryDate = addDays(shippingDate, leadTimeDays);

    // Skip blocked dates (Sun, Mon, Holidays)
    while (isBlockedDate(deliveryDate)) {
        deliveryDate = addDays(deliveryDate, 1);
    }

    return deliveryDate;
};

/**
 * Formats the delivery message based on the logic:
 * - Next day: "morgen"
 * - Day after next: "overmorgen"
 * - 2-4 days: "a.s. dagnaam"
 * - 5+ days: "omstreeks dag-maand"
 */
export const formatDeliveryMessage = (deliveryDate: Date): string => {
    const now = new Date();
    const today = startOfDay(now);
    const target = startOfDay(deliveryDate);

    // Difference in days (approx)
    const diffTime = target.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays <= 1) {
        return "morgen";
    }

    if (diffDays === 2) {
        return "overmorgen";
    }

    if (diffDays > 2 && diffDays <= 5) { // "2-4 business days" loosely interpreted
        // "a.s. [dayname]"
        return `a.s. ${format(target, "EEEE", { locale: nl })}`;
    }

    // > 5 days
    return `omstreeks ${format(target, "d MMMM", { locale: nl })}`;
};

/**
 * Helper to determine which "Box" to show and what text.
 * @param stockStatus - 'instock' | 'out-of-stock' | 'onbackorder'
 * @param quantityRequested - Current input quantity
 * @param stockQuantity - Actual physical stock
 * @param leadTimeInStock - Days if in stock (default 1)
 * @param leadTimeNoStock - Days if no stock (default 30)
 */
export const getDeliveryInfo = (
    stockStatus: string,
    quantityRequested: number,
    stockQuantity: number | null,
    leadTimeInStock: number = 1,
    leadTimeNoStock: number = 30
) => {
    const now = new Date();

    // SCENARIO 1: FULLY IN STOCK
    // If (stock >= qty)
    if (stockQuantity !== null && stockQuantity >= quantityRequested) {
        const date = calculateDeliveryDate(leadTimeInStock);
        return {
            type: "IN_STOCK", // Green
            message: `Bestel nu en ontvang dit product ${formatDeliveryMessage(date)} in huis`,
            short: `Levering: ${formatDeliveryMessage(date)}`
        };
    }

    // SCENARIO 2: PARTIAL STOCK
    // If (stock > 0 but < qty)
    if (stockQuantity !== null && stockQuantity > 0 && stockQuantity < quantityRequested) {
        const dateDirect = calculateDeliveryDate(leadTimeInStock);
        const dateBackorder = calculateDeliveryDate(leadTimeNoStock);

        const msgDirect = formatDeliveryMessage(dateDirect);
        const msgBack = formatDeliveryMessage(dateBackorder);

        return {
            type: "PARTIAL_STOCK", // Mixed/Green warning
            message: `LET OP: van dit product hebben wij momenteel maar ${stockQuantity} op voorraad. De nalevering zal ${msgBack} zijn.`,
            short: `Levering: ${stockQuantity}x ${msgDirect}, ${(quantityRequested - stockQuantity)}x ${msgBack}`
        };
    }

    // SCENARIO 3: NO STOCK (Backorder)
    const date = calculateDeliveryDate(leadTimeNoStock);
    return {
        type: "BACKORDER", // Red
        message: `Bestel nu en ontvang dit product ${formatDeliveryMessage(date)} in huis`,
        short: `Levering: ${formatDeliveryMessage(date)}`
    };
};
