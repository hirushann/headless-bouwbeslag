# Customer API guide

Audited against the Next.js storefront and Empire Laravel code on 2026-07-16. The storefront base URL is `NEXT_PUBLIC_EMPIRE_API_URL` for browser-safe public calls and `EMPIRE_BACKEND_API_URL` for server-only calls. JSON validation failures use Laravel's standard HTTP 422 shape: `{ "message": "...", "errors": { "field": ["..."] } }`.

## Authentication and account

| Method and route | Auth | Storefront caller | Empire handler | Result and side effects |
|---|---|---|---|---|
| `POST /api/register` | Public, throttle 10/min | No current consumer UI | `AuthController::register` | 201; creates `users` and matching `customers`, then creates a Sanctum token. |
| `POST /api/register-b2b` | Public, throttle 10/min | `B2BSignupForm` through `/api/register-b2b` | `AuthController::registerB2b` | 201; creates pending user/customer, queues admin and customer emails, and currently also returns a token. The storefront intentionally does not establish a pending session. |
| `POST /api/login` | Public, throttle 10/min | `src/lib/auth.ts`, `LoginClient` | `AuthController::login` | 200; validates email/password and creates a Sanctum token. |
| `POST /api/logout` | Bearer | `UserProvider.signOut` via `src/lib/auth.ts` | `AuthController::logout` | 200; deletes current token. The client clears its local source of truth first. |
| `POST /api/reset/password` | Public, throttle 6/min | `/api/reset-password` from `LoginClient` | `AuthController::forgotPassword` | 200; dispatches `CustomerResetPasswordNotification`. Unknown addresses receive the same generic storefront response. |
| `POST /api/reset/password/confirm` | Public, throttle 6/min | `/api/reset-password/confirm` | `AuthController::resetPassword` | 200; hashes the new password, rotates remember token, emits Laravel `PasswordReset`; invalid/expired tokens return 422. |
| `GET /api/profile` | Bearer | `/api/user/me` | `ProfileController::show` | 200 `{data: profile}`. |
| `PUT /api/profile` | Bearer | `AccountClient` | `ProfileController::update` | 200; updates user and customer records; changing email clears email verification. |
| `PUT /api/profile/password` | Bearer | `AccountClient` | `ProfileController::updatePassword` | 200; validates current/new password through `UpdatePasswordRequest`, then updates hash. |
| `GET /api/customer/address` | Bearer | `/api/user/me` | `CustomerAddressController::show` | 200 `{data: {billing,shipping}}` or `{data:null}`. |
| `PUT /api/customer/address` | Bearer | `AccountClient` | `CustomerAddressController::update` | 200; upserts customer billing fields and `shipping_details`. |
| `GET /api/account/orders` | Bearer | `/api/user/orders` | `OrderController::indexAccount` | 200 `{data:[...]}` for orders linked by user/email. |
| `GET /api/account/orders/{reference}` | Bearer | Not currently called directly | `OrderController::showAccount` | 200 `{data: order}` or authorization/not-found response. |

Login request and response:

```json
{"email":"customer@example.com","password":"secret","device_name":"nextjs-storefront"}
```

```json
{"message":"Login successful.","user":{"id":1,"name":"Customer","email":"customer@example.com","roles":[],"b2b_status":null},"access_token":"<token>","token_type":"Bearer"}
```

Profile update accepts `name`, `first_name`, `last_name`, `company_name`, `vat_number`, and `email` subject to `UpdateProfileRequest`. Address updates use:

```json
{"billing":{"email":"customer@example.com","first_name":"Ada","last_name":"Lovelace","address_1":"Main Street","house_number":"1","city":"Amsterdam","postcode":"1000AA","country":"NL","phone":""},"shipping":{"first_name":"Ada","last_name":"Lovelace","address_1":"Main Street","house_number":"1","city":"Amsterdam","postcode":"1000AA","country":"NL"}}
```

## Catalog, stock, shipping, coupons, and reviews

