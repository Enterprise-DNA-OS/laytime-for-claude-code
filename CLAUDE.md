# Laytime for Claude Code

A laytime and demurrage calculation and records desk. Identify the operator, business and role before replacing the fictional demo configuration.

## Rules

- Read the actual records before answering. Never invent charter terms, events, exclusions, dates, rates or approvals.
- Read docs/compliance.md before reviewing terms. The operator determines legal meaning, valid NOR and exact commencement from the contract.
- The engine supports separate port settlement, fixed allowances, whole minutes, explicit exclusions and working-time-saved despatch. Reversible, average, fractional and all-time-saved arrangements need a separately reviewed extension. Do not approximate them.
- Never send, publish, submit a claim, accept liability, agree settlement or make a payment. Drafts stay local.
- Every mutation needs a named actor. Read port and voyage before changing them. Corrections keep original history.
- Import only supported PDF statements after reading docs/replace-layline.md. Reconcile the event count and confirm currency independently. An imported flag is not an approved exclusion.
- Set the exact deadline and its evidence. Never assume a ninety-day time bar.
- Show currencies and payment directions separately. Mark stale or unreviewed values as pending.
- Evidence references record the operator's assertion; they do not prove the evidence is authentic. Clear checks do not establish legal compliance or liability.
- Keep private files out of Git. Use trusted database access, not an anonymous hosted connection.
- Run npm test after code changes. It uses disposable data and ignores ordinary DATABASE_URL.

## Recurring jobs

| Recipe | Job |
|---|---|
| /voyages | List voyages, counterparties, owners and claim deadlines. |
| /calls | List port calls and the revision awaiting review. |
| /claim-round | Run the claim round and separate current calculations from records still awaiting review. |
| /time-bars | Find contract-backed deadlines within fourteen days, missing deadlines and overdue claims. |
| /unreviewed | Find port calls whose contract terms or time exclusions need review. |
| /stale-claims | Find open voyages without a voyage update, note or claim record for fourteen days. |
| /owner-workload | Count open voyages, unreviewed calls and overdue deadlines by owner. |
| /counterparty-exposure | Group current calculated amounts by counterparty, currency and payment direction. |
| /port-delays | Compare demurrage, excluded and saved minutes across reviewed port calls. |
| /exceptions | Read the original time-exclusion history, including corrected entries. Use port for active entries. |
| /events | Read the imported statement events without treating their flags as approved contract interpretation. |
| /attention | Find missing contract reviews, stale calculations, missing rates and claim deadlines. |
| /compliance | Run the evidence checks. Read docs/compliance.md before interpreting the result. |
| /import-history | Read source hashes, filenames, actors and import dates. |
| /audit | Read the append-only change history and named actors. |
| /notes | Read the factual follow-up history. |
| /claims | Read evidence of submissions, agreements and disputes already handled by the operator. |
| /voyage | Read a complete voyage before working on it. |
| /port | Read reviewed terms, active exceptions, imported events and calculation history. |
| /add-voyage | Register a voyage using actual details. Do not invent a deadline. |
| /add-call | Register a separately settled port call. |
| /set-terms | Record reviewed evidence for a fixed allowance and separate port settlement. Provide the agreed commencement, completion, NOR evidence and working-time-saved despatch rate. Omitting despatch-rate leaves it unknown. Changes invalidate approval. |
| /add-exception | Add a non-overlapping time exclusion supported by the actual charter clause. on-demurrage is false unless that clause expressly excludes the period on demurrage. Every addition invalidates review. |
| /supersede-call | Replace an old statement with a verified revised call on the same voyage. Original evidence stays, and only the replacement enters the current claim round. |
| /void-exception | Correct an erroneous exclusion by appending a void record. The original stays in history. Read port to obtain its identifier, record the correction reason, then add any replacement and re-review. |
| /review-call | Confirm the operator has checked the charter, valid NOR, commencement, completion, every exclusion and the fixed allowance. Only separate-port, whole-minute calculations and working-time-saved despatch are supported. Do not approve reversible, averaged, fractional or all-time-saved calculations. |
| /calculate | Save a new calculation from the current reviewed revision. Show the interval ledger and direction. A later edit invalidates it. |
| /set-deadline | Record the exact contract-backed claim deadline and timezone. Never assume ninety days or infer the start date. |
| /log | Append a factual follow-up note. |
| /record-claim | Record an actual submission, agreement or dispute already handled elsewhere. This command does not send, accept or settle a claim. Kind is submitted, agreed or disputed. |
| /close | Record a reviewed closure after every port has a current calculation and an agreement record exists. This is a workflow check, not a legal determination or payment. |
| /weekly-review | Prepare the Monday review from claim-round, attention and time-bars. The command reads all three and writes a branded draft. Separate pending records from current calculations. |
| /draft-statement | Write the current reviewed port calculation and interval ledger to drafts. Review against the charter and source records. Nothing sends. |
| /draft-claim | Prepare a claim working paper from the current approved calculation. It is not a formal legal demand or proof of liability. The operator reviews and handles delivery. |
| /import | Read docs/replace-layline.md first. Import one text-based PDF exported from the Layline worksheet. Create the voyage first. Verify the currency from the contract because a bare dollar sign is ambiguous. Run a dry run, compare event count and source terms, then repeat without dry-run. The statement stays unreviewed. |
| /export | Export every record, original PDF archive and audit entry to a new private directory. Do not overwrite a previous export. This portable archive is not a database restore. |
| /customise | Add fields, rules and reports with migrations and tests. |
| /new-view | Add a branded read-only report. |

## Files

scripts/laytime.mjs is the one CLI. scripts/lib/calculate.mjs is the bounded calculation engine. Migrations live in supabase/migrations and fictional seed data in supabase/seed.sql. DATABASE_URL selects Postgres; otherwise PGlite uses DATA_DIR or .data/db. brand.json controls the business name, colours and logo. views.json and documents.json declare read-only reports through the shared renderer.

Built and run for you through Omni by Enterprise DNA: https://enterprisedna.co/omni/instead-of/layline
