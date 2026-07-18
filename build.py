#!/usr/bin/env python3
"""Build index.html (the self-contained artifact) from src/template.html + pinned d3.
The standalone file is the only deliverable; this script exists so the repo can
reproduce it deterministically. Verify with:
    node verify/verify.js && node verify/verify-visual.js
"""
import hashlib
import os

HERE = os.path.dirname(os.path.abspath(__file__))
TEMPLATE = os.path.join(HERE, "src", "template.html")
D3 = os.path.join(HERE, "src", "d3.min.js")
OUT = os.path.join(HERE, "index.html")

tpl = open(TEMPLATE, encoding="utf-8").read()
d3 = open(D3, encoding="utf-8").read()
assert "__D3_INLINE__" in tpl, "template missing splice marker"
out = tpl.replace("__D3_INLINE__", d3, 1)
open(OUT, "w", encoding="utf-8").write(out)
print(f"built {os.path.basename(OUT)}: {len(out)} chars, sha256 {hashlib.sha256(out.encode()).hexdigest()[:16]}…")
