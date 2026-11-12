# Charter evidence and calculation rules

This is a record-checking and calculation aid, not a legal compliance certification. The analyst determines which contract, rider clauses, definitions and governing law apply. The application does not interpret a charter party or decide liability.

Sources reopened 12 November 2026:

- BIMCO, Laytime Definitions for Charter Parties 2013: https://www.bimco.org/contractual-affairs/bimco-contracts/contracts/laytime-definitions-for-charter-parties-2013/
- Full definitions: https://www.bimco.org/media/qy2neqim/laytime-definitions-for-charter-parties-2013-v2.pdf

The definitions apply when incorporated into the charter, as their preamble states. They are contractual definitions, not a universal statutory rule.

| Rule | Source and meaning | Implemented check |
|---|---|---|
| REVIEW | Definitions 5 and 25 concern the agreed loading allowance and readiness notice. Clauses and actual facts determine commencement. | Calculation requires a named review, contract reference, NOR evidence and explicit start and completion. No automatic NOR validity decision. |
| EXCLUSION | Definitions 14 to 19 describe holidays, weather and excluded time. The exact wording and local practice matter. | Every explicit window needs a clause reference and reason. Windows cannot overlap or extend beyond the reviewed calculation interval. No default weekend or holiday calendar. |
| DEMURRAGE | Definition 30 distinguishes demurrage from laytime exceptions. | Once the allowance is exhausted, an exclusion only applies when on-demurrage is explicitly true. The analyst must support that flag from the contract. |
| DESPATCH | Definitions 31 to 33 distinguish agreed despatch and its basis. | No assumed half-rate. Working-time-saved only. A missing rate leaves a saved-time result in REVIEW. An explicit zero rate records a reviewed no-payment amount. |
| CALCULATION | Local review policy. | Changed terms, added exclusions or voided exclusions invalidate approval. Current reports hide old amounts until re-reviewed and recalculated. Calculation history stays. |
| TIME-BAR | The actual claim clause and triggering facts, not a universal BIMCO ninety-day deadline. | Record exact timestamp, timezone and evidence. Flag missing deadlines, deadlines within fourteen days and past deadlines without submission evidence. Fourteen days is our configurable review window. |
| STALE | Local follow-up policy, not a legal obligation. | Flag an open voyage after fourteen days without a voyage update, note or claim evidence. Port edits alone do not count as counterparty follow-up. |
| CLOSURE | Local workflow control. | Every port needs a current reviewed calculation and an agreement record must exist before closing. The application does not authenticate that record or move money. |

## Calculation boundary

Separate port settlements, fixed nonnegative allowances, whole UTC minutes and whole-minute exclusion windows. Rate arithmetic uses integer cents and rounds once, half-up, after multiplying elapsed minutes by the daily rate and dividing by the minutes in a day. Exclusion windows remove time from laytime while allowance remains; time on demurrage continues through ordinary laytime exclusions.

No reversible pooling, averaging, fractional time factors, automated weather ratios, NOR validity assessment, all-time-saved despatch, law inference or default holiday interpretation. When one applies, hold the calculation for a reviewed extension. Do not describe a supported subset as a complete charter-party calculator.

## Data controls

Append-only source records and calculations retain the reviewed input revision. The actor is recorded for every write. Exception corrections append a void record and invalidate the port review. Rows have UUIDs and update timestamps. Row security and revoked public privileges block anonymous access; a shared installation still needs a controlled operator role and evidence permissions. A database owner can change controls.

Claim records document what the operator says already happened. No evidence reference is independently verified, and the software neither sends a claim nor accepts its legal merits. Original PDFs preserve the imported source but do not prove that a source event occurred.
