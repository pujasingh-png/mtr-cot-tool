// ═══════════════════════════════════════════════════
// SETUP — Excel upload, property search & selection
// ═══════════════════════════════════════════════════

function loadExcel(input) {
  const file = input.files[0]; if (!file) return;
  const reader = new FileReader();
  reader.onload = function(e) {
    try {
      const wb   = XLSX.read(e.target.result, {type: 'array'});
      const ws   = wb.Sheets[wb.SheetNames[0]];
      const rows = XLSX.utils.sheet_to_json(ws, {header: 1, defval: ''});

      // Find the header row (contains 'IH ID')
      let hi = -1;
      for (let i = 0; i < Math.min(10, rows.length); i++) {
        if (String(rows[i][COL.ID]).includes('IH ID')) { hi = i; break; }
      }
      const ds = hi >= 0 ? hi + 1 : 3;

      const list = [];
      for (let i = ds; i < rows.length; i++) {
        const r        = rows[i];
        const id       = String(r[COL.ID]   || '').trim();
        const addr     = String(r[COL.ADDR] || '').trim();
        const la       = String(r[COL.LA]   || '').trim();
        const res1     = String(r[COL.RES]  || '').trim();
        const res2     = String(r[COL.RES2] || '').trim();
        const res2clean = /^n\/?a$/i.test(res2) ? '' : res2;
        const res      = res2clean ? res1 + ', ' + res2clean : res1;
        const eir      = String(r[COL.EIR]  || '').trim();
        const rent     = r[COL.RENT];
        const folio    = String(r[COL.FOLIO] || '').trim();
        if (!id || !addr || id === 'IH ID') continue;
        list.push({id, addr, la, res, eir, rent, folio});
      }
      allProps = list;

      // Mark upload box as done
      const ub = document.getElementById('ubSetup');
      ub.classList.add('ok');
      document.getElementById('ubSetupTxt').innerHTML =
        '✅ <strong>' + esc(file.name) + '</strong><br><small>' + list.length + ' properties loaded</small>';
      document.getElementById('stepNum1').classList.add('done');
      document.getElementById('stepNum1').textContent = '✓';

      // Show property selector
      document.getElementById('setupSelectPlaceholder').style.display = 'none';
      document.getElementById('setupSelectWrap').style.display        = 'block';
      document.getElementById('setupStep2Hint').style.display         = 'block';
      renderSetupList(allProps);

    } catch(err) { alert('Error reading Excel: ' + err.message); }
  };
  reader.readAsArrayBuffer(file);
}

// ── Property list filtering & rendering ──

function filterSetupList(q) {
  const ql = q.toLowerCase();
  const filtered = ql
    ? allProps.filter(p =>
        p.addr.toLowerCase().includes(ql) ||
        p.res.toLowerCase().includes(ql)  ||
        p.id.toLowerCase().includes(ql))
    : allProps;
  renderSetupList(filtered);
}

function renderSetupList(list) {
  const el = document.getElementById('setupList');
  if (!list.length) {
    el.innerHTML = '<div style="padding:12px;text-align:center;color:#bbb;font-size:12px;font-family:Arial,sans-serif">No results</div>';
    return;
  }
  el.innerHTML = list.map(p => {
    const isSel = selProp && selProp.id === p.id;
    return `<div class="pi${isSel ? ' sel' : ''}" onclick="selectProperty('${esc(p.id)}')">
      <div class="pn">${esc(p.id)} — ${esc(p.res || 'Unknown')}</div>
      <div class="pa">${esc(p.addr)}</div>
    </div>`;
  }).join('');
}

// ── Property selection ──

function selectProperty(id) {
  selProp = allProps.find(p => p.id === id);
  if (!selProp) return;

  // Re-render list to show highlight
  const q = document.getElementById('setupSrch').value;
  filterSetupList(q);

  // Mark step 2 done
  document.getElementById('stepNum2').classList.add('done');
  document.getElementById('stepNum2').textContent = '✓';

  showPropertyCard(selProp);
  populateAllPhases(selProp);
  unlockTabs();

  // Show proceed button
  document.getElementById('proceedBtn').classList.add('visible');

  // Update header pill
  document.getElementById('hdrProp').classList.add('visible');
  document.getElementById('hdrPropName').textContent = selProp.id;
  document.getElementById('hdrPropAddr').textContent = selProp.addr.substring(0, 45);
}

