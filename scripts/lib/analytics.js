/**
 * Cloudflare Web Analytics (free, no cookies). Each site has its own token, set in
 * content/site/sites.json under analytics.cloudflareWebAnalytics. With no token nothing is added.
 */
const fs = require('fs');
const path = require('path');

const sites = JSON.parse(fs.readFileSync(path.join(__dirname, '../../content/site/sites.json'), 'utf8'));
const tokens = sites.analytics?.cloudflareWebAnalytics || {};

// Returns the beacon <script> for "portfolio", "blog" or "card", or '' when no token is set.
const beacon = (site) => {
  const token = String(tokens[site] || '').trim();
  if (!token) return '';
  return `<script defer src="https://static.cloudflareinsights.com/beacon.min.js" data-cf-beacon='{"token": "${token.replace(/[^a-zA-Z0-9]/g, '')}"}'></script>`;
};

// Adds the beacon just before </body>, once.
const withBeacon = (html, site) => {
  const tag = beacon(site);
  if (!tag || html.includes('static.cloudflareinsights.com')) return html;
  return html.replace('</body>', `    ${tag}\n  </body>`);
};

module.exports = { beacon, withBeacon };
