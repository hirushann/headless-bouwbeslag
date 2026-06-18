# Empire Custom Checkout API

This API lets a NextJS storefront create Empire orders without going through WooCommerce. The order placement endpoints accept clean checkout JSON, then Empire maps that payload into the same internal order process currently used by the WooCommerce webhook.

All endpoints return JSON. Authenticated endpoints require:

```http
Authorization: Bearer {access_token}
Accept: application/json
Content-Type: application/json
```

## Register

`POST /api/register`

Creates a user and returns a Sanctum token.

```json
{
  "name": "Jane Customer",
  "email": "jane@example.com",
  "password": "password",
  "password_confirmation": "password"
}
```

Successful response:

```json
{
  "message": "Account created successfully.",
  "user": {
    "id": 1,
    "name": "Jane Customer",
    "email": "jane@example.com"
  },
  "access_token": "1|plain-text-token",
  "token_type": "Bearer"
}
```

## Login

`POST /api/login`

```json
{
  "email": "jane@example.com",
  "password": "password",
  "device_name": "nextjs-storefront"
}
```

Successful response:

```json
{
  "message": "Login successful.",
  "user": {
    "id": 1,
    "name": "Jane Customer",
    "email": "jane@example.com"
  },
  "access_token": "1|plain-text-token",
  "token_type": "Bearer"
}
```

## Logout

`POST /api/logout`

Requires authentication. Deletes the current token.

```json
{
  "message": "Logout successful."
}
```

## Profile

`GET /api/profile`

Requires authentication.

Response:

```json
{
  "data": {
    "id": 1,
    "name": "Jane Customer",
    "email": "jane@example.com"
  }
}
```

`PUT /api/profile`

Requires authentication.

```json
{
  "name": "Jane Updated",
  "email": "jane.updated@example.com"
}
```

## Update Password

`PUT /api/profile/password`

Requires authentication.

```json
{
  "current_password": "password",
  "password": "new-password",
  "password_confirmation": "new-password"
}
```

## Customer Address

`GET /api/customer/address`

Requires authentication. Returns the customer billing data and saved shipping details for the logged-in user.

`PUT /api/customer/address`

Requires authentication. Stores billing data in the existing `customers` table and shipping data in `customers.shipping_details`.

```json
{
  "billing": {
    "email": "jane@example.com",
    "first_name": "Jane",
    "last_name": "Customer",
    "company": "Jane BV",
    "address_1": "Main Street",
    "address_2": "",
    "house_number": "12A",
    "city": "Amsterdam",
    "state": "",
    "postcode": "1000 AA",
    "country": "NL",
    "phone": "0612345678"
  },
  "shipping": {
    "first_name": "Jane",
    "last_name": "Customer",
    "company": "Jane BV",
    "address_1": "Warehouse Street",
    "address_2": "",
    "house_number": "5",
    "city": "Utrecht",
    "state": "",
    "postcode": "3500 AA",
    "country": "NL",
    "phone": "0612345678"
  }
}
```

## Guest Order Placement

`POST /api/guest/orders`

Use this when the customer checks out without logging in.

Send this after checkout is completed or after your frontend has enough confirmed checkout data to create the Empire order. Empire does not process payment in this endpoint; it records the order and triggers the same internal order logic used by the WooCommerce webhook.

```json
{
  "website_url": "https://app.bouwbeslag.nl",
  "order_reference": "NEXT-100001",
  "status": "processing",
  "billing": {
    "email": "guest@example.com",
    "first_name": "Guest",
    "last_name": "Customer",
    "company": "",
    "address_1": "Main Street",
    "address_2": "",
    "house_number": "12A",
    "city": "Amsterdam",
    "state": "",
    "postcode": "1000 AA",
    "country": "NL",
    "phone": "0612345678"
  },
  "shipping": {
    "first_name": "Guest",
    "last_name": "Customer",
    "company": "",
    "address_1": "Shipping Street",
    "address_2": "",
    "house_number": "5",
    "city": "Utrecht",
    "state": "",
    "postcode": "3500 AA",
    "country": "NL",
    "phone": "0612345678"
  },
  "items": [
    {
      "sync_id": "000100007",
      "sku": "000100007ABC",
      "name": "Blind rozet 50mm RVS Gepolijst",
      "quantity": 2,
      "price": 12.95,
      "manual_unit_price": 0
    }
  ],
  "shipping_total": 5.74,
  "total": 31.64,
  "total_tax": 5.49,
  "payment_method": "mollie_ideal",
  "payment_method_title": "iDEAL",
  "customer_note": "Leave at the front desk",
  "eu_vat_number": ""
}
```

