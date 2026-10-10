const fs = require('fs');
const path = require('path');
const cedar = require('@cedar-policy/cedar-wasm/nodejs');
const rulebook = require('../rules/rules.json');

// Split grap.cedar into { ruleId: policyText } using the @id("...") markers.
function loadPolicies() {
  const text = fs.readFileSync(path.join(__dirname, '..', 'policies', 'grap.cedar'), 'utf8');
  const map = {};
  for (const part of text.split(/(?=@id\()/)) {
    const m = part.match(/^@id\("([^"]+)"\)/);
    if (m) map[m[1]] = part.trim();
  }
  return map;
}

const POLICIES = loadPolicies();
const RULES = Object.fromEntries(rulebook.rules.map(r => [r.id, r]));

function policyIds() {
  return Object.keys(POLICIES).filter(id => id !== 'BASE');
}

function evaluate(category, context) {
  const res = cedar.isAuthorized({
    principal: { type: 'Site', id: 'site' },
    action: { type: 'Action', id: category },
    resource: { type: 'Activity', id: 'work' },
    context,
    policies: { staticPolicies: POLICIES },
    entities: [],
  });

  if (res.type !== 'success') {
    throw new Error('Cedar failure: ' + JSON.stringify(res.errors));
  }
  const diag = res.response.diagnostics;
  // A policy that errors would silently miss a ban, so we stop loudly instead.
  if (diag.errors && diag.errors.length > 0) {
    throw new Error('Cedar policy error: ' + JSON.stringify(diag.errors));
  }

  const matched = diag.reason
    .filter(id => id !== 'BASE')
    .map(id => {
      if (!RULES[id]) throw new Error('No rule in rules.json for ' + id);
      return RULES[id];
    });

  let verdict = 'no_restriction_found';
  if (matched.some(r => r.kind === 'ban')) verdict = 'banned';
  else if (matched.some(r => r.kind === 'requirement')) verdict = 'blocked_until_fixed';

  return { category, stage: context.stage, verdict, matched };
}

module.exports = { evaluate, policyIds, RULES };