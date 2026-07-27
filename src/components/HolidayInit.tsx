'use client';

import { useEffect } from 'react';
import { useHolidayStore } from '@/lib/holidayStore';

export function HolidayInit() {
    const fetchHolidays = useHolidayStore(state => state.fetchHolidays);
    
    useEffect(() => {
        fetchHolidays();
    }, [fetchHolidays]);
    
    return null;
}
