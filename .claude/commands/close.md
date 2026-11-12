---
description: Record a reviewed closure after every port has a current calculation and an agreement record exists
---
# Close

Record a reviewed closure after every port has a current calculation and an agreement record exists. This is a workflow check, not a legal determination or payment.

```bash
node scripts/laytime.mjs close --voyage=<voyage> --reference="<closure decision evidence>" --actor="<operator>"
```

Replace angle-bracket values with verified records. Quote names and evidence references. Timestamps use whole minutes and an explicit timezone, for example 2026-11-12T17:00:00+13:00. Add --json for structured output. A unique code, ID prefix or case-insensitive name identifies a record. If ambiguous, list candidates and let the operator identify the record. Never invent a value. Read the result and present the material finding. Never send or publish.
