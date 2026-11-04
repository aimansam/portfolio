"""
Generates the case-study diagrams (SVG) in assets/images/projects/.
Run from the repo root: python3 scripts/diagrams/make_diagrams.py

The SVGs animate themselves when loaded: boxes pop in one after another, arrows draw, and a red "packet"
rides each flow once. All motion sits inside a prefers-reduced-motion: no-preference block, so visitors who
asked for less motion (and any viewer that ignores CSS animation) see the finished diagram.
"""
import html

INK = '#141414'; SOFT = '#f7f7f7'; MUTED = '#5c5c5c'; ACCENT = '#d9291c'
FONT = "system-ui, -apple-system, 'Segoe UI', Roboto, Arial, sans-serif"

STYLE = f'''<style>
.pkt{{display:none}}
@media (prefers-reduced-motion: no-preference){{
  .n{{transform-box:fill-box;transform-origin:center;animation:pop .6s cubic-bezier(.22,1,.36,1) var(--d,0s) both}}
  .a{{stroke-dasharray:1;animation:draw .6s cubic-bezier(.22,1,.36,1) var(--d,0s) both}}
  .h{{animation:head .2s ease-out calc(var(--d,0s) + .4s) both}}
  .pkt{{display:block;offset-rotate:0deg;animation:ride var(--t,5s) cubic-bezier(.45,0,.55,1) var(--d,0s) both}}
}}
@keyframes pop{{from{{opacity:0;transform:translateY(12px) scale(.93)}}to{{opacity:1;transform:none}}}}
@keyframes draw{{0%{{opacity:0;stroke-dashoffset:1}}1%{{opacity:1;stroke-dashoffset:1}}100%{{opacity:1;stroke-dashoffset:0}}}}
@keyframes head{{from{{opacity:0}}to{{opacity:1}}}}
@keyframes ride{{0%{{offset-distance:0%;opacity:0}}6%{{opacity:1}}94%{{opacity:1}}100%{{offset-distance:100%;opacity:0}}}}
</style>'''

_k = 0
def D():
    """Next animation delay: each element starts a little after the previous one."""
    global _k
    v = min(0.12 + _k * 0.1, 2.6); _k += 1
    return f'{v:.2f}s'

def head(w, h, title, desc):
    global _k
    _k = 0
    return (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {w} {h}" role="img" aria-labelledby="t d" font-family="{FONT}">\n'
            f'<title id="t">{html.escape(title)}</title><desc id="d">{html.escape(desc)}</desc>\n{STYLE}\n'
            f'<defs><marker id="a" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="8" markerHeight="8" orient="auto-start-reverse"><path d="M0 0 L10 5 L0 10 z" fill="{INK}"/></marker></defs>\n'
            f'<rect width="{w}" height="{h}" fill="#ffffff"/>\n')

def g(inner, d=None):
    return f'<g class="n" style="--d:{d or D()}">\n{inner}</g>\n'

def box(x, y, w, h, lines, bold_first=True, fill=SOFT, size=15, dashed=False, d=None):
    dash = ' stroke-dasharray="7 6"' if dashed else ''
    out = f'<rect x="{x}" y="{y}" width="{w}" height="{h}" rx="10" fill="{fill}" stroke="{INK}" stroke-width="2"{dash}/>\n'
    n = len(lines); lh = size + 5; total = n * lh; y0 = y + (h - total) / 2 + size
    for i, l in enumerate(lines):
        wt = '700' if (i == 0 and bold_first) else '500'
        col = INK if (i == 0 and bold_first) else MUTED
        fs = size if i == 0 else size - 2
        out += f'<text x="{x+w/2}" y="{y0+i*lh}" text-anchor="middle" font-size="{fs}" font-weight="{wt}" fill="{col}">{html.escape(l)}</text>\n'
    return g(out, d)

def group(x, y, w, h, title):
    return g(f'<rect x="{x}" y="{y}" width="{w}" height="{h}" rx="14" fill="none" stroke="{INK}" stroke-width="1.6" stroke-dasharray="8 6"/>\n'
             f'<text x="{x+16}" y="{y+26}" font-size="13" font-weight="800" letter-spacing="1.6" fill="{MUTED}">{html.escape(title.upper())}</text>\n')

