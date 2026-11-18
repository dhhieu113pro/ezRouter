/**
 * Regression check for UI Model Dropdowns.
 *
 * The UI no longer ships baked-in model lists or provider-specific
 * (ag/*, cx/*) model sets: models are discovered from the live API and every
 * provider is configured externally via /admin/providers.
 *
 * This verifier pins the current contract:
 *   - PlaygroundTab derives its options from api.getModels() (no static lists).
 *   - Thinking levels include xhigh / max / ultra.
 *   - No ag/* or cx/* model literals leak back into this component.
 */

const fs = require('fs');
const path = require('path');

const playgroundPath = path.resolve(__dirname, '../src/components/PlaygroundTab.tsx');

const playgroundContent = fs.readFileSync(playgroundPath, 'utf8');

const THINKING_LEVELS = ['xhigh', 'max', 'ultra'];

const hasThinkingLevels = (content) =>
  THINKING_LEVELS.every((lvl) => content.includes(`value="${lvl}"`));

const checks = [
  {
    name: 'PlaygroundTab loads model options from the API (no static default lists)',
    test: () =>
      playgroundContent.includes('api.getModels()') &&
      playgroundContent.includes('setModels(') &&
      !/DEFAULT_(?:AG|CX|UPSTREAM|OR)_MODELS/.test(playgroundContent),
    detail: 'Playground models must come from api.getModels(); static DEFAULT_*_MODELS lists must not exist',
  },
  {
    name: 'PlaygroundTab renders API-provided models as options',
    test: () =>
      /otherModels\.map\(/.test(playgroundContent) &&
      /<option key=\{m\} value=\{m\}>/.test(playgroundContent),
    detail: 'Playground select must map over the fetched model ids into <option> elements',
  },
  {
    name: 'PlaygroundTab does not filter out models by provider prefix',
    test: () => !/startsWith\(\s*['"](?:ag|cx)\//.test(playgroundContent),
    detail: 'Model options must not be filtered by legacy ag//cx/ prefixes',
  },
  {
    name: 'PlaygroundTab exposes custom model override',
    test: () => playgroundContent.includes('customModel') && playgroundContent.includes('isCustomModel'),
    detail: 'Playground must allow typing an arbitrary model id',
  },
  {
    name: 'Playground thinking level options include xhigh, max, and ultra',
    test: () => hasThinkingLevels(playgroundContent),
    detail: 'Playground thinking level select must include xhigh, max, and ultra options',
  },
  {
    name: 'No legacy ag/* or cx/* model literals remain in the tab',
    test: () =>
      !/['"]ag\//.test(playgroundContent) &&
      !/['"]cx\//.test(playgroundContent),
    detail: 'Antigravity (ag/*) and Codex (cx/*) model literals must be fully removed',
  },
];

console.log('--- ezRouter UI Model Dropdown Verification ---');
let passed = 0;
let failed = 0;

for (const check of checks) {
  const result = check.test();
  if (result) {
    console.log(`PASS: ${check.name}`);
    passed++;
  } else {
    console.error(`FAIL: ${check.name}`);
    console.error(`  Detail: ${check.detail}`);
    failed++;
  }
}

console.log(`\nTotal checks: ${checks.length}, Passed: ${passed}, Failed: ${failed}`);
if (failed > 0) {
  process.exit(1);
}
console.log('All model dropdown invariants verified successfully.\n');