Successful response:

```json
{
  "message": "Order received.",
  "data": {
    "id": 123,
    "order_reference": "NEXT-100001",
    "status": "processing",
    "from": "WP",
    "website": {
      "id": 1,
      "name": "bouwbeslag",
      "url": "https://app.bouwbeslag.nl"
    },
    "totals": {
      "net_total": "26.15",
      "net_total_with_tax": "31.64"
    },
    "customer": {
      "id": 45,
      "email": "guest@example.com",
      "first_name": "Guest",
      "last_name": "Customer",
      "company": ""
    },
    "items": [
      {
        "product_id": 10,
        "name": "Blind rozet 50mm RVS Gepolijst",
        "sku": "000100007",
        "quantity": 2,
        "supplier_name": "Supplier Name"
      }
    ],
    "created_at": "2026-06-17T10:30:00+00:00"
  }
}
```

## Authenticated Order Placement

`POST /api/account/orders`

Requires authentication. Payload is the same as guest order placement. If `billing.email` is omitted, Empire uses the authenticated user's email.

```json
{
  "website_url": "https://app.bouwbeslag.nl",
  "order_reference": "NEXT-100002",
  "status": "processing",
  "billing": {
    "first_name": "Jane",
    "last_name": "Customer",
    "address_1": "Main Street",
    "house_number": "12A",
    "city": "Amsterdam",
    "postcode": "1000 AA",
    "country": "NL",
    "phone": "0612345678"
  },
  "shipping": {
    "first_name": "Jane",
    "last_name": "Customer",
    "address_1": "Shipping Street",
    "house_number": "5",
    "city": "Utrecht",
    "postcode": "3500 AA",
    "country": "NL"
  },
  "items": [
    {
      "sync_id": "000100007",
      "name": "Blind rozet 50mm RVS Gepolijst",
      "quantity": 1,
      "price": 12.95
    }
  ],
  "shipping_total": 5.74,
  "total": 18.69,
  "total_tax": 3.24
}
```

## Account Orders

`GET /api/account/orders`

Requires authentication. Returns orders linked to the authenticated customer's `user_id` or email.

`GET /api/account/orders/{orderReference}`

Requires authentication.

Example:

```http
GET /api/account/orders/NEXT-100002
```

## Guest Order Lookup

`GET /api/guest/orders/{orderReference}?email={customerEmail}`

Requires the billing email used for the guest order.

Example:

```http
GET /api/guest/orders/NEXT-100001?email=guest@example.com
```

If the email does not match the order's customer, Empire returns `404`.

## Checkout Field Notes

`website_url` must match a configured Empire website as closely as possible. Empire normalizes `www.` and trailing slashes.

`order_reference` should be a unique ID from NextJS, your payment provider, or your checkout system. If omitted, Empire generates an `API-...` reference.

`status` defaults to `processing`. Supported values are:

- `pending`
- `processing`
- `on-hold`
- `completed`
- `cancelled`
- `refunded`
- `failed`

Each item must include either `sync_id` or `sku`. Empire uses these identifiers to find products through the existing order process.

Recommended item payload:

```json
{
  "sync_id": "000100007",
  "sku": "000100007ABC",
  "name": "Blind rozet 50mm RVS Gepolijst",
  "quantity": 2,
  "price": 12.95,
  "manual_unit_price": 0
}
```

For NextJS, the important rule is: send the Empire product sync identifier in `sync_id` whenever possible. That is the primary value Empire uses to match products and set products.

## Validation Errors

Validation failures return HTTP `422`.

Example:

```json
{
  "message": "The website url field must be a valid URL. (and 2 more errors)",
  "errors": {
    "website_url": [
      "The website url field must be a valid URL."
    ],
    "billing.email": [
      "The billing.email field must be a valid email address."
    ],
    "items": [
      "The items field is required."
    ]
  }
}
```