def arrow(d_, label=None, lx=0, ly=0, anchor='middle', d=None):
    dd = d or D()
    out = f'<path class="a" pathLength="1" style="--d:{dd}" d="{d_}" fill="none" stroke="{INK}" stroke-width="2"/>\n'
    out += f'<path class="h" style="--d:{dd}" d="{d_}" fill="none" stroke="none" stroke-width="2" marker-end="url(#a)"/>\n'
    if label:
        out += f'<text class="n" style="--d:{dd}" x="{lx}" y="{ly}" text-anchor="{anchor}" font-size="12.5" font-weight="600" fill="{MUTED}">{html.escape(label)}</text>\n'
    return out

def dashed_link(d_, d=None, arrowhead=False):
    mk = ' marker-end="url(#a)"' if arrowhead else ''
    return f'<path class="n" style="--d:{d or D()}" d="{d_}" stroke="{INK}" stroke-width="2" stroke-dasharray="5 4" fill="none"{mk}/>\n'

def caption(x, y, text, size=12.5, weight=600, anchor='middle', d=None, spacing=None):
    sp = f' letter-spacing="{spacing}"' if spacing else ''
    return f'<text class="n" style="--d:{d or D()}" x="{x}" y="{y}" text-anchor="{anchor}" font-size="{size}" font-weight="{weight}"{sp} fill="{MUTED}">{html.escape(text)}</text>\n'

def packet(path, delay, dur=5):
    """A small red dot that rides the flow once, after the diagram has built."""
    return (f'<g class="pkt" style="--d:{delay:.2f}s;--t:{dur}s;offset-path:path(\'{path}\')">'
            f'<circle r="10" fill="#ffffff" fill-opacity=".85"/><circle r="6.5" fill="{ACCENT}"/></g>\n')

def last_delay():
    return min(0.12 + _k * 0.1, 2.6)

def save(path, s):
    open(path, 'w').write(s + '</svg>\n')

# ---------- OxBlood architecture ----------
s = head(1000, 520, 'OxBlood architecture', 'Players and referees reach a Docker Compose stack through Traefik and the Flask portal. The FastAPI backend stores state in PostgreSQL, Redis and MinIO and controls Proxmox VE, which hosts the isolated training range. Prometheus, Alertmanager and Grafana watch the stack.')
s += group(225, 40, 540, 440, 'Docker Compose stack')
s += box(30, 205, 150, 80, ['Players and', 'referees', 'browser'], bold_first=False)
s += box(255, 95, 130, 64, ['Traefik', 'TLS proxy'])
s += arrow('M180 245 H205 V127 H255')
s += box(415, 95, 150, 64, ['Portal', 'Flask + React UI'])
s += arrow('M385 127 H415')
s += box(595, 95, 140, 64, ['API', 'FastAPI'])
s += arrow('M565 127 H595')
s += group(415, 200, 320, 130, 'State and storage')
s += box(428, 235, 112, 64, ['PostgreSQL'], size=14); s += box(548, 235, 72, 64, ['Redis'], size=14); s += box(628, 235, 92, 64, ['MinIO'], size=14)
s += arrow('M665 159 V200', 'data', 678, 184, 'start')
s += group(255, 355, 480, 105, 'Observability')
s += box(270, 390, 130, 56, ['Prometheus'], size=14); s += box(412, 390, 150, 56, ['Alertmanager'], size=14); s += box(574, 390, 146, 56, ['Grafana'], size=14)
s += box(805, 95, 165, 64, ['Proxmox VE', 'VM lifecycle'])
s += arrow('M735 127 H805', 'control', 770, 116)
s += group(790, 205, 195, 255, 'Training range')
s += box(805, 245, 165, 50, ['Red team VMs'], size=14, fill='#ffffff')
s += box(805, 305, 165, 50, ['Blue team VMs'], size=14, fill='#ffffff')
s += box(805, 365, 165, 50, ['Scenario machines'], size=14, fill='#ffffff')
s += caption(887, 432, 'isolated VLANs,') + caption(887, 449, 'clean snapshots')
s += arrow('M887 159 V205')
s += packet('M105 245 H205 V127 H887 V330', last_delay() + 0.4, 5)
save('assets/images/projects/oxblood/architecture.svg', s)

