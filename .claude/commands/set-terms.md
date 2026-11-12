---
description: Record reviewed evidence for a fixed allowance and separate port settlement
---
# Set Terms

Record reviewed evidence for a fixed allowance and separate port settlement. Provide the agreed commencement, completion, NOR evidence and working-time-saved despatch rate. Omitting despatch-rate leaves it unknown. Changes invalidate approval.

```bash
node scripts/laytime.mjs set-terms --port=<port> --commenced=<timestamp> --completed=<timestamp> --allowed-minutes=<minutes> --demurrage-rate=<daily-rate> --despatch-rate=<daily-rate> --contract-ref="<clause and basis>" --nor-ref="<valid NOR evidence>" --actor="<operator>"
```

Replace angle-bracket values with verified records. Quote names and evidence references. Timestamps use whole minutes and an explicit timezone, for example 2026-11-12T17:00:00+13:00. Add --json for structured output. A unique code, ID prefix or case-insensitive name identifies a record. If ambiguous, list candidates and let the operator identify the record. Never invent a value. Read the result and present the material finding. Never send or publish.
