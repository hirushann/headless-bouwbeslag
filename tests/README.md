# Tests And Diagnostics

`tests/state/` contains offline Node tests for authentication and cart state transitions. Run them with `npm run test:state`.

`tests/diagnostics/` contains ad hoc diagnostic scripts that are not part of the automated suite. Root-level legacy diagnostics were moved to `tests/diagnostics/legacy/`. Some call external services and `test-meili-push.js` mutates a search index.

Inspect a script before running it because some scripts call external services or browser automation.
Run scripts from the repository root unless the script says otherwise.
