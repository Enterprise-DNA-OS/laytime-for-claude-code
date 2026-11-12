---
description: Prepare the Monday review from claim-round, attention and time-bars
---
# Weekly Review

Prepare the Monday review from claim-round, attention and time-bars. The command reads all three and writes a branded draft. Separate pending records from current calculations.

```bash
node scripts/laytime.mjs weekly-review
```

Replace angle-bracket values with verified records. Quote names and evidence references. Timestamps use whole minutes and an explicit timezone, for example 2026-11-12T17:00:00+13:00. Add --json for structured output. A unique code, ID prefix or case-insensitive name identifies a record. If ambiguous, list candidates and let the operator identify the record. Never invent a value. Read the result and present the material finding. Never send or publish.
