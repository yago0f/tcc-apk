const assert = require('assert');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { patchFile, FIXED_VERSION } = require('./fix-gradle-foojay.cjs');

function withFixture(version, fn) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'rebirth-gradle-fix-'));
  const file = path.join(dir, 'settings.gradle.kts');
  fs.writeFileSync(
    file,
    `plugins { id("org.gradle.toolchains.foojay-resolver-convention").version("${version}") }\n`,
    'utf8',
  );
  try {
    fn(file);
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
}

withFixture('0.5.0', (file) => {
  const result = patchFile(file);
  assert.strictEqual(result.changed, true);
  assert.strictEqual(result.from, '0.5.0');
  assert.strictEqual(result.to, FIXED_VERSION);
  assert.match(fs.readFileSync(file, 'utf8'), /version\("1\.0\.0"\)/);
});

withFixture('1.0.0', (file) => {
  const result = patchFile(file);
  assert.strictEqual(result.changed, false);
  assert.strictEqual(result.from, '1.0.0');
  assert.match(fs.readFileSync(file, 'utf8'), /version\("1\.0\.0"\)/);
});

withFixture('1.1.0', (file) => {
  const result = patchFile(file);
  assert.strictEqual(result.changed, false);
  assert.strictEqual(result.from, '1.1.0');
  assert.match(fs.readFileSync(file, 'utf8'), /version\("1\.1\.0"\)/);
});

console.log('[test-gradle-fix] PASS - patch 0.5.0 -> 1.0.0 e idempotencia verificadas.');
