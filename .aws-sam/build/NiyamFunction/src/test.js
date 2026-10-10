const { evaluate, policyIds, RULES } = require('./engine');

const BASE = {
  construction: { plot_sqm: 200, portal_registered: true, dust_controls: true,
    listed_activity: false, exempt_project: false, linear_project: false },
  vehicles: { vehicle_type: 'LMV', fuel: 'petrol', bs: 6, overaged: false,
    registered_in_delhi: true, area: 'delhi', pwd_exempt: false },
  waste_burning: { open_burning: false, illegal_dumping: false, is_rwa: false, heaters_provided: true },
  dg_sets: { fuel: 'diesel', dg_kva: 500, gso_compliant: true, regular_power: false,
    emission_control: true, dual_fuel: true, retrofit_ecd: false,
    gas_unavailable: false, emergency_service: false },
};

// [rule id, category, violating changes, compliant changes]
const CASES = [
  ['C-S1-01', 'construction', { dust_controls: false }, {}],
  ['C-S1-02', 'construction', { plot_sqm: 600, portal_registered: false }, { plot_sqm: 600, portal_registered: true }],
  ['C-S3-01', 'construction', { listed_activity: true }, { listed_activity: true, exempt_project: true }],
  ['C-S4-01', 'construction', { listed_activity: true, exempt_project: true, linear_project: true },
                              { listed_activity: true, exempt_project: true, linear_project: false }],
  ['V-S1-01', 'vehicles', { overaged: true }, {}],
  ['V-S3-01', 'vehicles', { fuel: 'diesel', bs: 4 }, { fuel: 'diesel', bs: 6 }],
  ['V-S3-02', 'vehicles', { vehicle_type: 'MGV', fuel: 'diesel', bs: 4 }, { vehicle_type: 'MGV', fuel: 'diesel', bs: 6 }],
  ['V-S3-03', 'vehicles', { vehicle_type: 'LGV', fuel: 'diesel', bs: 4, registered_in_delhi: false },
                          { vehicle_type: 'LGV', fuel: 'diesel', bs: 6, registered_in_delhi: false }],
  ['V-S4-01', 'vehicles', { vehicle_type: 'HGV', fuel: 'diesel', bs: 4 }, { vehicle_type: 'HGV', fuel: 'cng', bs: 6 }],
  ['W-S1-01', 'waste_burning', { open_burning: true }, {}],
  ['W-S1-02', 'waste_burning', { illegal_dumping: true }, {}],
  ['W-S2-01', 'waste_burning', { is_rwa: true, heaters_provided: false }, { is_rwa: true, heaters_provided: true }],
  ['D-S1-01', 'dg_sets', { regular_power: true }, { regular_power: false }],
  ['D-S1-02', 'dg_sets', { gso_compliant: false, dg_kva: 1200, emission_control: false },
                         { gso_compliant: false, dg_kva: 1200, emission_control: true }],
  ['D-S1-03', 'dg_sets', { gso_compliant: false, dg_kva: 500, dual_fuel: false, retrofit_ecd: false },
                         { gso_compliant: false, dg_kva: 500, dual_fuel: false, retrofit_ecd: true }],
  ['D-S1-04', 'dg_sets', { gso_compliant: false, dg_kva: 30, dual_fuel: false },
                         { gso_compliant: false, dg_kva: 30, dual_fuel: true }],
  ['D-S1-05', 'dg_sets', { gso_compliant: false, dg_kva: 15, emergency_service: false },
                         { gso_compliant: false, dg_kva: 15, emergency_service: true }],
];

let passed = 0, failed = 0;
function check(name, ok) {
  if (ok) passed++;
  else { failed++; console.log('FAIL:', name); }
}

// Every rule must exist in both files
const cedarIds = policyIds().sort().join(',');
const jsonIds = Object.keys(RULES).sort().join(',');
check('policy ids match rules.json ids', cedarIds === jsonIds);

for (const [id, cat, bad, good] of CASES) {
  const stage = Number(id[3]);
  const ctx = (o, s = stage) => ({ ...BASE[cat], stage: s, ...o });
  const hit = c => evaluate(cat, c).matched.some(r => r.id === id);

  check(id + ' fires when violated', hit(ctx(bad)));
  check(id + ' quiet when compliant', !hit(ctx(good)));
  if (stage > 1) check(id + ' silent one stage below', !hit(ctx(bad, stage - 1)));
}

// Stages are cumulative: a Stage I rule still fires at Stage IV
check('cumulative: C-S1-01 fires at stage 4',
  evaluate('construction', { ...BASE.construction, stage: 4, dust_controls: false })
    .matched.some(r => r.id === 'C-S1-01'));

// A clean site at Stage IV gets "no restriction found"
for (const cat of Object.keys(BASE)) {
  const r = evaluate(cat, { ...BASE[cat], stage: 4 });
  check(cat + ' clean site has no restriction at stage 4', r.verdict === 'no_restriction_found');
}

console.log(`\nPassed: ${passed}  Failed: ${failed}`);
process.exit(failed ? 1 : 0);
