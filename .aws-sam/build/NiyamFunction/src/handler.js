const fs = require('fs');
const path = require('path');
const { evaluate } = require('./engine');
const rulebook = require('../rules/rules.json');

const PAGE = fs.readFileSync(path.join(__dirname, '..', 'public', 'index.html'), 'utf8');

const num = (v, d) => (Number.isFinite(Number(v)) ? Number(v) : d);
const bool = v => v === true;
const str = (v, allowed, d) => (allowed.includes(v) ? v : d);

// Turn the raw form values into the exact context Cedar expects.
function buildContexts(site, stage) {
  const sqm = num(site.plot_sqm, 0);
  const fuel = str(site.dg_fuel, ['diesel', 'gas'], 'diesel');
  return {
    construction: {
      stage,
      plot_sqm: sqm,
      portal_registered: bool(site.portal_registered),
      dust_controls: bool(site.dust_controls),
      listed_activity: bool(site.listed_activity),
      exempt_project: bool(site.exempt_project),
      linear_project: bool(site.linear_project),
    },
    vehicles: {
      stage,
      vehicle_type: str(site.vehicle_type, ['LMV', 'MGV', 'LGV', 'HGV'], 'LMV'),
      fuel: str(site.vehicle_fuel, ['petrol', 'diesel', 'cng', 'lng', 'electric'], 'diesel'),
      bs: num(site.vehicle_bs, 4),
      overaged: bool(site.overaged),
      registered_in_delhi: bool(site.registered_in_delhi),
      area: str(site.area, ['delhi', 'hvd_district', 'other'], 'delhi'),
      pwd_exempt: bool(site.pwd_exempt),
    },
    waste_burning: {
      stage,
      open_burning: bool(site.open_burning),
      illegal_dumping: bool(site.illegal_dumping),
      is_rwa: bool(site.is_rwa),
      heaters_provided: bool(site.heaters_provided),
    },
    dg_sets: {
      stage,
      fuel: fuel === 'gas' ? 'gas' : 'diesel',
      dg_kva: num(site.dg_kva, 0),
      gso_compliant: bool(site.gso_compliant),
      regular_power: bool(site.regular_power),
      emission_control: bool(site.emission_control),
      dual_fuel: bool(site.dual_fuel),
      retrofit_ecd: bool(site.retrofit_ecd),
      gas_unavailable: bool(site.gas_unavailable),
      emergency_service: bool(site.emergency_service),
    },
  };
}

function check(body) {
  const site = body && body.site ? body.site : {};
  const categories = Array.isArray(body && body.categories) && body.categories.length
    ? body.categories
    : ['construction', 'vehicles', 'waste_burning', 'dg_sets'];

  const results = {};
  for (const cat of categories) {
    if (!['construction', 'vehicles', 'waste_burning', 'dg_sets'].includes(cat)) continue;
    results[cat] = [1, 2, 3, 4].map(stage => {
      const ctx = buildContexts(site, stage)[cat];
      return evaluate(cat, ctx);
    });
  }
  return { meta: rulebook.meta, results };
}

// Works for both Lambda Function URLs and the local server.
async function handle(method, urlPath, rawBody) {
  if (method === 'GET' && (urlPath === '/' || urlPath === '/index.html')) {
    return { status: 200, type: 'text/html; charset=utf-8', body: PAGE };
  }
  if (method === 'POST' && urlPath === '/check') {
    let parsed;
    try { parsed = JSON.parse(rawBody || '{}'); }
    catch { return { status: 400, type: 'application/json', body: JSON.stringify({ error: 'Bad JSON' }) }; }
    try {
      return { status: 200, type: 'application/json', body: JSON.stringify(check(parsed)) };
    } catch (e) {
      console.error(e);
      return { status: 500, type: 'application/json', body: JSON.stringify({ error: 'Check failed' }) };
    }
  }
  return { status: 404, type: 'text/plain', body: 'Not found' };
}

module.exports = { handle, check };