# Dynamic Holidays Guide

This guide explains the Holiday Webhook system and how to fully integrate it.

## 1. Updating Holidays via Webhook

We have created an endpoint to update the list of "Blocked Dates" (holidays) stored in `src/data/holidays.json`.

**Endpoint:** `POST /api/webhooks/holidays`
**Content-Type:** `application/json`

**Payload Example:**
```json
{
  "shipping": [
    "2024-05-01",
    "2025-12-23"
  ],
  "delivery": [
    "2026-02-19"
  ]
}
```

**Curl Example:**
```bash
curl -X POST http://localhost:3000/api/webhooks/holidays \
  -H "Authorization: Bearer 2d93eb85ca303b730d46050b33e801f1" \
  -H "Content-Type: application/json" \
  -d '{ 
        "shipping": ["2024-05-01", "2025-12-23"],
        "delivery": ["2026-02-19"]
      }'
```

---

## 2. Making the App "Dynamic"

Currently, `src/lib/deliveryUtils.ts` uses a **hardcoded** list of blocked dates (as requested). To make it use the live data from `src/data/holidays.json` (or the API), follow these steps:

### Option A: Read JSON directly (Server Components / SSG)
If you are calling `deliveryUtils` from a Server Component, you can simply import the JSON file:

1.  **Open** `src/lib/deliveryUtils.ts`.
2.  **Import** the JSON:
    ```typescript
    import holidayData from "@/data/holidays.json";
    ```
3.  **Update** the `BLOCKED_DATES` constant:
    ```typescript
    const BLOCKED_DATES = holidayData.dates;
    ```

### Option B: Fetch from API (Client Components)
If the data updates frequently and you need the client to be fresh without rebuilding:

1.  Create a `useHolidays` hook or fetch logic in `ProductPageClient.tsx`.
2.  Fetch `/api/webhooks/holidays` (GET).
3.  Pass the array of dates into `getDeliveryInfo` / `calculateDeliveryDate` (you would need to update those function signatures to accept a `blockedDates` array argument instead of using the global constant).

**Recommended Approach (Simplest):**
Since `ProductPageClient` is a Client Component, but holidays don't change *that* often:
1.  Stick with **Option A** (import JSON).
2.  When the webhook updates the JSON file, the Next.js dev server (or a rebuild in prod) will pick up the changes.

