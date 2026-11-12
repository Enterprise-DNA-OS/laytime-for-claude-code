---
description: Record the exact contract-backed claim deadline and timezone
---
# Set Deadline

Record the exact contract-backed claim deadline and timezone. Never assume ninety days or infer the start date.

```bash
node scripts/laytime.mjs set-deadline --voyage=<voyage> --at=<timestamp> --reference="<contract deadline clause>" --actor="<operator>"
```

Replace angle-bracket values with verified records. Quote names and evidence references. Timestamps use whole minutes and an explicit timezone, for example 2026-11-12T17:00:00+13:00. Add --json for structured output. A unique code, ID prefix or case-insensitive name identifies a record. If ambiguous, list candidates and let the operator identify the record. Never invent a value. Read the result and present the material finding. Never send or publish.
