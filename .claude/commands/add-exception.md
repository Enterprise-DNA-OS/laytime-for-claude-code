---
description: Add a non-overlapping time exclusion supported by the actual charter clause
---
# Add Exception

Add a non-overlapping time exclusion supported by the actual charter clause. on-demurrage is false unless that clause expressly excludes the period on demurrage. Every addition invalidates review.

```bash
node scripts/laytime.mjs add-exception --port=<port> --from=<timestamp> --to=<timestamp> --reason="<reason>" --clause-ref="<clause>" --on-demurrage=false --actor="<operator>"
```

Replace angle-bracket values with verified records. Quote names and evidence references. Timestamps use whole minutes and an explicit timezone, for example 2026-11-12T17:00:00+13:00. Add --json for structured output. A unique code, ID prefix or case-insensitive name identifies a record. If ambiguous, list candidates and let the operator identify the record. Never invent a value. Read the result and present the material finding. Never send or publish.
