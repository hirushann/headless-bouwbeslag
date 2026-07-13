# Tests And Diagnostics

This folder contains ad hoc diagnostic scripts that used to live in the repository root.

They are not a formal automated test suite. Inspect a script before running it because some scripts call external services such as WooCommerce, Meilisearch, Mollie, SMTP, or browser automation.

## Layout

- `diagnostics/`: targeted investigation scripts for search, filters, categories, prices, browser checks, email, and payments.

Run scripts from the repository root unless the script says otherwise, so relative fixture paths keep working.
