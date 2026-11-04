/**
 * Saves the TryHackMe and Hack The Box profile badges next to the site, so visitors load them from
 * here instead of from two other companies (one of them sets a tracking cookie).
 *
 * It only runs when FETCH_BADGES=1 (the GitHub workflow and the Docker build set it), so a local
 * `npm run build` never touches the committed snapshot. If a download fails, the snapshot stays.
 */
const fs = require('fs');
const path = require('path');

const BADGES = [
  { file: 'assets/images/badges/tryhackme.png', url: 'https://tryhackme-badges.s3.amazonaws.com/zx10r.png' },
  { file: 'assets/images/badges/hackthebox.png', url: 'https://www.hackthebox.com/badge/image/2188751' }
];

async function main() {
  if (process.env.FETCH_BADGES !== '1') return;
  for (const { file, url } of BADGES) {
    try {
      const response = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0 (portfolio build)' }, signal: AbortSignal.timeout(15000) });
      const type = response.headers.get('content-type') || '';
      const bytes = Buffer.from(await response.arrayBuffer());
      if (!response.ok || !type.startsWith('image/') || bytes.length < 1000) throw new Error(`unexpected response (${response.status}, ${type}, ${bytes.length} bytes)`);
      fs.writeFileSync(path.join(__dirname, '..', file), bytes);
      console.log(`Refreshed ${file}`);
    } catch (error) {
      console.warn(`Kept the existing ${file}: ${error.message}`);
    }
  }
}

main();
