/**
 * Changes the public contact email everywhere in one go (for example to hello@aimansam.my
 * once Cloudflare Email Routing forwards it to your inbox).
 *
 *   node scripts/set-email.js hello@aimansam.my            # apply
 *   node scripts/set-email.js hello@aimansam.my --dry-run  # list the files that would change
 *
 * The current address is read from content/site/navigation.json (the header button).
 * Remember the resume PDF is a separate file and has to be updated by hand.
 */
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const ROOT = path.join(__dirname, '..');
const args = process.argv.slice(2);
const dryRun = args.includes('--dry-run');
const next = args.find((a) => !a.startsWith('--'));

if (!next || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(next)) {
  console.error('Usage: node scripts/set-email.js new@address.com [--dry-run]');
  process.exit(1);
}

const nav = JSON.parse(fs.readFileSync(path.join(ROOT, 'content/site/navigation.json'), 'utf8'));
const current = String(nav.navigation.cta.href).replace(/^mailto:/, '');
if (current === next) {
  console.log(`Already using ${next}.`);
  process.exit(0);
}

const files = execFileSync('git', ['ls-files'], { cwd: ROOT, encoding: 'utf8' })
  .split('\n')
  .filter((f) => /\.(html|json|js|md|yml|yaml|txt|svg)$/.test(f) && f !== 'package-lock.json');

let changed = 0;
files.forEach((file) => {
  const full = path.join(ROOT, file);
  const text = fs.readFileSync(full, 'utf8');
  if (!text.includes(current)) return;
  changed += 1;
  console.log(`${dryRun ? 'would change' : 'changed'}  ${file}`);
  if (!dryRun) fs.writeFileSync(full, text.split(current).join(next));
});

console.log(`\n${current} -> ${next} in ${changed} file(s)${dryRun ? ' (dry run, nothing written)' : ''}.`);
if (!dryRun) console.log('Next: npm run build, commit, push. Then update the email inside Resume.pdf.');
