# State Synchronization Audit (Baseline)

Date: 2026-07-16

This document records the application state and caching flow before the synchronization fixes.

## Current sources of truth

### Authentication and account

- `UserProvider` owns in-memory `user`, `userRole`, and `isB2B` state.
- The login page and both logout controls bypass that provider and mutate `localStorage` directly.
- `UserProvider` reads `localStorage` only once on mount. A same-tab `localStorage` write does not emit a `storage` event, so login/logout cannot notify the mounted provider.
- `Header` maintains a second authentication state (`isLoggedIn`) by reading the token independently.
- `AccountClient` maintains a third copy of the customer object and initializes forms only when they are null.
- `/api/user/me` combines the Empire profile and address responses; orders use `/api/user/orders`.

Data flow before the fix:

`login API -> LoginClient localStorage -> router.push -> stale mounted UserProvider -> AccountClient skeleton`

`profile API -> AccountClient local state -> UserProvider refetch -> form state may retain its previous copy`

`logout click -> localStorage -> router.push -> stale UserProvider/Header customer state`

### Cart

- Zustand `useCartStore` is the application-wide cart source and is persisted to `cart-storage`.
- Header, drawer, cart, checkout, product cards, and checkout success subscribe to this store.
- Persistence has no explicit hydration status. Components use unrelated `isMounted` flags or render the empty cart before persisted data is available.
- Cart IDs are typed as numbers but are not normalized at the store boundary. Runtime data can still contain string IDs, causing strict-equality update/removal misses.
- Header and drawer duplicate cart mutation wrappers and sometimes call `getState()` instead of their subscribed actions.
- Stock refresh is tied only to drawer open state and item count; quantity/SKU changes can leave stock-derived UI stale.

Data flow before the fix:

`product mutation -> Zustand -> subscribed views -> async persistence`

`page load -> initial empty store -> component empty/loading UI -> persistence rehydration -> cart data`

### Checkout and coupons

- Checkout reads cart and consolidation from Zustand and keeps coupon/shipping/payment state locally.
- Coupon application updates totals locally after server validation; coupon removal is local and immediate.
- Coupon loading is reset after the awaited action but not in a `finally`, so a thrown server-action/network error can leave it stuck.
- Order placement similarly resets loading only after the awaited action and uses `alert` for failure; a thrown error can leave a permanent loading state.
- Shipping/payment bootstrap requests have no explicit loading/error state.

### Reviews and other mutations

- Reviews are fetched by two overlapping effects, producing duplicate requests and races.
- An empty `initialReviews` array does not complete the initial loading state because it is tested by truthiness.
- B2B registration is an approval request, not an authenticated consumer registration. Its existing contract intentionally redirects to login and must not create a session for a pending account.
- No wishlist feature/store/API exists in this repository, so there is no wishlist mutation flow to synchronize.
- No React Query or SWR dependency or query cache is present. The relevant cache layers are Zustand persistence, component state, Next.js server data cache, and the App Router cache.

## Root causes

1. Authentication mutations bypass the context that renders the UI.
2. Multiple independent auth/customer copies drift apart.
3. Persisted cart hydration is not modeled as state.
4. Cart identifiers are trusted at compile time but not normalized at runtime.
5. Several async handlers do not guarantee loading cleanup in `finally`.
6. Duplicate effects and incomplete error states create races, stale content, or permanent skeletons.
7. `router.push()` is being asked to compensate for stale client state; `router.refresh()` would not fix local provider state and is not the correct primary mechanism here.

## Target architecture

- `UserProvider` is the single client source of truth for authentication and customer data. It owns session persistence, login establishment, profile refresh/update, cross-tab synchronization, and logout.
- Zustand remains the single cart source of truth, with normalized mutations and an explicit persistence hydration flag.
- Mutations update their owning source immediately, then reconcile with the backend where applicable.
- Client-owned state does not use `router.refresh()`. Server route handlers opt out of caching for customer-specific responses.
- Every async mutation has explicit loading, success, empty, and error outcomes and guaranteed cleanup.

## Implemented decision

- Authentication remains in a React provider because it already wraps the application and is sufficient for a low-frequency session resource. Zustand would not fix direct storage mutations or bearer-token exposure by itself.
- Cart remains in Zustand because it is high-frequency shared client state. Its pure transitions are now separately testable.
- Customer-specific route handlers are forced dynamic; client-owned state is updated directly without `router.refresh()`.
- The recommended follow-up is a Next.js backend-for-frontend session: exchange the Empire token in a route handler, store it in a secure `httpOnly` cookie, resolve the initial customer on the server, and proxy authenticated Empire mutations. This is intentionally not mixed into the compatibility-focused synchronization change because it changes the authentication transport and deployment contract.

## Flow coverage notes

- Login: the provider is updated before navigation and reconciles `/api/user/me` before the login mutation finishes.
- Logout: customer state and persisted session are cleared synchronously; backend revocation is best-effort.
- Registration: the only registration UI is B2B approval registration. Pending users intentionally do not receive a session and are sent to login after approval guidance.
- Profile/address: provider and form projections update immediately, then reconcile with the profile endpoint.
- Cart add/remove/quantity/clear: all consumers subscribe to one normalized store; persisted string IDs no longer miss mutations.
- Coupon apply/remove: totals update from local checkout state; failures clear any previously applied coupon and loading always ends.
- Checkout success: cart clears only after a verified successful order state.
- Wishlist: no wishlist implementation exists in the repository.
- Search/category/brand/reviews: duplicate or stale requests and empty-response loading traps were corrected.

## Project-root cleanup

- Root `test-*` diagnostics moved to `tests/diagnostics/legacy/`.
- Root `fix-*` one-off source-rewrite scripts moved to `scripts/maintenance/legacy/`.
- The stray source diagnostic moved from `src/test-cache.ts` to the legacy diagnostics folder.
- Generated logs moved to `artifacts/debug/` or removed.
- Hard-coded Meilisearch credential fallbacks were removed from legacy diagnostics. The mutation-capable search-index script remains clearly isolated and must not be run casually.
