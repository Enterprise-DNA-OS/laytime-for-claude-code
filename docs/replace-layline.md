# Bring Layline statements across

Layline's public worksheet at https://getlayline.com/app has an Export control that invokes the browser's print dialog. Choose Save as PDF. Its public example is https://getlayline.com/Layline_Sample_Laytime_Statement.pdf. These sources were reopened on 12 November 2026. The base imports that text-based statement layout, not a purported CSV export or a private undocumented API.

## Before importing

1. In Layline, open the voyage and check the vessel, port, charter terms and event count.
2. Use Export and save the complete statement as PDF. Keep its source contract and signed statement of facts in your controlled evidence store.
3. Create the destination voyage with its real vessel, counterparty and owner. Record the exact claim deadline only when you have the clause and triggering evidence.
4. Confirm the currency from the contract. The PDF prints a dollar sign and does not identify which dollar currency it means.

```bash
node scripts/laytime.mjs add-voyage --code=V001 --name="Reviewed voyage" --vessel="Actual vessel" --counterparty="Actual counterparty" --owner="Actual owner" --actor="Actual operator"
node scripts/laytime.mjs import layline --file="imports/statement.pdf" --voyage=V001 --code=V001-PORT --currency=USD --actor="Actual operator" --dry-run
```

Compare the parsed event count, port and source terms with the PDF. Repeat the import command without --dry-run to save it. After voyage creation, one command imports the statement and its events.

## What maps

| Source | Destination |
|---|---|
| Vessel and port headings | Parsed source archive and port name; voyage identity remains the operator's record |
| Allowed hours | Source allowance in whole minutes |
| Daily demurrage and despatch rates | Source rates in integer cents; currency confirmed by the operator |
| Event ID, UTC time, description, counting flag and factor | Original source event records |
| Weekend rule and laytime type | Preserved in the parsed source archive, not automatically applied |
| Complete original PDF and extracted text | Retained with a SHA-256 hash in the import archive |

The importer reconciles the stated event count, rejects duplicate event IDs, and rejects a malformed or unsupported layout. The original file's hash makes a repeat import a no-op. A different file using an existing call code fails and rolls back every new record. To retain a revised vendor statement, import it under a new call code, then run supersede-call with the old port, replacement code, evidence reference and actor. Both statements stay in history; only the replacement enters the current claim round. Replacements must be active calls on the same voyage, and cycles are rejected.

## Review after import

Read port V001-PORT. Source flags do not become calculation exclusions automatically. Use set-terms to record the operator-reviewed commencement, completion, fixed allowance, contract reference, NOR evidence and rates. Use add-exception for each supported exclusion, including any reviewed holiday window. Only set on-demurrage=true when the contract expressly excludes that period from demurrage. Then review-call and calculate.

The current engine supports separately settled ports and working-time-saved despatch. It does not reproduce all of Layline's advertised calculation modes. A reversible or averaged fixture, fractional factors, all-time-saved despatch, scanned source documents or a different statement layout needs a reviewed custom implementation. Preserve the original result and have the analyst verify a representative case before changing the working process.

The PDF does not carry your follow-up notes, attachments, counterparties, claim correspondence, account permissions or source contract. Bring those through an agreed migration. Do not infer them from the statement. Rejecting an unsupported file is preferable to inventing missing events.

## Test evidence

npm test generates a fictional PDF in the documented layout and exercises import, dry run, duplicate detection, conflict rollback and original-byte preservation. LAYTIME_VENDOR_SAMPLE can point to a separately downloaded public vendor sample for a nine-event reconciliation check. The vendor PDF is not bundled or redistributed.

Export produces a private JSON archive including all source PDF bytes. Database recovery uses a tested database backup, not this archive alone.
