# Niyam

A clause-cited GRAP check for a specific construction site, DG set or housing society in Delhi-NCR. Built for AWS Environmental Hacks, Air track.

**Live app:** https://uktddgzwibk5sa43n3vdyile3q0ianej.lambda-url.ap-south-1.on.aws/
**Demo video:** TODO add YouTube link
**Source:** https://github.com/challaramyasree777-maker/niyam

## The problem

In Delhi, when air quality crosses set levels, an official plan called GRAP (Graded Response Action Plan) switches on stage by stage. Higher stages add to lower ones and ban things like many construction activities and older diesel vehicles. CAQM revised the GRAP schedule on 29 Sep 2026.

Site supervisors, builders and housing societies mostly get news about the stage, not a decision about their own site. Mistakes are costly: work stops, and daily-wage workers lose pay.

## What Niyam does

You describe your site (plot size, portal registration, DG set capacity, vehicle standard and so on). For each GRAP stage I to IV, Niyam shows whether the work is:

- **No restriction found** in this rulebook
- **Blocked until fixed** (a requirement is not met)
- **Banned** at that stage

Every verdict cites a rule ID and the clause of the CAQM order, with exceptions, the fix and the responsible authority. Niyam then builds a Hindi and English crew notice that a supervisor can copy into WhatsApp.

No language model decides legality. The rulebook is code, so every verdict can be tested.

## How it works

- **Rulebook:** `rules/rules.json` holds 17 rules (id, stage, clause, kind, exceptions, fix, authority) transcribed from CAQM Direction No. 104 dated 29.09.2026.
- **Policies:** `policies/grap.cedar` has one Cedar `forbid` policy per rule, with the same ID. Stages are cumulative, as the Schedule says.
- **Engine:** `src/engine.js` asks Cedar for a decision and maps the matching policy IDs back to the rulebook. If a policy errors, the check stops instead of silently missing a ban.
- **Tests:** `node src/test.js` runs 52 checks. Each rule has a violating case and a compliant case, plus stage boundary, cumulative-stage and DG-set capacity boundary checks.
- **Notice:** built in the page from the verdicts, with hand-written Hindi lines per rule.

## Where AWS fits

- **Cedar** (AWS open source, `@cedar-policy/cedar-wasm`): the policy engine that makes every decision.
- **AWS Lambda** with a **Function URL**: serves the page and the `/check` API.
- **Amazon DynamoDB:** logs each check (verdicts and a timestamp only, no site details), auto-deleted after 30 days.
- **AWS SAM:** deploys everything from `template.yaml`.

## Limits

- Decision support only. **The official CAQM order prevails.**
- "No restriction found" means none in this rulebook, not that the work is legal.
- **Verification status:** only these rules were checked line by line against the official CAQM PDF: D-S1-02, D-S1-03, D-S1-04, D-S1-05, C-S3-01 and V-S3-01 (see `verified_rule_ids` in `rules/rules.json`). The other 11 were transcribed by hand and should be re-checked before real use. For this reason `verified_against_official_pdf` is set to `false`.
- **C-S1-02** (portal registration for sites of 500 sqm or more): Niyam checks portal registration only. The order also refers to other requirements under Direction Nos. 11-18 dated 11.06.2021, which Niyam does not check.
- **D-S1-02** (DG sets of 1000 kVA and above): the order's table lists the GSR 804(E) exemption only up to 800 kW (1000 kVA). Niyam treats GSR-compliant sets above that size like older sets and asks for emission control. This is a cautious reading of a gap in the table.
- **Linear public projects** (highways, roads, pipelines and so on) are treated as an exempt category at Stage III, as the order allows, and are banned at Stage IV (rule C-S4-01).
- Covers 17 rules across construction, vehicles, waste burning and DG sets. Actions that only agencies can take (sweeping, school timings, office hours) are left out.
- Delhi-NCR only. The design is portable, since another plan would need new rules and policies, but only Delhi-NCR is built and tested.
- The current GRAP stage is not fetched live. The user picks a stage and checks the CAQM website for the stage in force.
- The BOCW reminder in the crew notice is based on the Delhi Government's December 2025 announcement of ₹10,000 compensation for registered and verified construction workers during GRAP III and IV (AIR News, 17 Dec 2025). Whether similar relief applies in future is decided by the Government. Workers should confirm with the Delhi BOCW Welfare Board (bocw.delhi.gov.in).
- Hindi proofreading: TODO write one line, either "The Hindi text was proofread by a Hindi reader on 11 Oct 2026." or "The Hindi text has not yet been proofread by a Hindi reader."

## Privacy

No account is needed. Each check saves only the verdicts and a timestamp for 30 days. Site details entered in the form are not stored.

## Run locally

```
npm install
node src/test.js
node src/server.js
```

Open http://localhost:3000. No AWS account is needed to run locally.

## Deploy

Use your own AWS account (Free plan) and set a Budgets alert first.

```
aws configure
sam build
sam deploy --stack-name niyam --region ap-south-1 --resolve-s3 --capabilities CAPABILITY_IAM
```

Never commit keys or passwords.

## Adding a rule

1. Add the rule to `rules/rules.json`.
2. Add a Cedar `forbid` policy with the same ID in `policies/grap.cedar`.
3. Add a violating case and a compliant case in `src/test.js`.
4. Check the rule against the official CAQM order and keep the clause reference.

## AI tools used

Claude (Anthropic) helped structure the rulebook and write the Cedar policies, the Lambda handler, the page and this README. The author checked the rules marked above against the official CAQM document. Cedar and AWS SAM are AWS open-source tools.

## Source

CAQM Direction No. 104 dated 29.09.2026 and the revised GRAP Schedule, https://caqm.nic.in