// ═══════════════════════════════════════════════════
// PHASE 5 — Chase Queue
// A database-wide view of every property that has crossed its follow-up
// window (7 days for HA, 14 for Council), derived from allProps + the
// per-property tracking Phase 4 saves in localStorage. The same queue is
// also rendered inside Phase 4 (prefix 'p4') so it's visible while working
// a property; "Open" jumps to Phase 4 for that property.
// ═══════════════════════════════════════════════════

let queueFrom = '';           // date-range filter — lower bound (blank = no limit)
let queueTo   = todayStr();   // date-range filter — upper bound (defaults to "today", i.e. overdue)

function effectiveChaseState(p) {
  const st = loadChase(p.id);
  if (st.issueDate || !p.cotIssued) return st;
  return Object.assign(defaultChaseState(), {
    issueDate:         p.cotIssued,
    stage:             'AWAITING_HA',
    nextReminder:      addDays(p.cotIssued, 7),
    nextReminderLabel: 'HA follow-up due'
  });
}

function buildChaseQueue(from, to) {
  return allProps
    .map(p => ({p, st: effectiveChaseState(p)}))
    .filter(r => r.st.nextReminder && r.st.stage !== 'COMPLETE')
    .filter(r => !from || r.st.nextReminder >= from)
    .filter(r => !to   || r.st.nextReminder <= to)
    .sort((a, b) => a.st.nextReminder.localeCompare(b.st.nextReminder));
}

// The picker is rendered with a prefix ('p4' or 'p5') so its <input> ids stay
// unique when both Phase 4 and Phase 5 have it on the page at once. Changing
// it refreshes both, so they never show different ranges.
function setQueueRange(prefix) {
  queueFrom = document.getElementById(prefix + 'QFrom').value;
  queueTo   = document.getElementById(prefix + 'QTo').value;
  refreshQueueViews();
}

function resetQueueRange() {
  queueFrom = '';
  queueTo   = todayStr();
  refreshQueueViews();
}

function refreshQueueViews() {
  if (selProp) renderPhase4(selProp);
  renderPhase5();
}

function openChaseFor(id) {
  selectProperty(id);
  tryTab('p4');
}

function renderPhase5() {
  const p = selProp; if (!p) return;
  document.getElementById('apsP5Id').textContent   = p.id;
  document.getElementById('apsP5Addr').textContent = p.addr.substring(0, 55);
  document.getElementById('p5out').innerHTML = renderChaseQueue(p.id, 'p5');
}

function renderChaseQueue(activeId, prefix) {
  const rows = buildChaseQueue(queueFrom, queueTo);
  const isOverdueView = !queueFrom && queueTo === todayStr();
  const today = todayStr();

  const badge = rows.length
    ? `<span class="sp r">${rows.length} ${isOverdueView ? 'due now' : 'in range'}</span>`
    : `<span class="sp g">${icon('check')} None ${isOverdueView ? 'overdue' : 'in range'}</span>`;

  const picker = `
    <div style="display:flex;gap:10px;align-items:flex-end;flex-wrap:wrap;margin:4px 0 16px">
      <div class="fld" style="margin-bottom:0;width:160px"><div class="lbl">Follow-up due from</div><input type="date" id="${prefix}QFrom" value="${esc(queueFrom)}" onchange="setQueueRange('${prefix}')"></div>
      <div class="fld" style="margin-bottom:0;width:160px"><div class="lbl">through</div><input type="date" id="${prefix}QTo" value="${esc(queueTo)}" onchange="setQueueRange('${prefix}')"></div>
      <button class="abtn" onclick="resetQueueRange()">Today &amp; earlier</button>
    </div>`;

  const head = `<div class="orow"><div class="otitle">Chase Queue</div>${badge}</div>${picker}`;

  if (!rows.length) {
    return head + `<div class="hint">No properties have a follow-up due in this range.</div>`;
  }

  const items = rows.map(({p, st}) => {
    const diff  = daysBetween(st.nextReminder, today);
    const when  = diff > 0 ? diff + 'd overdue' : diff < 0 ? 'in ' + (-diff) + 'd' : 'due today';
    const label = st.stage === 'AWAITING_COUNCIL' ? 'Council follow-up' : 'HA follow-up';
    const bg    = p.id === activeId ? ' style="background:var(--paper)"' : '';
    return `<div class="tl-item"${bg}>
      <div class="tl-date">${esc(when)}</div>
      <div class="tl-text" style="flex:1"><strong>${esc(p.id)}</strong> · ${esc(p.addr)}<br><span style="color:#999">${esc(label)} due ${esc(fmtDate(st.nextReminder))}</span></div>
      <button class="abtn" onclick="openChaseFor('${esc(p.id)}')">Open ${icon('arrowR')}</button>
    </div>`;
  }).join('');

  return head + `<div class="tl">${items}</div>`;
}
