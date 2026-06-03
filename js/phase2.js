// ═══════════════════════════════════════════════════
// PHASE 2 — COT upload, verification & report export
// ═══════════════════════════════════════════════════

// ── COT document loading ──

async function loadCOT(input) {
  const file = input.files[0]; if (!file) return;
  document.getElementById('ub4txt').innerHTML = '⏳ <strong>Reading…</strong>';
  try {
    cotFile = file.name;
    cotText = file.name.toLowerCase().endsWith('.pdf')
      ? await parsePDF(file)
      : await parseDOCX(file);
    const ub = document.getElementById('ub4');
    ub.classList.add('ok');
    document.getElementById('ub4txt').innerHTML =
      '✅ <strong>' + esc(file.name) + '</strong><br><small>Parsed OK</small>';
    checkP2Ready();
  } catch(err) {
    document.getElementById('ub4txt').innerHTML =
      '<strong>Click to upload</strong> received COT<br><small>.docx or .pdf from Legals</small>';
    alert('Error reading COT: ' + err.message);
  }
}

async function parseDOCX(file) {
  const ab  = await file.arrayBuffer();
  const zip = await JSZip.loadAsync(ab);
  const xml = await zip.file('word/document.xml').async('string');
  return xml
    .replace(/<w:br[^>]*\/>/g, '\n').replace(/<\/w:p>/g, '\n')
    .replace(/<\/w:tr>/g, '\n').replace(/<\/w:tc>/g, '\t')
    .replace(/<[^>]+>/g, '')
    .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"')
    .replace(/&#x201C;/g, '"').replace(/&#x201D;/g, '"').replace(/&#x2019;/g, "'").replace(/&#xA0;/g, ' ')
    .replace(/[ \t]+/g, ' ').replace(/\n[ \t]+/g, '\n').replace(/\n{3,}/g, '\n\n').trim();
}

async function parsePDF(file) {
  if (typeof pdfjsLib === 'undefined') throw new Error('PDF.js not loaded');
  pdfjsLib.GlobalWorkerOptions.workerSrc =
    'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
  const ab  = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({data: ab}).promise;
  let out = '';
  for (let pg = 1; pg <= pdf.numPages; pg++) {
    const page    = await pdf.getPage(pg);
    const content = await page.getTextContent();
    const items   = content.items.slice().sort((a, b) => {
      const dy = Math.round(b.transform[5]) - Math.round(a.transform[5]);
      return dy !== 0 ? dy : a.transform[4] - b.transform[4];
    });
    let lastY = null, pageText = '';
    for (const item of items) {
      const y = Math.round(item.transform[5]);
      if (lastY !== null && Math.abs(y - lastY) > 5) pageText += '\n';
      pageText += item.str + ' ';
      lastY = y;
    }
    out += pageText.trim() + '\n\n';
  }
  return out.replace(/[ \t]+/g, ' ').replace(/\n{3,}/g, '\n\n').trim();
}

// ── Verification ──

function runVerify() {
  const p = selProp; if (!p || !cotText) return;
  const cc    = CC[p.la];
  const cf    = cc ? cc.full : p.la;
  const rv    = parseFloat(p.rent) || 0;
  const chks  = [];
  const nm    = s => String(s).toLowerCase().replace(/[\n\r]+/g, ' ').replace(/[,.’“”]/g, '').replace(/\s+/g, ' ').trim();
  const flat  = cotText.replace(/\n/g, ' ').replace(/\s+/g, ' ');
  const IH_VAR = /IH\s+MTR\s+VII\s+(DAC|Limited|Ltd\.?)/i;

  // 1. Client name — header
  const clientOk  = IH_VAR.test(cotText);
  const clientDAC = /IH\s+MTR\s+VII\s+DAC/i.test(cotText);
  const clientRaw = (flat.match(/Our\s+client[:\s]+(.{5,80}?)(?:\s{2,}|Addressee)/i) || [])[1] || '(not found)';
  chks.push({
    lbl: 'Client name — header',
    st:  !clientOk ? 'r' : !clientDAC ? 'a' : 'g',
    exp: 'IH MTR VII DAC (the "Lessor")',
    fnd: clientRaw.trim().substring(0, 100),
    note: !clientOk ? 'Client name not found.' : !clientDAC ? '⚠ Found "IH MTR VII Limited" — should be "IH MTR VII DAC".' : null
  });

  // 2. Client name — Third Schedule
  const th3  = cotText.match(/THIRD SCHEDULE[\s\S]*/i)?.[0] || '';
  const th3f = th3.replace(/\n/g, ' ').replace(/\s+/g, ' ');
  const llRaw = (th3f.match(/Landlord\s*[\/|]?\s*Lessor\s+(.{3,80}?)(?:\s{3,}|Tenant|$)/i) || [])[1] || '(not found)';
  const llDAC = /IH\s+MTR\s+VII\s+DAC/i.test(llRaw);
  const llVar = IH_VAR.test(llRaw);
  chks.push({
    lbl: 'Client name — Third Schedule',
    st:  !llVar ? 'r' : !llDAC ? 'a' : 'g',
    exp: 'IH MTR VII DAC',
    fnd: llRaw.trim().substring(0, 80),
    note: !llVar ? 'Not found in Third Schedule.' : !llDAC ? '⚠ Shows Limited — should be DAC.' : null
  });

  // 3. Addressee — Council + Address
  const addRaw  = (flat.match(/Addressee[:\s]+(.{10,250}?)(?:\s{3,}|Definitions|Background|1\.\s)/i) || [])[1] || '(not found)';
  const expFull = cc ? cf + ' , ' + cc.addr : cf;
  const expEir  = cc ? cc.eir.replace(/\s/g, '').toLowerCase() : '';
  const ccOk    = nm(addRaw).includes(nm(cf).substring(0, 12));
  const eirOk   = expEir ? nm(addRaw).replace(/\s/g, '').includes(expEir) : true;
  const stOk    = cc ? nm(addRaw).includes(nm(cc.addr.split(',')[0])) : true;
  chks.push({
    lbl: 'Addressee — Council + Address',
    st:  !ccOk ? 'r' : (eirOk && stOk) ? 'g' : 'a',
    exp: expFull,
    fnd: addRaw.substring(0, 180),
    note: !ccOk ? 'Council name mismatch.' : !eirOk ? '⚠ Eircode (' + cc.eir + ') not found.' : !stOk ? '⚠ Address differs from official list.' : null
  });

  // 4. Property address
  const fs   = cotText.match(/FIRST SCHEDULE[\s\S]{0,800}/i)?.[0] || cotText;
  const fsf  = fs.replace(/\n/g, ' ').replace(/\s+/g, ' ');
  const kaM  = fsf.match(/known as\s+(.+?)\s+being the property/i);
  const pfnd = kaM ? kaM[1].trim() : null;
  const parts = p.addr.split(',').map(s => s.trim()).filter(Boolean);
  const mc   = parts.filter(pt => nm(cotText).includes(nm(pt))).length;
  const aOk  = mc >= Math.max(1, parts.length - 1);
  chks.push({
    lbl: 'Property address',
    st:  aOk ? 'g' : 'r',
    exp: p.addr,
    fnd: pfnd ? pfnd.substring(0, 150) : (aOk ? '(found in COT)' : '(not found)'),
    note: aOk ? null : 'Only ' + mc + '/' + parts.length + ' address parts matched.'
  });

  // 5. Annual rent
  let rst = 'g', rfnd = '(not found)', rnote = null;
  if (!rv) {
    rst = 'a'; rfnd = 'No rent'; rnote = 'Check Funding Approval Letter.';
  } else {
    const pats = [/[€€]\s*([\d,]+(?:\.[\d]{2})?)/g, /([\d,]+(?:\.[\d]{2})?)\s*per\s*annum/gi];
    let found = [];
    for (const pat of pats) {
      pat.lastIndex = 0;
      let m;
      while ((m = pat.exec(cotText)) !== null) {
        const n = parseFloat(m[1].replace(/,/g, ''));
        if (n > 500 && n < 500000) found.push(n);
      }
    }
    found = [...new Set(found)];
    if (!found.length) {
      rst = 'r'; rfnd = '(not found)'; rnote = 'No rent in COT.';
    } else {
      const hit = found.find(r => Math.abs(r - rv) < 1);
      rfnd = found.map(r => '€' + r.toLocaleString('en-IE', {minimumFractionDigits: 2})).join(', ');
      if (!hit) {
        rst = 'r';
        rnote = 'COT rent (' + rfnd + ') ≠ expected €' + rv.toLocaleString('en-IE', {minimumFractionDigits: 2});
      }
    }
  }
  chks.push({
    lbl: 'Annual rent',
    st:  rst,
    exp: rv ? '€' + rv.toLocaleString('en-IE', {minimumFractionDigits: 2}) + ' pa' : 'Check FAL',
    fnd: rfnd,
    note: rnote
  });

  // 6. Gale day
  const expG  = cc ? cc.gale : '';
  const glRaw = (flat.match(/Date\s+for\s+payment\s+of\s+Rent[\s:]+(.{3,80}?)(?:\s{3,}|$)/i) || [])[1] || '(not found)';
  const ng    = s => s.toLowerCase().replace(/[^a-z0-9]/g, ' ').replace(/\s+/g, ' ').trim();
  let gOk = false;
  if (expG.toLowerCase() === 'flexible') {
    gOk = ng(glRaw).includes('flexible');
  } else {
    const ew = ng(expG).split(' ').filter(w => w.length > 2);
    const mw = ew.filter(w => ng(glRaw).includes(w));
    gOk = ew.length > 0 && (mw.length / ew.length) >= 0.7;
  }
  chks.push({
    lbl: 'Date for payment of Rent',
    st:  gOk ? 'g' : 'r',
    exp: expG || 'Unknown',
    fnd: glRaw.substring(0, 80),
    note: gOk ? null : 'Gale day mismatch.'
  });

  // 7. Tenant/Lessee — Third Schedule
  const tenRaw = (th3f.match(/Tenant\s*[\/|]?\s*Lessee\s+(.{3,80}?)(?:\s{3,}|Rent|$)/i) || [])[1] || '(not found)';
  const tenOk  = nm(tenRaw).includes(nm(cf).substring(0, 12));
  chks.push({
    lbl: 'Tenant/Lessee — Third Schedule',
    st:  tenOk ? 'g' : 'r',
    exp: cf,
    fnd: tenRaw.substring(0, 80),
    note: tenOk ? null : 'Tenant/Lessee mismatch.'
  });

  // 8. Folio number
  const expF = (p.folio || '').trim();
  if (expF) {
    const fInCot = nm(cotText).includes(nm(expF));
    const fPats  = [
      /comprised\s+in\s+([A-Z]{1,2}\d{3,7}[A-Z]?)\s+of\s+the\s+Register/i,
      /Folio\s+(?:No\.?\s*)?([A-Z]{1,2}\d{3,7}[A-Z]?)/i,
      new RegExp(expF.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i')
    ];
    let fDisp = '(not found in COT)';
    for (const pat of fPats) {
      const m = fsf.match(pat);
      if (m) { fDisp = (m[1] || m[0]).trim().substring(0, 20); break; }
    }
    if (fInCot && fDisp === '(not found in COT)') fDisp = expF + ' ✓';
    chks.push({
      lbl: 'Folio Number',
      st:  fInCot ? 'g' : 'r',
      exp: expF,
      fnd: fDisp,
      note: fInCot ? null : 'Folio not found in COT.'
    });
  } else {
    chks.push({lbl: 'Folio Number', st: 'a', exp: 'Not available', fnd: 'Not in database', note: 'Upload Property Tracker to verify.'});
  }

  // 9. Map — First Schedule
  const fsec = cotText.match(/FIRST SCHEDULE[\s\S]{0,500}/i)?.[0] || '';
  const mapM = /map/i.test(fsec);
  const mapA = mapM && /annex|annexed|attached/i.test(cotText.match(/FIRST SCHEDULE[\s\S]*/i)?.[0] || '');
  chks.push({
    lbl: 'Map — First Schedule',
    st:  mapM ? (mapA ? 'g' : 'a') : 'b',
    exp: mapM ? 'Map should be annexed' : 'No map expected',
    fnd: mapM ? (mapA ? 'Map appears annexed' : 'Map mentioned but not annexed') : 'No map reference',
    note: mapM && !mapA ? '⚠ Map referenced but not annexed.' : null
  });

  // ── Render results ──
  const pass = chks.filter(c => c.st === 'g').length;
  const fail = chks.filter(c => c.st === 'r').length;
  const warn = chks.filter(c => c.st === 'a').length;
  const info = chks.filter(c => c.st === 'b').length;
  const ovSt = fail > 0 ? 'fail' : warn > 0 ? 'warn' : 'pass';
  const ovIc = fail > 0 ? '❌' : warn > 0 ? '⚠️' : '✅';
  const ovMs = fail > 0
    ? `${fail} issue(s) found — COT needs correction`
    : warn > 0 ? 'Passed with warnings' : 'All checks passed — COT is ready';

  document.getElementById('p2ph').style.display  = 'none';
  document.getElementById('p2out').style.display = 'block';
  document.getElementById('p2out').innerHTML = `
    <div class="orow">
      <div class="otitle">Verification Report</div>
      <button class="abtn green" onclick="dlReport()">⬇ Download Report (.xlsx)</button>
    </div>
    <div class="rbanner ${ovSt}"><div class="rico">${ovIc}</div><div><div class="rtit">${ovMs}</div><div class="rsub">${esc(cotFile)} · ${esc(p.id)} · ${esc(p.addr.substring(0, 50))}</div></div></div>
    <div class="spills">
      <span class="sp g">✓ ${pass} passed</span>
      ${fail ? `<span class="sp r">✗ ${fail} failed</span>` : ''}
      ${warn ? `<span class="sp a">⚠ ${warn} warning(s)</span>` : ''}
      ${info ? `<span class="sp b">ℹ ${info} info</span>` : ''}
    </div>
    <div id="cchks">${chks.map((c, i) => renderChk(c, i)).join('')}</div>
    <div style="margin-top:18px">
      <div style="font-size:10px;font-weight:700;letter-spacing:0.1em;color:#aaa;text-transform:uppercase;border-bottom:1px solid #eee;padding-bottom:5px;margin-bottom:8px;font-family:Arial,sans-serif">Extracted COT Text (preview)</div>
      <div style="background:var(--paper);border:1px solid var(--border);border-radius:6px;padding:12px;font-family:'Courier New',monospace;font-size:11px;color:#888;max-height:140px;overflow-y:auto;white-space:pre-wrap">${esc(cotText.substring(0, 1200))}${cotText.length > 1200 ? '\n…(truncated)' : ''}</div>
    </div>`;
}

function renderChk(c, i) {
  const dc = {g:'g', r:'r', a:'a', b:'b'}[c.st];
  const bt = {g:'PASS', r:'FAIL', a:'WARNING', b:'INFO'}[c.st];
  const fc = {g:'fnd', r:'bad', a:'wrn', b:'fnd'}[c.st];
  return `<div class="ccard">
    <div class="chead" onclick="togChk(${i})">
      <div class="dot ${dc}"></div>
      <div class="clbl">${esc(c.lbl)}</div>
      <span class="cbadge ${dc}">${bt}</span>
      <span class="chev" id="chv${i}">▼</span>
    </div>
    <div class="cbody" id="cb${i}">
      <div class="crow"><div class="ck">Expected</div><div class="cv exp">${esc(c.exp)}</div></div>
      <div class="crow"><div class="ck">Found</div><div class="cv ${fc}">${esc(c.fnd)}</div></div>
      ${c.note ? `<div class="cnote">${esc(c.note)}</div>` : ''}
    </div>
  </div>`;
}

function togChk(i) {
  document.getElementById('cb'  + i).classList.toggle('open');
  document.getElementById('chv' + i).classList.toggle('open');
}

// ── Report export ──

function dlReport() {
  const p = selProp; if (!p) return;
  const now   = new Date().toLocaleDateString('en-IE', {day: 'numeric', month: 'long', year: 'numeric'});
  const cards = document.querySelectorAll('.ccard');
  const stMap = {PASS: 'pass', FAIL: 'fail', WARNING: 'warn', INFO: 'info'};
  let pass = 0, fail = 0, warn = 0, info = 0;
  const rows = [];
  cards.forEach((card, i) => {
    const lbl  = card.querySelector('.clbl')?.textContent?.trim()  || '';
    const bt   = card.querySelector('.cbadge')?.textContent?.trim() || '';
    const vals = card.querySelectorAll('.cv');
    const exp  = vals[0]?.textContent?.trim() || '';
    const fnd  = vals[1]?.textContent?.trim() || '';
    const note = card.querySelector('.cnote')?.textContent?.trim() || '';
    const sk   = stMap[bt] || 'info';
    if (sk === 'pass') pass++; else if (sk === 'fail') fail++; else if (sk === 'warn') warn++; else info++;
    rows.push([i + 1, lbl, bt, exp, fnd, note]);
  });
  const wb  = XLSX.utils.book_new();
  const ws1 = XLSX.utils.aoa_to_sheet([
    ['COT VERIFICATION REPORT'], [''],
    ['IH ID', p.id], ['Property', p.addr], ['COT File', cotFile], ['Generated', now], [''],
    ['Overall', fail > 0 ? fail + ' issue(s) found' : 'Passed'], [''],
    ['Passed', pass], ['Failed', fail], ['Warnings', warn], ['Info', info]
  ]);
  ws1['!cols'] = [{wch: 18}, {wch: 60}];
  XLSX.utils.book_append_sheet(wb, ws1, 'Summary');
  const ws2 = XLSX.utils.aoa_to_sheet([
    ['#', 'Check', 'Status', 'Expected', 'Found in COT', 'Notes'],
    ...rows
  ]);
  ws2['!cols'] = [{wch: 4}, {wch: 30}, {wch: 10}, {wch: 40}, {wch: 40}, {wch: 50}];
  XLSX.utils.book_append_sheet(wb, ws2, 'Verification Checks');
  XLSX.writeFile(wb, 'COT_Verification_' + p.id + '_' + p.addr.replace(/[^a-zA-Z0-9]/g, '_').substring(0, 30) + '.xlsx');
}
