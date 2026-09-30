const fs = require('fs');
const path = require('path');
let ts;
try {
  ts = require('typescript');
} catch {
  ts = require('/opt/nvm/versions/node/v22.16.0/lib/node_modules/typescript');
}

const roots = ['App.js', 'index.js', 'src'];
const files = [];

function walk(p) {
  const stat = fs.statSync(p);
  if (stat.isDirectory()) {
    for (const name of fs.readdirSync(p)) walk(path.join(p, name));
  } else if (/\.js$/.test(p)) files.push(p);
}

for (const root of roots) if (fs.existsSync(root)) walk(root);

let errors = 0;
for (const file of files) {
  const text = fs.readFileSync(file, 'utf8');
  const sf = ts.createSourceFile(file, text, ts.ScriptTarget.Latest, true, ts.ScriptKind.JSX);
  if (sf.parseDiagnostics.length) {
    errors += sf.parseDiagnostics.length;
    for (const d of sf.parseDiagnostics) {
      const lc = sf.getLineAndCharacterOfPosition(d.start || 0);
      console.error(`${file}:${lc.line + 1}:${lc.character + 1} TS${d.code} ${ts.flattenDiagnosticMessageText(d.messageText, ' ')}`);
    }
  }
}

if (errors) {
  console.error(`JS/JSX parse FAILED: ${errors} syntax diagnostics across ${files.length} files.`);
  process.exit(1);
}
console.log(`JS/JSX parse PASSED: ${files.length} files.`);
