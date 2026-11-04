"""
One-off: renders the favicon.svg monogram to the PNG sizes the site uses.
Usage: python3 scripts/logo/make_icons.py
"""
import os
from playwright.sync_api import sync_playwright

ROOT = os.path.join(os.path.dirname(__file__), '..', '..')
SVG = open(os.path.join(ROOT, 'assets/images/zx10r/favicon.svg')).read()
SIZES = {'favicon-64.png': 64, 'apple-touch-icon.png': 180, 'logo-512.png': 512}

with sync_playwright() as p:
    b = p.chromium.launch()
    for name, size in SIZES.items():
        pg = b.new_page(viewport={'width': size, 'height': size})
        sized = SVG.replace('<svg ', '<svg width="%d" height="%d" ' % (size, size))
        pg.set_content('<body style="margin:0;background:transparent">' + sized + '</body>')
        out = os.path.join(ROOT, 'assets/images/zx10r', name)
        pg.screenshot(path=out, omit_background=True)
        print('wrote', name, os.path.getsize(out))