# ---------- OxBlood drill flow ----------
steps = [
 ('1', 'Create exercise', ['Pick a scenario and', 'an organization']),
 ('2', 'Set up teams', ['2, 4 or 6 teams,', 'up to 20 players']),
 ('3', 'Plan rounds', ['Sides swap: every team', 'attacks and defends once']),
 ('4', 'Prepare range', ['Clone VMs on Proxmox,', 'one copy per match']),
 ('5', 'Start a round', ['Fresh flags are planted', 'on the machines']),
 ('6', 'Play and score', ['Points decay over time;', 'first capture earns +25%']),
 ('7', 'Finish and reset', ['Reveal the scoreboard,', 'reset to clean-baseline']),
]
s = head(1000, 440, 'How an OxBlood drill runs', 'Seven steps: create the exercise, set up teams, plan rounds, prepare the range, start a round, play and score with referee adjustments, then finish and reset the range before the next round.')
W = 205; H = 104
pos = {1: (30, 40), 2: (275, 40), 3: (520, 40), 4: (765, 40), 5: (765, 220), 6: (520, 220), 7: (275, 220)}
links = {1: 'M235 92 H275', 2: 'M480 92 H520', 3: 'M725 92 H765', 4: 'M867 144 V220', 5: 'M765 272 H725', 6: 'M520 272 H480'}
for i, (n, t, ls) in enumerate(steps, 1):
    x, y = pos[i]
    inner = f'<rect x="{x}" y="{y}" width="{W}" height="{H}" rx="10" fill="{SOFT}" stroke="{INK}" stroke-width="2"/>\n'
    inner += f'<circle cx="{x+24}" cy="{y+26}" r="14" fill="{INK}"/><text x="{x+24}" y="{y+31}" text-anchor="middle" font-size="14" font-weight="800" fill="#ffffff">{n}</text>\n'
    inner += f'<text x="{x+46}" y="{y+31}" font-size="16" font-weight="800" fill="{INK}">{html.escape(t)}</text>\n'
    for j, l in enumerate(ls):
        inner += f'<text x="{x+16}" y="{y+62+j*20}" font-size="13" font-weight="500" fill="{MUTED}">{html.escape(l)}</text>\n'
    s += g(inner)
    if i in links: s += arrow(links[i])
s += box(520, 350, 205, 56, ['Referees adjust points', 'with a written reason'], bold_first=False, size=14, fill='#ffffff', dashed=True)
s += dashed_link('M622 324 V350')
s += arrow('M377 324 V420 H867 V324')
s += caption(622, 437, 'Next round: reset the range, then start again', 13, 700)
s += packet('M132 92 H867 V272 H377 V420 H867 V272', last_delay() + 0.4, 8)
save('assets/images/projects/oxblood/drill-flow.svg', s)

# ---------- Durian pipeline ----------
s = head(1000, 300, 'How Durian scans a target', 'A target URL goes to the crawler, which finds links and forms. The scanners test them for SQL injection, cross-site scripting, path traversal and sensitive files. Results go into a report. Session and cookie handling sits underneath the whole run.')
s += box(30, 70, 150, 86, ['Target URL', 'authorized only'])
s += arrow('M180 113 H235')
s += box(235, 70, 190, 86, ['Crawler', 'finds links and forms'])
s += arrow('M425 113 H480')
inner = f'<rect x="480" y="50" width="290" height="126" rx="10" fill="{SOFT}" stroke="{INK}" stroke-width="2"/>\n'
inner += f'<text x="625" y="80" text-anchor="middle" font-size="15" font-weight="800" fill="{INK}">Scanner modules</text>\n'
for i, m in enumerate(['SQL injection', 'Reflected XSS', 'Path traversal', 'Sensitive files']):
    col = i % 2; row = i // 2; bx = 494 + col * 138; by = 96 + row * 38
    inner += f'<rect x="{bx}" y="{by}" width="128" height="30" rx="6" fill="#ffffff" stroke="{INK}" stroke-width="1.5"/><text x="{bx+64}" y="{by+20}" text-anchor="middle" font-size="12.5" font-weight="700" fill="{INK}">{m}</text>\n'
