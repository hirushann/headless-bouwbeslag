# Artifacts

Generated or captured files that are useful for debugging but should not live in the repository root.

## Layout

- `debug/`: debug logs and captured error HTML.
- `fixtures/`: captured JSON/data fixtures used by diagnostic scripts.
- `reports/`: Lighthouse/PageSpeed and similar reports.

Do not put secrets, customer data, order data, or live credentials in this folder.
