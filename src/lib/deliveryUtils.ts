import { addDays, format, isAfter, isBefore, isSameDay, nextMonday, setHours, setMinutes, startOfDay } from "date-fns";
import { nl } from "date-fns/locale";
import holidayData from "@/data/holidays.json";
import { useHolidayStore } from "@/lib/holidayStore";

// ------------------------------------------------------------------
// CONFIGURATION
// ------------------------------------------------------------------

const CUTOFF_HOUR = 13;
const CUTOFF_MINUTE = 0;

const parsedHolidayData = holidayData as { shipping?: string[]; delivery?: string[]; dates?: string[] };

export type CustomHolidays = { shipping: string[], delivery: string[] };

// Helper to get the current holidays from either the passed args, the global store, or the static fallback
const getActiveHolidays = (customHolidays?: CustomHolidays) => {
    if (customHolidays) return customHolidays;
    
    // Check global store (for client side dynamically fetched holidays)
    const storeState = useHolidayStore.getState();
    if (storeState.shipping.length > 0 || storeState.delivery.length > 0) {
        return {
            shipping: storeState.shipping,
            delivery: storeState.delivery
        };
    }

    // Fallback to static JSON
    return {
        shipping: parsedHolidayData.shipping || parsedHolidayData.dates || [],
        delivery: parsedHolidayData.delivery || parsedHolidayData.dates || []
    };
};

const isBlockedDeliveryDate = (date: Date, customHolidays?: CustomHolidays): boolean => {
    const isoDate = format(date, "yyyy-MM-dd");
    const { delivery } = getActiveHolidays(customHolidays);

    if (delivery.includes(isoDate)) return true;

    const day = date.getDay(); // 0 = Sun, 1 = Mon
    if (day === 0 || day === 1) return true;

    return false;
};

const isBlockedShippingDate = (date: Date, customHolidays?: CustomHolidays): boolean => {
    const isoDate = format(date, "yyyy-MM-dd");
    const { shipping } = getActiveHolidays(customHolidays);

    if (shipping.includes(isoDate)) return true;

    const day = date.getDay(); // 0 = Sun, 6 = Sat
    if (day === 0 || day === 6) return true;

    return false;
};

// ------------------------------------------------------------------
// LOGIC
// ------------------------------------------------------------------

export const calculateDeliveryDate = (leadTimeDays: number = 1, customHolidays?: CustomHolidays): Date => {
    const now = new Date();

    let shippingDate = new Date(now);
    const isPastCutoff = now.getHours() > CUTOFF_HOUR || (now.getHours() === CUTOFF_HOUR && now.getMinutes() >= CUTOFF_MINUTE);

    if (isPastCutoff) {
        shippingDate = addDays(shippingDate, 1);
    }

    let safety = 0;
    while (isBlockedShippingDate(shippingDate, customHolidays) && safety < 30) {
        shippingDate = addDays(shippingDate, 1);
        safety++;
    }

    let deliveryDate = new Date(shippingDate);
    let daysAdded = 0;
    while (daysAdded < leadTimeDays) {
        deliveryDate = addDays(deliveryDate, 1);
        if (!isBlockedDeliveryDate(deliveryDate, customHolidays)) {
            daysAdded++;
        }
    }

    safety = 0;
    while (isBlockedDeliveryDate(deliveryDate, customHolidays) && safety < 365) {
        deliveryDate = addDays(deliveryDate, 1);
        safety++;
    }

    return deliveryDate;
};

export const formatDeliveryMessage = (deliveryDate: Date): string => {
    const now = new Date();
    const today = startOfDay(now);
    const target = startOfDay(deliveryDate);

    const diffTime = target.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays <= 1) {
        return "morgen";
    }

    if (diffDays === 2) {
        return "overmorgen";
    }

    if (diffDays > 2 && diffDays <= 5) { 
        return `a.s. ${format(target, "EEEE", { locale: nl })}`;
    }

    return `omstreeks ${format(target, "d MMMM", { locale: nl })}`;
};

export const getDeliveryInfo = (
    stockStatus: string,
    quantityRequested: number,
    stockQuantity: number | null,
    leadTimeInStock: number = 1,
    leadTimeNoStock: number = 30,
    customHolidays?: CustomHolidays
) => {
    const now = new Date();

    if ((stockQuantity !== null && stockQuantity >= quantityRequested) || (stockQuantity === null && stockStatus === "instock")) {
        const date = calculateDeliveryDate(leadTimeInStock, customHolidays);
        const diffTime = startOfDay(date).getTime() - startOfDay(now).getTime();
        const days = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return {
            type: "IN_STOCK", 
            message: `Bestel nu en ontvang dit product ${formatDeliveryMessage(date)} in huis`,
            short: `Levering: ${formatDeliveryMessage(date)}`,
            days
        };
    }

    if (stockQuantity !== null && stockQuantity > 0 && stockQuantity < quantityRequested) {
        const dateDirect = calculateDeliveryDate(leadTimeInStock, customHolidays);
        const dateBackorder = calculateDeliveryDate(leadTimeNoStock, customHolidays);

        const msgDirect = formatDeliveryMessage(dateDirect);
        const msgBack = formatDeliveryMessage(dateBackorder);

        const diffTime = startOfDay(dateBackorder).getTime() - startOfDay(now).getTime();
        const days = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        return {
            type: "PARTIAL_STOCK",
            message: `LET OP: van dit product hebben wij momenteel maar ${stockQuantity} op voorraad voor levering ${msgDirect}. De resterende ${(quantityRequested - stockQuantity)} stuks worden ${msgBack} verzonden.`,
            short: `Levering: ${stockQuantity}x ${msgDirect}, ${(quantityRequested - stockQuantity)}x ${msgBack}`,
            days
        };
    }

    const date = calculateDeliveryDate(leadTimeNoStock, customHolidays);
    const diffTime = startOfDay(date).getTime() - startOfDay(now).getTime();
    const days = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    return {
        type: "BACKORDER", 
        message: `Bestel nu en ontvang dit product ${formatDeliveryMessage(date)} in huis`,
        short: `Levering: ${formatDeliveryMessage(date)}`,
        days
    };
};