s += g(inner)
s += arrow('M770 113 H825')
s += box(825, 70, 145, 86, ['Report', 'structured output'])
inner = f'<rect x="235" y="205" width="535" height="52" rx="10" fill="#ffffff" stroke="{INK}" stroke-width="2" stroke-dasharray="7 6"/>\n'
inner += f'<text x="502" y="227" text-anchor="middle" font-size="14" font-weight="800" fill="{INK}">Session and authentication handling</text><text x="502" y="246" text-anchor="middle" font-size="12.5" font-weight="500" fill="{MUTED}">cookies carry through the crawl and every check</text>\n'
s += g(inner)
s += dashed_link('M330 205 V156 M625 205 V176')
s += packet('M105 113 H898', last_delay() + 0.3, 4)
save('assets/images/projects/durian/pipeline.svg', s)

# ---------- DIVIDE CTF build and deploy ----------
s = head(800, 470, 'How the DIVIDE recipe challenge is built', 'A browser loads a static site and calls a JavaScript Pages Function on Cloudflare Pages. The function reads the flag from a Cloudflare secret. Code is pushed to GitHub, which redeploys Cloudflare Pages automatically. Locally the challenge runs with Wrangler, or with Flask in Docker for parity.')
s += box(30, 150, 140, 80, ['Player', 'browser'], bold_first=False)
s += group(230, 40, 540, 265, 'Cloudflare Pages')
s += box(255, 80, 235, 76, ['Static site', 'HTML, CSS and JavaScript', '30 pre-built recipe cards'])
s += arrow('M170 175 H200 V118 H255', 'page', 212, 108)
s += box(255, 200, 235, 76, ['Pages Function', 'JavaScript API', 'serves content by day'])
s += arrow('M200 175 V238 H255', 'API', 210, 258)
s += box(540, 200, 205, 76, ['FLAG secret', 'environment variable,', 'not stored in the repo'], fill='#ffffff', dashed=True, size=14)
s += dashed_link('M490 238 H540', arrowhead=True) + caption(515, 228, 'reads')
s += group(30, 335, 740, 115, 'Build and deploy')
s += box(50, 368, 150, 64, ['Local dev', 'Wrangler, or Flask'], size=14)
s += arrow('M200 400 H240')
s += box(240, 368, 170, 64, ['Build script', 'regenerates the HTML'], size=14)
s += arrow('M410 400 H450')
s += box(450, 368, 140, 64, ['GitHub', 'push to main'], size=14)
s += arrow('M590 400 H630')
s += box(630, 368, 125, 64, ['Auto deploy', 'Cloudflare Pages'], size=14)
s += packet('M100 190 H200 V238 H372 H642', last_delay() + 0.3, 4)
save('assets/images/projects/DIVIDE/build-and-deploy.svg', s)

# ---------- generic five-step method diagram ----------
def method(path, title, desc, steps, band_title, chips, h=330):
    s = head(1000, h, title, desc)
    W = 172; G = 22; X0 = 26; Y = 40; H = 128
    for i, (t, ls) in enumerate(steps):
        x = X0 + i * (W + G)
        inner = f'<rect x="{x}" y="{Y}" width="{W}" height="{H}" rx="10" fill="{SOFT}" stroke="{INK}" stroke-width="2"/>\n'
        inner += f'<circle cx="{x+24}" cy="{Y+28}" r="14" fill="{INK}"/><text x="{x+24}" y="{Y+33}" text-anchor="middle" font-size="14" font-weight="800" fill="#ffffff">{i+1}</text>\n'
        inner += f'<text x="{x+46}" y="{Y+33}" font-size="15.5" font-weight="800" fill="{INK}">{html.escape(t)}</text>\n'
        for j, l in enumerate(ls):
            inner += f'<text x="{x+16}" y="{Y+70+j*21}" font-size="13" font-weight="500" fill="{MUTED}">{html.escape(l)}</text>\n'
        s += g(inner)
        if i < len(steps) - 1: s += arrow(f'M{x+W} {Y+H/2} H{x+W+G}')
    by = Y + H + 42
    s += group(X0, by, 948, h - by - 24, band_title)
    n = len(chips); cw = (948 - 32 - (n - 1) * 14) / n
    for k, c in enumerate(chips):
        cx = X0 + 16 + k * (cw + 14)
        s += g(f'<rect x="{cx}" y="{by+40}" width="{cw}" height="38" rx="8" fill="#ffffff" stroke="{INK}" stroke-width="1.6"/><text x="{cx+cw/2}" y="{by+64}" text-anchor="middle" font-size="13.5" font-weight="700" fill="{INK}">{html.escape(c)}</text>\n')
    s += packet(f'M{X0+W/2} {Y+H/2} H{X0+4*(W+G)+W/2}', last_delay() + 0.2, 4)
    save(path, s)

