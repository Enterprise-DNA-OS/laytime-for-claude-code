---
description: Replace a port statement while keeping its original history
---
# Supersede call

Read both port records and verify that the replacement is a revised statement for the same port call, not a second call. Import the revised statement under a new code first. Replacements must be active records on the same voyage. The old call stays in history and leaves the current claim round and approval queue. The replacement needs its own reviewed terms and calculation.

```bash
node scripts/laytime.mjs supersede-call --port=<old-call> --replacement=<new-call> --reference="<revision evidence>" --actor="<operator>"
```

Never infer that a second call supersedes the first merely because its port name matches. Read the original statement identifiers and ask the operator to resolve ambiguity.
