---
description: Register a separately settled port call
---
# Add Call

Register a separately settled port call.

```bash
node scripts/laytime.mjs add-call --voyage=<voyage> --code=<code> --name="<port>" --currency=USD --actor="<operator>"
```

Replace angle-bracket values with verified records. Quote names and evidence references. Timestamps use whole minutes and an explicit timezone, for example 2026-11-12T17:00:00+13:00. Add --json for structured output. A unique code, ID prefix or case-insensitive name identifies a record. If ambiguous, list candidates and let the operator identify the record. Never invent a value. Read the result and present the material finding. Never send or publish.