| Method and route | Auth | Storefront caller | Empire handler | Response / notes |
|---|---|---|---|---|
| `GET /api/categories[/{slug}]` | Public | Catalog/category server actions | `CategoryController` | Category collection/detail. Catalog products themselves are primarily read from Meilisearch, not this API. |
| `GET /api/brands[/{slug}]` | Public | Brand pages/actions | `BrandController` | Brand collection/detail. |
| `GET /api/products/{sku}/stock` | Public | `checkStockAction` | `ProductStockController::show` | Stock object for one SKU. |
| `POST /api/products/batch-stock` | Public | `refreshCartStockAction` | `ProductStockController::batch` | Request is `{ "skus": ["SKU1"] }`; response is keyed by SKU and includes `found`, `total_stock`, and delivery fields. |
| `GET /api/shipping/settings` | Public | `getShippingRatesAction` | `OrderController::getShippingSettings` | Configured method array. |
| `GET /api/shipping-rules/active` | Public | `getShippingRulesAction` | `ShippingRuleController::active` | `{data:[country rules]}`. |
| `GET /api/coupons/code/{code}` | Public | `validateCouponAction`, order recalculation | `CouponController::getByCode` | Coupon resource or 404. Storefront additionally checks expiry, usage, spend, email, include/exclude product rules. |
| `GET /api/products/{id}/reviews` | Public | `/api/products/{id}/reviews`, `ReviewsSection` | `ReviewController::index` | Paginated/list review response. |
| `POST /api/products/{id}/reviews` | Public | `/api/products/{id}/reviews` | `ReviewController::store` | Validates and creates review. This endpoint currently has no customer authentication requirement. |
| `GET /api/blogs[/{slug}]` | Public | Blog actions/pages | `BlogController` | Blog list/detail. |

Batch stock success example:

```json
{"ZZPA090M":{"found":true,"total_stock":0,"delivery_if_stock":null,"delivery_if_no_stock":"30"}}
```

The previous storefront sent `{items:[...]}` and expected an array. It now sends the actual `{skus:[...]}` contract and maps the keyed response back onto stable cart IDs.

## Checkout and orders

| Method and route | Auth | Storefront caller | Empire handler | Result and side effects |
|---|---|---|---|---|
| `POST /api/guest/orders` | Public | `placeOrderAction` | `OrderController::storeGuest` | 201 `{message,data}`; creates an Empire order through `ApiCheckoutOrderService`/`OrderService`. |
| `GET /api/guest/orders/{reference}?email=...` | Public + matching email | No direct current caller | `OrderController::showGuest` | 200 order or not-found. |
| `PATCH /api/guest/orders/{reference}/status` | Public + matching email in body | Mollie webhook/status action | `OrderController::updateGuestStatus` | Updates status. Body: `{status,email}`. |
| `POST /api/account/orders` | Bearer | `placeOrderAction` | `OrderController::storeAccount` | 201; creates order linked to authenticated user. |
| `PATCH /api/account/orders/{reference}/status` | Bearer | Mollie webhook/status action | `OrderController::updateAccountStatus` | Updates status. Body: `{status}`. |

Required order validation is defined by `StoreCheckoutOrderRequest`:

- `website_url`: required URL, max 255.
- `billing`: required; `billing.email` required and valid. Other address fields are nullable in Empire even though the storefront requires first/last name, street, number, postcode, city, and country.
- `items`: required array, at least one. Every item needs `sync_id` or `sku`, a name, numeric quantity >= 0.01, and non-negative price fields.
- `status`: one of `pending`, `processing`, `on-hold`, `completed`, `cancelled`, `refunded`, `failed`.
- `total`: required, numeric, non-negative. Shipping, tax, discount, and item price fields are optional non-negative numerics; fee totals may be negative for the consolidation discount.

Actual storefront payload (abridged):

```json
{
  "website_url":"https://bouwbeslag.nl",
  "status":"pending",
  "billing":{"email":"guest@example.com","first_name":"Guest","last_name":"Customer","address_1":"Main Street","house_number":"1","city":"Amsterdam","postcode":"1000AA","country":"NL"},
  "shipping":{"first_name":"Guest","last_name":"Customer","address_1":"Main Street","house_number":"1","city":"Amsterdam","postcode":"1000AA","country":"NL"},
  "items":[{"sync_id":"ZZPA090M","sku":"ZZPA090M","name":"Product","quantity":1,"price":36.65,"price_ex_tax":30.29,"price_tax":6.36,"manual_unit_price":36.65}],
  "subtotal_ex_tax":30.29,
  "shipping_total":18.15,
  "shipping_total_ex_tax":15,
  "shipping_tax":3.15,
  "prices_include_tax":true,
  "total":54.80,
  "total_tax":9.51,
  "payment_method":"ideal",
  "payment_method_title":"Mollie",
  "coupon_lines":[],
  "fee_lines":[]
}
```

