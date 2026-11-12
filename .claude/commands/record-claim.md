---
description: Record an actual submission, agreement or dispute already handled elsewhere
---
# Record Claim

Record an actual submission, agreement or dispute already handled elsewhere. This command does not send, accept or settle a claim. Kind is submitted, agreed or disputed.

```bash
node scripts/laytime.mjs record-claim --voyage=<voyage> --kind=submitted --at=<timestamp> --reference="<evidence>" --actor="<operator>"
```

Replace angle-bracket values with verified records. Quote names and evidence references. Timestamps use whole minutes and an explicit timezone, for example 2026-11-12T17:00:00+13:00. Add --json for structured output. A unique code, ID prefix or case-insensitive name identifies a record. If ambiguous, list candidates and let the operator identify the record. Never invent a value. Read the result and present the material finding. Never send or publish.
