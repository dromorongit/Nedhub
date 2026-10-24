'use strict';

const fs = require('fs');
const path = require('path');
const os = require('os');
const { execFileSync } = require('child_process');

const ROOT = path.resolve(__dirname, '..');
const node = process.execPath;

let failures = 0;

function report(file, err) {
  failures += 1;
  const msg = err && err.stderr ? err.stderr.toString().trim() : (err && err.message ? err.message : String(err));
  process.stdout.write(`FAIL: ${file}\n${msg}\n`);
}

function checkFile(filePath, label) {
  try {
    execFileSync(node, ['--check', filePath], { stdio: 'pipe' });
  } catch (err) {
    report(label || filePath, err);
  }
}

// 1. Every .js file directly in js/
const jsDir = path.join(ROOT, 'js');
for (const entry of fs.readdirSync(jsDir, { withFileTypes: true })) {
  if (entry.isFile() && entry.name.endsWith('.js')) {
    checkFile(path.join(jsDir, entry.name), path.join('js', entry.name));
  }
}

// 2. Top-level site-nav.js and site-footer.js
for (const name of ['site-nav.js', 'site-footer.js']) {
  const full = path.join(ROOT, name);
  if (fs.existsSync(full)) checkFile(full, name);
}

// 3. Inline scripts in root .html files
const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'check-syntax-'));
let blockIndex = 0;
const scriptRegex = /<script\b([^>]*)>([\s\S]*?)<\/script>/gi;

for (const entry of fs.readdirSync(ROOT, { withFileTypes: true })) {
  if (!entry.isFile() || !entry.name.endsWith('.html')) continue;
  const htmlPath = path.join(ROOT, entry.name);
  const html = fs.readFileSync(htmlPath, 'utf8');
  let match;
  while ((match = scriptRegex.exec(html)) !== null) {
    const attrs = match[1] || '';
    const code = match[2] || '';
    if (/\bsrc\s*=/.test(attrs)) continue;
    if (/type\s*=\s*["']application\/ld\+json["']/i.test(attrs)) continue;
    if (code.trim() === '') continue;

    blockIndex += 1;
    const tmpFile = path.join(tmpDir, `inline-${blockIndex}.js`);
    fs.writeFileSync(tmpFile, code);
    try {
      execFileSync(node, ['--check', tmpFile], { stdio: 'pipe' });
    } catch (err) {
      report(`${entry.name}: inline script #${blockIndex}`, err);
    }
  }
}

// cleanup
try { fs.rmSync(tmpDir, { recursive: true, force: true }); } catch (e) {}

if (failures > 0) {
  process.stdout.write(`\n${failures} syntax failure(s).\n`);
  process.exit(1);
}
process.stdout.write('All syntax checks passed.\n');