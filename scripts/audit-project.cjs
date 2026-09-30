const fs = require('fs');
const path = require('path');
const vm = require('vm');
let ts;
try {
  ts = require('typescript');
} catch {
  ts = require('/opt/nvm/versions/node/v22.16.0/lib/node_modules/typescript');
}

const jsFiles = [];
function walk(p) {
  const stat = fs.statSync(p);
  if (stat.isDirectory()) {
    for (const name of fs.readdirSync(p)) walk(path.join(p, name));
  } else if (/\.js$/.test(p)) {
    jsFiles.push(p);
  }
}
walk('src');
jsFiles.push('App.js', 'index.js');

const failures = [];

function resolveRelative(fromFile, spec) {
  const base = path.resolve(path.dirname(fromFile), spec);
  const candidates = [base, `${base}.js`, path.join(base, 'index.js')];
  return candidates.find((candidate) => fs.existsSync(candidate));
}

for (const file of jsFiles) {
  const text = fs.readFileSync(file, 'utf8');
  const patterns = [
    /from\s+['"](\.[^'"]+)['"]/g,
    /require\(\s*['"](\.[^'"]+)['"]\s*\)/g,
  ];
  for (const pattern of patterns) {
    let match;
    while ((match = pattern.exec(text))) {
      if (!resolveRelative(file, match[1])) {
        failures.push(`${file}: unresolved relative import ${match[1]}`);
      }
    }
  }
}

const translationSource = fs.readFileSync('src/i18n/translations.js', 'utf8');
const transpiled = ts.transpileModule(translationSource, {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
}).outputText;
const moduleBox = { exports: {} };
vm.runInNewContext(`(function(module,exports){${transpiled}\n})(module,module.exports);`, {
  module: moduleBox,
  exports: moduleBox.exports,
});
const translations = moduleBox.exports.TRANSLATIONS;

function flatten(obj, prefix = '') {
  const out = new Set();
  for (const [key, value] of Object.entries(obj || {})) {
    const full = prefix ? `${prefix}.${key}` : key;
    if (value && typeof value === 'object') {
      for (const item of flatten(value, full)) out.add(item);
    } else {
      out.add(full);
    }
  }
  return out;
}

const languageSets = Object.fromEntries(
  Object.entries(translations).map(([lang, value]) => [lang, flatten(value)]),
);
const ptKeys = languageSets.pt;
for (const [lang, keys] of Object.entries(languageSets)) {
  for (const key of ptKeys) {
    if (!keys.has(key)) failures.push(`translations.${lang}: missing key ${key}`);
  }
  for (const key of keys) {
    if (!ptKeys.has(key)) failures.push(`translations.${lang}: extra key ${key}`);
  }
}

for (const file of jsFiles) {
  const text = fs.readFileSync(file, 'utf8');
  const re = /\bt\(\s*['"]([^'"]+)['"]/g;
  let match;
  while ((match = re.exec(text))) {
    const key = match[1];
    if (!ptKeys.has(key)) failures.push(`${file}: missing translation key ${key}`);
  }
}

const backendA = path.resolve('backend/rebirth-api');
const backendB = path.resolve('../copiar-para-C-laragon-www/rebirth-api');
if (fs.existsSync(backendA) && fs.existsSync(backendB)) {
  const namesA = fs.readdirSync(backendA).sort();
  const namesB = fs.readdirSync(backendB).sort();
  if (JSON.stringify(namesA) !== JSON.stringify(namesB)) {
    failures.push('Backend copies have different file lists.');
  } else {
    for (const name of namesA) {
      const a = fs.readFileSync(path.join(backendA, name));
      const b = fs.readFileSync(path.join(backendB, name));
      if (!a.equals(b)) failures.push(`Backend copies differ: ${name}`);
    }
  }
}

if (failures.length) {
  console.error(`Project audit FAILED (${failures.length} problems):`);
  for (const failure of failures) console.error(` - ${failure}`);
  process.exit(1);
}
console.log(`Project audit PASSED: ${jsFiles.length} JS files, relative imports, PT/EN/ES key parity, t() keys, and backend mirror.`);
