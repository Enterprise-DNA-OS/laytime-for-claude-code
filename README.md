# Laytime for Claude Code

Laytime calculations, port-call evidence and claim deadlines in a database you own. Free MIT-licensed software from Enterprise DNA. Works with Claude Code, Codex, OpenCode or Cursor.

| Do it yourself | We customise it | We run it for you |
|---|---|---|
| Clone, install and own it. [Quick start](#quick-start). | Your contract rules, reports and Layline statements mapped across. [Get your version built](https://enterprisedna.co/omni/book/?offer=replace-software&utm_source=github&utm_campaign=layline). | Installed and operated through Omni by Enterprise DNA. One setup fee, then a retainer. [Book a call](https://enterprisedna.co/omni/book/?offer=replace-software&utm_source=github&utm_campaign=layline). |

## What it does

Run the daily claim round, check the evidence behind commencement and exclusions, calculate separately settled port calls, and prepare a laytime statement and claim dossier. Every figure comes with its input revision and interval ledger. Changed terms or exclusions invalidate approval and remove the old amount from the current position.

Layline's [published analyst price](https://getlayline.com/) is $1,000 per month, or $12,000 for twelve monthly payments, checked 12 November 2026. The pricing block does not label the subscription currency. This is a published tariff, not evidence of an existing customer's bill.

The free base calculates fixed allowances in whole minutes, with explicitly reviewed exclusion windows, an agreed daily demurrage rate, and working-time-saved despatch when its rate is recorded. No default half-rate or universal ninety-day claim deadline. The operator determines valid NOR, commencement, completion and applicable clauses from the contract.

It does not interpret charter parties, extract scanned handwriting, implement reversible or averaged voyages, calculate fractional time factors, or determine legal liability. Contract interpretation remains with the operator and their adviser. This is an independent implementation, not affiliated with Layline. [Calculation scope and evidence rules](docs/compliance.md).

## Quick start

Node 22.13 or later. The demo needs no account or server.

```bash
git clone https://github.com/Enterprise-DNA-OS/laytime-for-claude-code.git
cd laytime-for-claude-code
npm install
npm test
npm run demo
npm run laytime -- claim-round
npm run view
npm run docs
```

The seed uses fictional vessels, counterparties and evidence with relative review dates. It is idempotent. Never seed a production database. The demo includes a demurrage call, a despatch call, unreviewed records, stale follow-ups and a past claim deadline.

Open the folder in your coding agent and ask for the claim round. AGENTS.md points every runtime to CLAUDE.md and the same command library.

DATABASE_URL selects Postgres. Without it, embedded PGlite stores records under .data/db or DATA_DIR. Use npm run migrate on an empty shared database. Shared demo seeding requires --demo-database and must target a disposable database. The schema enables row security and revokes public access. A shared deployment needs a trusted database operator, access controls and tested backups; this is not a multi-user sign-in service.

## Commands

The one CLI is npm run laytime -- followed by a command. Add --json for machines. Writes need --actor. References accept case-insensitive exact codes and names, unique code or ID prefixes and name fragments. Ambiguous references list candidates and exit 1.

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

## Ten questions to ask

These questions join your evidence, locally chosen deadlines and current calculations. They are executable here, not a claim that Layline cannot produce similar reports.

1. Which claims have a deadline within fourteen days or no deadline at all? `time-bars`
2. Which port calls still need a contract review? `unreviewed`
3. What amounts are currently calculated for each counterparty and currency? `counterparty-exposure`
4. Which reviewed ports used the most demurrage time? `port-delays`
5. Which owners have the most unreviewed calls and past deadlines? `owner-workload`
6. Which open voyages have had no follow-up for fourteen days? `stale-claims`
7. Which exclusions apply after the allowance is exhausted? `exceptions`
8. What events did the imported statement actually contain? `events`
9. Which calculations became stale after a correction? `attention`
10. What submission or agreement evidence is recorded for this voyage? `voyage DEMO-PACIFIC`

## Your first hour: ten things to ask for

1. Put our name, colours and logo in brand.json.
2. Run the fictional claim round and inspect the interval ledger.
3. Create one voyage with its actual counterparty and owner.
4. Import one Layline PDF and reconcile every event.
5. Record the exact contract-backed claim deadline and timezone.
6. Record the reviewed commencement, completion and fixed allowance.
7. Record supported exclusions with their clause references.
8. Review one supported port call and calculate it.
9. Produce a draft statement and compare it with the source evidence.
10. Set up the shared database, controlled evidence store and tested backups.

## Switching

[Bring Layline statements across](docs/replace-layline.md). A text-based PDF from the worksheet's Export button imports in one command. The original bytes, text, parsed terms and events stay together with a source hash. A dry run rolls back. Repeated identical files skip. Conflicting codes fail without partial writes. Imported flags and figures remain source evidence until the operator reviews the supported calculation inputs. Scanned PDFs and other layouts are rejected.

## Documents and views

npm run docs renders branded draft laytime statements for current reviewed calculations and a claim evidence dossier for each voyage. npm run view renders the weekly position and exception evidence. /weekly-review, /draft-statement and /draft-claim write working documents to drafts. Nothing sends. [Why no front end](docs/why-no-front-end.md).

## Records and recovery

Original statements, source events, calculations, notes, claim records and audit entries are append-only through the application. Wrong exceptions are voided with a reason and retained in history. Corrections require another review. A database owner can alter controls; do not call this tamper-proof. External evidence references do not authenticate their contents.

Export writes a portable archive including source PDFs. It is not a restore command. Back up the full database and evidence store, and test recovery. Keep private imports, exports, drafts and credentials out of Git.

## Tests

npm test uses temporary data and never inherits DATABASE_URL. It checks arithmetic examples, boundary exclusions, timezone validation, all reads and mutations, PDF event reconciliation, rollback, duplicate imports, source preservation, review invalidation, correction history, closure controls, ambiguity and HTML escaping. CI runs Windows and Linux on Node 22 and 24, plus PostgreSQL 16. The optional LAYTIME_VENDOR_SAMPLE path adds a check against the vendor's public sample PDF without redistributing it.

## Installed for you

Enterprise DNA builds your version around your charter terms, source records and reporting needs. Omni by Enterprise DNA installs and operates it. One setup fee, then a retainer. [Book Sam's 30-minute call](https://enterprisedna.co/omni/book/?offer=replace-software&utm_source=github&utm_campaign=layline).

MIT. Copyright 2026 Enterprise DNA.
