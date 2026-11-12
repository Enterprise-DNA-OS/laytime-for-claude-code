---
description: Correct an erroneous exclusion by appending a void record
---
# Void Exception

Correct an erroneous exclusion by appending a void record. The original stays in history. Read port to obtain its identifier, record the correction reason, then add any replacement and re-review.

```bash
node scripts/laytime.mjs void-exception --port=<port> --exception=<id-prefix> --reason="<correction evidence>" --actor="<operator>"
```

Replace angle-bracket values with verified records. Quote names and evidence references. Timestamps use whole minutes and an explicit timezone, for example 2026-11-12T17:00:00+13:00. Add --json for structured output. A unique code, ID prefix or case-insensitive name identifies a record. If ambiguous, list candidates and let the operator identify the record. Never invent a value. Read the result and present the material finding. Never send or publish.