Order success is HTTP 201:

```json
{"message":"Order received.","data":{"id":123,"order_reference":"BW-123","status":"pending","website":{"id":1,"name":"bouwbeslag","url":"https://bouwbeslag.nl"},"totals":{"net_total":"45.29","net_total_with_tax":"54.80"},"customer":{"email":"guest@example.com"},"items":[],"created_at":"2026-07-16T12:00:00+00:00"}}
```

### Payment lifecycle

`placeOrderAction` calculates totals server-side, creates an Empire order as `pending`, stores a checkout verification session, then creates a Mollie payment. `/api/webhooks/mollie` re-fetches the payment from Mollie and changes the Empire order to `processing` only for `paid`, or `failed` for terminal payment failures. Checkout success independently verifies the Mollie payment and clears the cart only after a confirmed successful state. Local QA must use Mollie test credentials; no real payment was submitted during this audit.

Order side effects originate in Empire's existing `OrderService` pipeline. The API controller records the order and logs the placement. Downstream stock, invoice, email, and queue behavior is inherited from that service; the storefront itself does not generate invoices or decrement inventory.

## Next.js backend-for-frontend routes

- `GET /api/user/me`: forced dynamic/no-store; combines Empire profile and customer address for `UserProvider`.
- `GET /api/user/orders`: forced dynamic/no-store; proxies authenticated order history.
- `POST /api/reset-password` and `/api/reset-password/confirm`: proxy password flows without exposing the Empire base URL.
- `GET|POST /api/products/{id}/reviews`: review proxy.
- `POST /api/webhooks/mollie`: verifies Mollie status before changing Empire order status.
- `/api/meili-products`, `/api/category-filters`, and search server actions: catalog/search adapters.

Development-only debug routes that wrote arbitrary request JSON into the project root or exposed shipping integration data were removed during the audit.

## Confirmed inconsistencies and recommendations

1. **Critical — no order idempotency.** Empire generates the next `BW-` reference from the current maximum without a unique database constraint/transactional lock. The UI now blocks duplicate clicks, but retries across processes can still duplicate orders. Add an idempotency key column with a unique index and return the original result for repeated keys.
2. **Critical — stock is not enforced when placing an order.** `ApiCheckoutOrderService` verifies that the product exists and is synchronized, but does not reject quantities above available stock. The UI allows explicit backorders. Empire must define and enforce the actual backorder policy transactionally.
3. **High — payment is created after the Empire order.** A Mollie creation failure leaves a pending Empire order. Add a compensating failure/cancel update or create a checkout intent separate from a confirmed operational order.
4. **High — bearer tokens are browser-managed and copied into local checkout session files.** Move auth to a server-side BFF session using secure `httpOnly`, `sameSite` cookies, and store only a server-side opaque session identifier.
5. **High — B2B registration returns a usable token while status is pending.** The UI refuses to establish it, but Empire should enforce pending/denied policy in login and authenticated APIs.
6. **High — batch stock performs one query/service call per SKU.** Replace with a single indexed SKU query and batch stock aggregation.
7. **Medium — validation differs.** The storefront requires full addresses; Empire only requires billing email. Align shared rules so alternate clients cannot create incomplete orders.
8. **Medium — coupon validation is split.** The storefront validates rules and Empire accepts submitted totals. Revalidate coupon eligibility and recompute all totals inside Empire before persistence.
9. **Medium — public status mutation.** Guest status PATCH is protected only by order reference plus email. Restrict payment-status mutation to a signed/internal webhook credential.
10. **Low — language/shape consistency.** Some Empire errors and storefront success strings are English while the shop is Dutch. Standardize error codes and localize in the UI.

Deprecated behavior: legacy WooCommerce order-status handling in the storefront is disabled. Current order references are `BW-` (with temporary `NEXT-` compatibility in the payment verifier).
