---
description: Read docs/replace-layline
---
# Import

Read docs/replace-layline.md first. Import one text-based PDF exported from the Layline worksheet. Create the voyage first. Verify the currency from the contract because a bare dollar sign is ambiguous. Run a dry run, compare event count and source terms, then repeat without dry-run. The statement stays unreviewed.

```bash
node scripts/laytime.mjs import layline --file="<statement.pdf>" --voyage=<voyage> --code=<new-port-code> --currency=USD --actor="<operator>" --dry-run
```

Replace angle-bracket values with verified records. Quote names and evidence references. Timestamps use whole minutes and an explicit timezone, for example 2026-11-12T17:00:00+13:00. Add --json for structured output. A unique code, ID prefix or case-insensitive name identifies a record. If ambiguous, list candidates and let the operator identify the record. Never invent a value. Read the result and present the material finding. Never send or publish.