method('assets/images/projects/bad-usb-lab/payload-workflow.svg', 'Bad USB payload workflow',
 'Five steps: plan the payload, check the environment, inject keystrokes with tuned delays, observe what works and fails, then review the host indicators. Defender controls underneath: device control policy, application allow-listing, endpoint monitoring and user awareness.',
 [('Plan payload', ['Shell, PowerShell or', 'staged actions']), ('Check setup', ['User session, window', 'focus and language']),
  ('Inject keys', ['Delays tuned so the', 'payload runs reliably']), ('Observe', ['What works, and what', 'fails under controls']),
  ('Indicators', ['Host events defenders', 'should watch for'])],
 'Defender controls that interrupt it', ['Device control policy', 'Application allow-listing', 'Endpoint monitoring', 'User awareness'])

method('assets/images/projects/wifi-audit-lab/audit-workflow.svg', 'Wireless audit workflow',
 'Five steps: reconnaissance of nearby networks, packet capture and inspection, analysis of misconfigurations and encryption posture, simulation of rogue access points, deauthentication and credential capture in a safe audit context, then a report that pairs findings with remediation. Remediation themes: encryption, client isolation, SSID trust, monitoring and user training.',
 [('Recon', ['Discover nearby', 'networks and clients']), ('Capture', ['Packet capture and', 'inspection']),
  ('Analyze', ['Misconfigurations and', 'encryption posture']), ('Simulate', ['Rogue AP, deauth,', 'credential capture']),
  ('Report', ['Findings paired with', 'remediation steps'])],
 'What the report recommends', ['Encryption', 'Client isolation', 'SSID trust', 'Monitoring', 'User training'])

# ---------- home lab roles and loop ----------
s = head(1000, 500, 'Enterprise home lab: roles and the test-and-detect loop', 'Attacker systems test a segmented enterprise network made of a domain controller, user workstations and Linux servers. Logs forward to logging and monitoring nodes with SIEM visibility. A loop of five steps improves detections: build the environment, introduce a vulnerable path, test exploitation, observe telemetry, refine detections.')
s += box(30, 95, 160, 90, ['Attacker', 'systems'], bold_first=False, size=16)
s += arrow('M190 140 H250', 'attacks', 220, 128)
s += group(250, 40, 420, 200, 'Segmented enterprise network')
s += box(270, 80, 125, 70, ['Domain', 'controller'], size=14)
s += box(405, 80, 125, 70, ['User', 'workstations'], size=14)
s += box(540, 80, 115, 70, ['Linux', 'servers'], size=14)
s += caption(460, 205, 'network separation imitates trust boundaries')
s += arrow('M670 140 H730', 'logs', 700, 128)
s += group(730, 40, 240, 200, 'Monitoring')
s += box(750, 80, 200, 56, ['Log forwarding'], size=14, fill='#ffffff')
s += box(750, 150, 200, 56, ['SIEM visibility'], size=14, fill='#ffffff')
s += caption(30, 292, 'THE LOOP', 13, 800, 'start', spacing='1.6')
loop = [('Build', 'the environment'), ('Introduce', 'a vulnerable path'), ('Test', 'exploitation'), ('Observe', 'telemetry'), ('Refine', 'detections')]
lw = 172; lg = 22
for i, (a, b) in enumerate(loop):
    x = 26 + i * (lw + lg)
    s += box(x, 308, lw, 70, [a, b])
    if i < 4: s += arrow(f'M{x+lw} 343 H{x+lw+lg}')
s += arrow('M898 378 V430 H112 V378')
s += caption(505, 452, 'Repeat: every cycle improves detection coverage for the exact techniques exercised', 13, 700)
s += packet('M112 343 H898 V430 H112 V343', last_delay() + 0.3, 7)
save('assets/images/projects/enterprise-homelab/lab-roles-and-loop.svg', s)
print('diagrams written')
