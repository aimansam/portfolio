"""
One-off generator for the project cover images (not part of `npm run build`).
Renders a flat title card per project with Playwright and saves WebP files next to the case study.
Usage: python3 scripts/covers/make_covers.py
"""
import os, io
from playwright.sync_api import sync_playwright
from PIL import Image

ROOT = os.path.join(os.path.dirname(__file__), '..', '..')
INK, ACCENT, SOFT = '#141414', '#d9291c', '#f7f7f7'

def motif_ox():
    cells = ''
    for r in range(3):
        for c in range(3):
            x, y = 20 + c * 118, 20 + r * 118
            fill = ACCENT if (r, c) == (1, 1) else (INK if (r, c) in [(0, 2), (2, 0)] else 'none')
            cells += f'<rect x="{x}" y="{y}" width="92" height="92" rx="12" fill="{fill}" stroke="{INK}" stroke-width="6"/>'
    return f'<svg viewBox="0 0 380 380" width="380" height="380"><rect x="4" y="4" width="372" height="372" rx="22" fill="none" stroke="{INK}" stroke-width="4" stroke-dasharray="14 10"/>{cells}</svg>'

def motif_durian():
    nodes = [(190, 50), (80, 160), (190, 160), (300, 160), (40, 290), (120, 290), (160, 290), (250, 290), (340, 290)]
    edges = [(0, 1), (0, 2), (0, 3), (1, 4), (1, 5), (2, 6), (3, 7), (3, 8)]
    s = ''.join(f'<line x1="{nodes[a][0]}" y1="{nodes[a][1]}" x2="{nodes[b][0]}" y2="{nodes[b][1]}" stroke="{INK}" stroke-width="6"/>' for a, b in edges)
    for i, (x, y) in enumerate(nodes):
        fill = ACCENT if i == 7 else ('#ffffff' if i > 3 else INK)
        r = 26 if i == 0 else (20 if i < 4 else 15)
        s += f'<circle cx="{x}" cy="{y}" r="{r}" fill="{fill}" stroke="{INK}" stroke-width="6"/>'
    return f'<svg viewBox="0 0 380 340" width="380" height="340">{s}</svg>'

def motif_jebat():
    s = f'<circle cx="190" cy="190" r="170" fill="none" stroke="{INK}" stroke-width="5" stroke-dasharray="4 14"/>'
    s += f'<circle cx="190" cy="190" r="120" fill="none" stroke="{INK}" stroke-width="6"/>'
    s += f'<circle cx="190" cy="190" r="70" fill="none" stroke="{INK}" stroke-width="6"/>'
    s += f'<path d="M190 70 A120 120 0 0 1 310 190" fill="none" stroke="{ACCENT}" stroke-width="14" stroke-linecap="round"/>'
    s += f'<circle cx="190" cy="190" r="22" fill="{INK}"/><circle cx="310" cy="190" r="14" fill="{ACCENT}"/>'
    return f'<svg viewBox="0 0 380 380" width="380" height="380">{s}</svg>'

COVERS = [
    dict(path='assets/images/projects/oxblood/cover.webp', kicker='Infrastructure / Cyber range', title='OxBlood', sub='Cyber drill platform', chips=['Proxmox', 'Docker', 'Grafana'], motif=motif_ox()),
    dict(path='assets/images/projects/durian/cover.webp', kicker='Web security / Python', title='Durian', sub='Web vulnerability scanner', chips=['Crawler', 'SQLi', 'XSS', 'Reports'], motif=motif_durian()),
    dict(path='assets/images/projects/jebat/cover.webp', kicker='Authorized research', title='Jebat', sub='C2 agent detection study', chips=['Python', 'Telemetry', 'Threat modeling'], motif=motif_jebat()),
]

def page(c):
    chips = ''.join(f'<span class="chip">{x}</span>' for x in c['chips'])
    return f'''<!doctype html><html><head><meta charset="utf-8"><style>
*{{box-sizing:border-box}} body{{margin:0;width:1200px;height:742px;background:{SOFT};font-family:"Liberation Sans",Arial,Helvetica,sans-serif;color:{INK};position:relative;overflow:hidden}}
.frame{{position:absolute;inset:28px;border:6px solid {INK};border-radius:28px}}
.kicker{{position:absolute;left:84px;top:84px;font-size:26px;font-weight:700;letter-spacing:.18em;text-transform:uppercase;color:#5c5c5c}}
.title{{position:absolute;left:80px;top:150px;font-size:150px;font-weight:700;letter-spacing:-.03em;line-height:1}}
.sub{{position:absolute;left:86px;top:330px;font-size:46px;font-weight:700;color:#444}}
.chips{{position:absolute;left:84px;bottom:92px;display:flex;gap:16px}}
.chip{{font-size:28px;font-weight:700;padding:10px 22px;border:4px solid {INK};border-radius:10px;background:#fff}}
.motif{{position:absolute;right:84px;top:50%;transform:translateY(-50%) scale(.84);transform-origin:right center}}
.dot{{position:absolute;left:84px;top:132px;width:70px;height:8px;background:{ACCENT}}}
</style></head><body><div class="frame"></div><div class="kicker">{c['kicker']}</div><div class="dot"></div>
<div class="title">{c['title']}</div><div class="sub">{c['sub']}</div><div class="chips">{chips}</div><div class="motif">{c['motif']}</div></body></html>'''

with sync_playwright() as p:
    b = p.chromium.launch(); pg = b.new_page(viewport={'width': 1200, 'height': 742})
    for c in COVERS:
        pg.set_content(page(c)); pg.wait_for_timeout(200)
        png = pg.screenshot()
        out = os.path.join(ROOT, c['path'])
        Image.open(io.BytesIO(png)).convert('RGB').save(out, quality=86, method=6)
        print('wrote', c['path'], os.path.getsize(out))
