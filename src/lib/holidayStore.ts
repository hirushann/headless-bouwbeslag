import { create } from 'zustand';

type HolidayState = {
    shipping: string[];
    delivery: string[];
    fetchHolidays: () => Promise<void>;
};

export const useHolidayStore = create<HolidayState>((set) => ({
    shipping: [],
    delivery: [],
    fetchHolidays: async () => {
        try {
            // Fetch dynamically from our API route to get the latest file content
            const res = await fetch('/api/webhooks/holidays');
            if (res.ok) {
                const data = await res.json();
                set({ 
                    shipping: data.shipping || data.dates || [], 
                    delivery: data.delivery || data.dates || [] 
                });
            }
        } catch (e) {
            console.error("Failed to fetch dynamic holidays:", e);
        }
    }
}));