function showPropertyCard(p) {
  const cc = CC[p.la];
  const rv = parseFloat(p.rent) || 0;
  const rs = rv ? '€' + rv.toLocaleString('en-IE', {minimumFractionDigits: 2}) : 'Not in database';

  document.getElementById('pscTitle').textContent = p.id + ' — ' + (p.res || 'Unknown Resident');
  document.getElementById('pscSub').textContent   = p.addr;
  document.getElementById('pscGrid').innerHTML = `
    <div class="psc-field"><div class="psc-label">Address</div><div class="psc-value">${esc(p.addr)}</div></div>
    <div class="psc-field"><div class="psc-label">Annual Rent</div><div class="psc-value">${esc(rs)}</div></div>
    <div class="psc-field"><div class="psc-label">Eircode</div><div class="psc-value">${esc(p.eir || '—')}</div></div>
    <div class="psc-field"><div class="psc-label">County Council</div><div class="psc-value">${esc(cc ? cc.full : p.la)}</div></div>
    <div class="psc-field"><div class="psc-label">Gale Day</div><div class="psc-value">${esc(cc ? cc.gale : '—')}</div></div>
    <div class="psc-field"><div class="psc-label">Folio No.</div><div class="psc-value">${esc(p.folio || '—')}</div></div>
  `;
  document.getElementById('propCard').classList.add('visible');
}

function clearSelection() {
  selProp = null;
  document.getElementById('propCard').classList.remove('visible');
  document.getElementById('proceedBtn').classList.remove('visible');
  document.getElementById('hdrProp').classList.remove('visible');
  document.getElementById('stepNum2').classList.remove('done');
  document.getElementById('stepNum2').textContent = '2';
  lockTabs();
  renderSetupList(allProps);
}

// ── Populate all phase fields from selected property ──

function populateAllPhases(p) {
  const cc = CC[p.la];
  const rv = parseFloat(p.rent) || 0;
  const rs = rv ? '€' + rv.toLocaleString('en-IE', {minimumFractionDigits: 2}) : 'Not in database';

  // Phase 1
  document.getElementById('p1bor').value          = p.res || '—';
  document.getElementById('p1adr').value          = p.addr;
  document.getElementById('p1rnt').value          = rs;
  document.getElementById('p1rntH').textContent   = rv ? '' : '⚠ Not in database — check Funding Approval Letter';
  document.getElementById('p1cou').value          = cc ? cc.full : p.la;
  document.getElementById('p1cadr').value         = cc ? cc.addr : '';
  document.getElementById('p1gal').value          = cc ? cc.gale : '';
  document.getElementById('apsP1Id').textContent  = p.id;
  document.getElementById('apsP1Addr').textContent = p.addr.substring(0, 55);

  // Phase 2
  document.getElementById('p2adr').value          = p.addr;
  document.getElementById('p2rnt').value          = rs;
  document.getElementById('p2cou').value          = cc ? cc.full : p.la;
  document.getElementById('p2gal').value          = cc ? cc.gale : '';
  document.getElementById('p2fol').value          = p.folio || '(not in database)';
  document.getElementById('apsP2Id').textContent  = p.id;
  document.getElementById('apsP2Addr').textContent = p.addr.substring(0, 55);

  // Phase 3
  document.getElementById('p3bor').value          = p.res || '—';
  document.getElementById('p3adr').value          = p.addr;
  document.getElementById('p3eir').value          = p.eir || '';
  document.getElementById('p3fol').value          = p.folio || '(not in database)';
  document.getElementById('apsP3Id').textContent  = p.id;
  document.getElementById('apsP3Addr').textContent = p.addr.substring(0, 55);

  checkP2Ready();
}

function checkP2Ready() {
  document.getElementById('p2verBtn').disabled = !(selProp && cotText);
}
