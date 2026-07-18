const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const FILE = 'file://' + path.resolve(__dirname, '..', 'index.html');
const SHOTS = path.resolve(__dirname, 'shots');
fs.mkdirSync(SHOTS, { recursive: true });

const results = [];
const t = (name, pass, detail = '') => {
  results.push({ name, pass, detail });
  console.log((pass ? 'PASS' : 'FAIL') + '  ' + name + (pass ? '' : '   [' + detail + ']'));
};

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  const pageErrors = [];
  page.on('pageerror', e => pageErrors.push(e.message));
  page.on('console', m => { if (m.type() === 'error') pageErrors.push(m.text()); });

  // Emulate sandboxed-viewer behavior: count any anchor activation from load onward.
  // Sandboxed artifact viewers intercept these at document capture phase, upstream of
  // target-level preventDefault — so the embedded suite must produce exactly zero.
  await page.addInitScript(() => {
    window.__anchorActivations = 0;
    document.addEventListener('click', e => {
      if (e.target && e.target.closest && e.target.closest('a')) window.__anchorActivations++;
    }, true);
  });
  await page.goto(FILE);
  await page.waitForTimeout(2500); // let simulation settle + auto-tests run

  // P15: self-test suite must not leak scroll position or URL hash into the user's first view.
  // Measured BEFORE any harness interaction — this is the state a reader actually lands in.
  const leak = await page.evaluate(() => ({ y: window.scrollY, h: location.hash }));
  t('P15 no scroll/hash leak after load (suite side-effect guard)', leak.y < 50 && leak.h === '', JSON.stringify(leak));

  // P18: embedded suite must not activate any <a> during auto-run (sandbox popup guard)
  const anchorHits = await page.evaluate(() => window.__anchorActivations);
  t('P18 zero anchor activations during on-load suite (sandbox interceptor guard)', anchorHits === 0, 'activations=' + anchorHits);

  // P01: no runtime errors in a real browser
  t('P01 no page errors in Chromium', pageErrors.length === 0, pageErrors.join(' | '));

  // P02: embedded suite passes in a real browser
  const suite = await page.evaluate(() => window.__runTests());
  t('P02 embedded suite passes in Chromium', suite.passed === suite.total, suite.passed + '/' + suite.total);

  // P12/P13 must run BEFORE the harness interacts: they audit the state the USER first sees
  const st0 = await page.evaluate(() => window.__state());
  t('P12 suite is hermetic: panel back to hint, timeline mode, filter off', st0.panelIsHint && st0.mode === 'timeline' && !st0.rctOnly, JSON.stringify(st0));
  t('P13 timeline converged: mean |x - x(date)| < 45px', st0.layoutError < 45, 'err=' + (st0.layoutError||NaN).toFixed(1) + 'px');

  // P03: initial render — nodes visible with real pixel positions
  const nodeBoxes = await page.$$eval('#graph g.node', els => els.map(e => e.getBoundingClientRect()).filter(b => b.width > 0 && b.height > 0).length);
  t('P03 all 26 nodes have nonzero rendered boxes', nodeBoxes === 26, 'visible=' + nodeBoxes);
  await page.screenshot({ path: SHOTS + '/01-initial-timeline.png', fullPage: false });

  // P04: nodes are chronologically ordered on screen (timeline layout is real, not just forces claimed)
  const order = await page.evaluate(() => {
    const byId = {};
    document.querySelectorAll('#graph g.node').forEach((el, i) => {
      const m = /translate\(([-\d.]+),/.exec(el.getAttribute('transform') || '');
      byId[el.querySelector('text').textContent + i] = m ? +m[1] : NaN;
    });
    // compare two far-apart studies via the exposed data instead
    return null;
  });
  const xCheck = await page.evaluate(() => {
    const s = window.__runTests; // ensure page context alive
    const nodes = [...document.querySelectorAll('#graph g.node')];
    const getX = el => +(/translate\(([-\d.]+),/.exec(el.getAttribute('transform'))||[])[1];
    // first data-bound node is peng2023 (2023-02), yotzov2026 is index 17 (2026-02)
    return { early: getX(nodes[0]), late: getX(nodes[17]) };
  });
  t('P04 timeline: 2023 node left of 2026 node', xCheck.early < xCheck.late, JSON.stringify(xCheck));

  // P05: click a node -> panel populates (real hit-testing, real event path)
  await page.locator('#graph g.node').nth(8).click(); // metr2025
  const panelHas = await page.locator('#panel').innerText();
  t('P05 click populates panel with authors+caveats', /Becker, Rush/.test(panelHas) && /CAVEATS/i.test(panelHas), panelHas.slice(0, 80));
  await page.screenshot({ path: SHOTS + '/02-node-clicked-panel.png' });

  // P14: selection visibly highlights on the graph and background click clears it
  const selState = await page.evaluate(() => window.__state());
  const dimCount = await page.$$eval('#graph g.node', els => els.filter(e => getComputedStyle(e).opacity === '0.3').length);
  const boldEdges = await page.$$eval('#graph > g:not(.axis):not(.lanes) > line', els => els.filter(e => getComputedStyle(e).opacity === '0.95').length);
  await page.locator('#graph').click({ position: { x: 30, y: 20 } });
  await page.waitForTimeout(200);
  const clearedState = await page.evaluate(() => window.__state());
  t('P14 selection dims non-neighbors, bolds incident edges, clears on bg click',
    selState.selectedId !== null && dimCount > 0 && boldEdges > 0 && clearedState.selectedId === null,
    JSON.stringify({sel:selState.selectedId, dimCount, boldEdges, cleared:clearedState.selectedId}));

  // P06: hover -> tooltip visible with correct text
  await page.locator('#graph g.node').nth(6).hover(); // tonerrodgers2024
  await page.waitForTimeout(250);
  const tipState = await page.evaluate(() => {
    const el = document.getElementById('tip');
    return { op: getComputedStyle(el).opacity, txt: el.textContent };
  });
  t('P06 tooltip visible on hover with study title', tipState.op === '1' && /Scientific Discovery/.test(tipState.txt), JSON.stringify(tipState));
  await page.screenshot({ path: SHOTS + '/03-tooltip-hover.png' });

  // P07: cluster layout -> axis disappears, nodes move
  const beforeXs = await page.$$eval('#graph g.node', els => els.slice(0,5).map(e => e.getAttribute('transform')));
  await page.click('#btnCluster');
  await page.waitForTimeout(1800);
  const ticksAfter = await page.$$eval('#graph g.axis .tick', els => els.length);
  const afterXs = await page.$$eval('#graph g.node', els => els.slice(0,5).map(e => e.getAttribute('transform')));
  t('P07 cluster mode: axis cleared & nodes repositioned', ticksAfter === 0 && JSON.stringify(beforeXs) !== JSON.stringify(afterXs), 'ticks=' + ticksAfter);
  await page.screenshot({ path: SHOTS + '/04-cluster-layout.png' });

  // P08: RCT filter dims 14 non-RCT nodes visually (computed opacity)
  await page.click('#btnRCT');
  await page.waitForTimeout(300);
  const dimmed = await page.$$eval('#graph g.node', els => els.filter(e => getComputedStyle(e).opacity === '0.12').length);
  t('P08 RCT filter dims exactly 17 nodes (computed style)', dimmed === 17, 'dimmed=' + dimmed);
  await page.screenshot({ path: SHOTS + '/05-rct-filter.png' });
  await page.click('#btnRCT'); // restore
  await page.click('#btnTimeline');
  await page.waitForTimeout(1200);

  // P09: appendix charts render with visible geometry
  await page.locator('#tailhead').scrollIntoViewIfNeeded();
  await page.waitForTimeout(300);
  const chartGeom = await page.evaluate(() => ({
    dens: document.querySelectorAll('#chart-dist svg path.densline').length,
    pts: document.querySelectorAll('#chart-loop svg circle.lp').length,
    segs: [...document.querySelectorAll('#chart-comp svg rect.seg')].map(r => r.getBoundingClientRect().width > 5).every(Boolean)
  }));
  t('P09 tail charts render visible geometry', chartGeom.dens === 1 && chartGeom.pts === 4 && chartGeom.segs, JSON.stringify(chartGeom));
  await page.screenshot({ path: SHOTS + '/06-tail-charts.png' });

  // P10: self-test badge shows PASS in the live page
  const badge = await page.locator('#teststatus').innerText();
  t('P10 on-page badge reports PASS', /PASS/.test(badge), badge);
  await page.locator('#selftest details').evaluate(d => d.open = true);
  await page.locator('#selftest').scrollIntoViewIfNeeded();
  await page.screenshot({ path: SHOTS + '/07-selftest-panel.png' });

  // P11: screenshots are non-trivial (blank-page guard)
  const sizes = fs.readdirSync(SHOTS).map(f => [f, fs.statSync(path.join(SHOTS, f)).size]);
  t('P11 all screenshots > 25KB (non-blank)', sizes.every(([, s]) => s > 25000), JSON.stringify(sizes));

  // P17: badge hover shows sourced tooltip; Escape dismisses
  const firstBadge = page.locator('.ctag[data-refs*="node:"]').first();
  await firstBadge.scrollIntoViewIfNeeded();
  await firstBadge.hover();
  await page.waitForTimeout(250);
  const btip = await page.evaluate(() => {
    const tip = document.getElementById('ctip');
    return { visible: tip && tip.style.display === 'block', links: tip ? tip.querySelectorAll('.refs a').length : 0, hasNote: tip ? tip.querySelector('.note').textContent.length > 10 : false };
  });
  await page.keyboard.press('Escape');
  await page.waitForTimeout(150);
  const btipGone = await page.evaluate(() => document.getElementById('ctip').style.display === 'none');
  t('P17 badge hover opens sourced tooltip; Escape closes', btip.visible && btip.links >= 1 && btip.hasNote && btipGone, JSON.stringify(btip) + ' gone=' + btipGone);
  await page.screenshot({ path: SHOTS + '/27-badge-tooltip.png' });

  // P19 (B1): keyboard path — focus a node, Enter selects it and fills the panel
  await page.evaluate(() => document.querySelector('#graph g.node').focus());
  const focusOk = await page.evaluate(() => document.activeElement === document.querySelector('#graph g.node'));
  await page.keyboard.press('Enter');
  await page.waitForTimeout(250);
  const kbdState = await page.evaluate(() => window.__state());
  const kbdPanel = await page.locator('#panel').innerText();
  t('P19 keyboard: node focus + Enter selects and fills panel', focusOk && kbdState.selectedId === 'peng2023' && /Peng, Kalliamvakou/.test(kbdPanel), 'focus=' + focusOk + ' sel=' + kbdState.selectedId);
  await page.screenshot({ path: SHOTS + '/28-keyboard-selected.png' });

  // P21 (B3): edge-profile line present and shaped correctly
  const profTxt = await page.evaluate(() => (document.querySelector('#panel .edgeprofile') || {}).textContent || '');
  t('P21 panel shows edge profile (corroborating/tension/building)', /\d+ corroborating · \d+ in tension · \d+ building/.test(profTxt), profTxt);

  // P23 (B5): computed quality score with declared weights, formula expandable
  const qcRow = await page.evaluate(() => {
    const h = document.getElementById('panel').innerHTML;
    const det = document.querySelector('#panel details.qcalc');
    if (det) det.open = true;
    const body = document.querySelector('#panel .qcalc-body');
    return { has: h.includes('Computed score'), formula: body ? body.textContent.includes('0.45×rigor') : false };
  });
  t('P23 computed quality score with declared weights in panel', qcRow.has && qcRow.formula, JSON.stringify(qcRow));
  await page.locator('#graph').click({ position: { x: 30, y: 20 } });
  await page.waitForTimeout(150);

  // P22 (B4): CSV and BibTeX export via real user clicks -> real downloads
  const dl1p = page.waitForEvent('download');
  await page.click('#btnCSV');
  const dl1 = await dl1p;
  const csvTxt = fs.readFileSync(await dl1.path(), 'utf8');
  const csvOk = dl1.suggestedFilename() === 'evidence-graph-studies.csv' && csvTxt.split('\n').length === 27 && csvTxt.startsWith('id,title');
  const dl2p = page.waitForEvent('download');
  await page.click('#btnBib');
  const dl2 = await dl2p;
  const bibTxt = fs.readFileSync(await dl2.path(), 'utf8');
  const bibOk = dl2.suggestedFilename() === 'evidence-graph-studies.bib' && (bibTxt.match(/@\w+\{/g) || []).length === 26;
  t('P22 export: CSV (27 lines) and BibTeX (26 entries) download via click', csvOk && bibOk, 'csv=' + csvOk + ' bib=' + bibOk);

  // P20 (B2): print emulation — chrome hidden by print CSS; beforeprint opens sections; afterprint restores
  await page.evaluate(() => { document.querySelector('#selftest details').open = false; window.dispatchEvent(new Event('beforeprint')); });
  const printOpen = await page.evaluate(() => [...document.querySelectorAll('details.sect')].every(d => d.open) && document.querySelector('#selftest details').open === true);
  await page.emulateMedia({ media: 'print' });
  const printHidden = await page.evaluate(() => {
    const gone = sel => { const el = document.querySelector(sel); return !el || getComputedStyle(el).display === 'none'; };
    return gone('.controls') && gone('nav.toc') && gone('#selftest') && gone('#panel');
  });
  await page.screenshot({ path: SHOTS + '/29-print-emulation.png', fullPage: false });
  await page.emulateMedia({ media: 'screen' });
  await page.evaluate(() => window.dispatchEvent(new Event('afterprint')));
  const printRestored = await page.evaluate(() => document.querySelector('#selftest details').open === false);
  t('P20 print: CSS hides chrome; beforeprint opens sections; afterprint restores', printOpen && printHidden && printRestored, 'open=' + printOpen + ' hidden=' + printHidden + ' restored=' + printRestored);

  // P16: no horizontal overflow at mobile width (fresh page, no desktop state carryover)
  const mp = await browser.newPage({ viewport: { width: 380, height: 800 } });
  await mp.goto(FILE); await mp.waitForTimeout(2200);
  const ox = await mp.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  const mleak = await mp.evaluate(() => ({ y: window.scrollY, h: location.hash }));
  t('P16 mobile 380px: no horizontal overflow, no scroll/hash leak', ox <= 1 && mleak.y < 50 && mleak.h === '', 'overflowX=' + ox + ' ' + JSON.stringify(mleak));
  await mp.close();

  await browser.close();
  const passed = results.filter(r => r.pass).length;
  console.log('----');
  console.log(`PLAYWRIGHT: ${passed}/${results.length}`);
  process.exit(passed === results.length ? 0 : 1);
})().catch(e => { console.error('HARNESS ERROR:', e); process.exit(1); });
