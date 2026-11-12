---
description: Confirm the operator has checked the charter, valid NOR, commencement, completion, every exclusion and the fixed allowance
---
# Review Call

Confirm the operator has checked the charter, valid NOR, commencement, completion, every exclusion and the fixed allowance. Only separate-port, whole-minute calculations and working-time-saved despatch are supported. Do not approve reversible, averaged, fractional or all-time-saved calculations.

```bash
node scripts/laytime.mjs review-call --port=<port> --reference="<review evidence>" --actor="<reviewer>"
```

Replace angle-bracket values with verified records. Quote names and evidence references. Timestamps use whole minutes and an explicit timezone, for example 2026-11-12T17:00:00+13:00. Add --json for structured output. A unique code, ID prefix or case-insensitive name identifies a record. If ambiguous, list candidates and let the operator identify the record. Never invent a value. Read the result and present the material finding. Never send or publish.
