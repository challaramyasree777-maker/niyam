\# Niyam



A clause-cited GRAP check for a specific construction site, DG set or housing society in Delhi-NCR. Built for the AWS Environmental Hacks, Air track.



\*\*Live app:\*\* https://uktddgzwibk5sa43n3vdyile3q0ianej.lambda-url.ap-south-1.on.aws/

\*\*Demo video:\*\* TODO



\## The problem



In Delhi, when air quality crosses set levels, an official plan called GRAP (Graded Response Action Plan) switches on stage by stage. Higher stages add to lower ones and ban things like many construction activities and older diesel vehicles. CAQM revised the GRAP schedule on 29 Sep 2026.



Site supervisors, builders and housing societies mostly get news about the stage, not a decision about their own site. Mistakes are costly: work stops, and daily-wage workers lose pay.



\## What Niyam does



You describe your site (plot size, portal registration, DG set capacity, vehicle standard and so on). Niyam shows, for each GRAP stage I to IV, whether the work is:



\- \*\*No restriction found\*\* in this rulebook

\- \*\*Blocked until fixed\*\* (a requirement is not met)

\- \*\*Banned\*\* at that stage



Every verdict cites the rule ID and the clause of the CAQM order, with exceptions, the fix and the responsible authority. Niyam then builds a Hindi and English crew notice that a supervisor can copy into WhatsApp.



No language model decides legality. The rulebook is code, so every verdict can be checked and tested.



\## How it works



\- \*\*Rulebook:\*\* `rules/rules.json` holds 17 rules (id, stage, clause, kind, exceptions, fix, authority) transcribed from CAQM Direction No. 104 dated 29.09.2026.

\- \*\*Policies:\*\* `policies/grap.cedar` has one Cedar `forbid` policy per rule, with the same ID. Stages are cumulative, as the Schedule says.

\- \*\*Engine:\*\* `src/engine.js` asks Cedar for a decision and maps the matching policy IDs back to the rulebook.

\- \*\*Tests:\*\* `node src/test.js` runs 47 checks. Each rule has a violating case and a compliant case, plus cumulative-stage checks.

\- \*\*Notice:\*\* built in the page from the verdicts, with hand-written Hindi lines per rule.



\## Where AWS fits



\- \*\*Cedar\*\* (AWS open source, `@cedar-policy/cedar-wasm`): the policy engine that makes every decision.

\- \*\*AWS Lambda\*\* with a \*\*Function URL\*\*: serves the page and the `/check` API.

\- \*\*Amazon DynamoDB:\*\* logs each check (verdicts only, no site details), auto-deleted after 30 days.

\- \*\*AWS SAM:\*\* deploys everything from `template.yaml`.



\## Limits, stated plainly



\- Decision support only. \*\*The official CAQM order prevails.\*\*

\- "No restriction found" means none in this rulebook, not that the work is legal.

\- Covers 17 rules for four areas: construction, vehicles, waste burning and DG sets. Actions that only agencies can take (sweeping, school timings, office hours) are left out.

\- Delhi-NCR only. The design is portable, since another plan would need new rules and policies, but only Delhi-NCR is built and tested.

\- The DG-set table, the Stage III construction list and the Delhi district list were checked against the official PDF on 10 Oct 2026. The remaining rules were transcribed by hand and should be re-checked against the order before real use.

\- The current GRAP stage is not fetched live. The user picks a stage and checks the CAQM website for the stage in force.

\- The Hindi text should be proofread by a Hindi reader. TODO: update this line after proofreading.



\## Run locally



```

npm install

node src/test.js

node src/server.js

```



Open http://localhost:3000.



\## Deploy



```

sam build

sam deploy --stack-name niyam --region ap-south-1 --resolve-s3 --capabilities CAPABILITY\_IAM

```



\## AI tools used



Claude (Anthropic) was used to help structure the rulebook, write the Cedar policies, the Lambda handler, the page and this README. The rules were checked by the author against the official CAQM document. Cedar and AWS SAM are AWS open-source tools.



\## Source



CAQM Direction No. 104 dated 29.09.2026 and the revised GRAP Schedule, https://caqm.nic.in

