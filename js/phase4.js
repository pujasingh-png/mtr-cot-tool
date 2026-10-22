// ═══════════════════════════════════════════════════
// PHASE 4 — Lease Chasing (follow-up)
// Follows the SOP: Day-7 HA follow-up → (confirmed) 2-week Council
// follow-up → signed & returned, for the active property. Tracking is
// per-property and is saved in this browser (localStorage) so it survives
// reloads/re-uploads. The cross-property overview lives in Phase 5.
// ═══════════════════════════════════════════════════

let p4EmailBody = ''; // last-generated Phase 4 email, for the Copy button

// ── State persistence ──

function chaseKey(id) { return 'cotChase_' + id; }

function defaultChaseState() {
  return {issueDate: '', stage: 'AWAITING_HA', nextReminder: '', nextReminderLabel: '', log: []};
}

function loadChase(id) {
  try {
    const raw = localStorage.getItem(chaseKey(id));
    return raw ? Object.assign(defaultChaseState(), JSON.parse(raw)) : defaultChaseState();
  } catch(e) { return defaultChaseState(); }
}

function saveChase(id, st) {
  localStorage.setItem(chaseKey(id), JSON.stringify(st));
}

function resetChase() {
  const p = selProp; if (!p) return;
  if (!confirm('Reset lease-chasing tracking for this property? This clears the follow-up log and starts over from the Draft COT Issue Date.')) return;
  localStorage.removeItem(chaseKey(p.id));
  renderPhase4(p);
}

// Starts (or restarts) tracking for a property from a given issue date —
// used both when the date comes from the database (Draft COT Issue Date
// column) and when it's entered manually as a fallback.
function startChase(p, dateStr, source) {
  const st = defaultChaseState();
  st.issueDate         = dateStr;
  st.stage             = 'AWAITING_HA';
  st.nextReminder      = addDays(dateStr, 7);
  st.nextReminderLabel = 'HA follow-up due';
  st.log = [{date: dateStr, text: 'COT & LIR issued to the Housing Agency' + (source ? ' (' + source + ')' : '') + '.'}];
  saveChase(p.id, st);
  return st;
}

// ── Council leasing-email lookup (with browser-saved overrides) ──

function getCouncilEmailOverrides() {
  try { return JSON.parse(localStorage.getItem('cotCouncilEmails') || '{}'); } catch(e) { return {}; }
}

function getCouncilEmail(la) {
  const overrides = getCouncilEmailOverrides();
  return overrides[la] || CC_LEASE_EMAIL[la] || '';
}

function saveCouncilEmail() {
  const p = selProp; if (!p) return;
  const val = document.getElementById('p4couEmail').value.trim();
  const overrides = getCouncilEmailOverrides();
  if (val) overrides[p.la] = val; else delete overrides[p.la];
  localStorage.setItem('cotCouncilEmails', JSON.stringify(overrides));
  updateCouncilEmailHint(p.la, val);
  const st = loadChase(p.id);
  if (st.stage === 'AWAITING_COUNCIL') renderPhase4(p); // refresh disabled state on the generate button
}

function updateCouncilEmailHint(la, em) {
  const h = document.getElementById('p4couEmailHint');
  if (h) h.textContent = em ? '' : "Not on file. Enter it once and it will be remembered for this council.";
}

// ── Date helpers ──

// Date math is done entirely in UTC (via Date.UTC / getUTC*) so it's immune
// to the browser's local timezone — mixing local-time construction with
// toISOString() output shifts the date by a day whenever the timezone is
// ahead of UTC (e.g. Irish Summer Time).
function todayStr() {
  const d = new Date();
  return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
}

function addDays(dateStr, n) {
  const [y, m, d] = dateStr.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d + n)).toISOString().slice(0, 10);
}

function fmtDate(dateStr) {
  if (!dateStr) return 'Not set';
  return new Date(dateStr + 'T00:00:00').toLocaleDateString('en-IE', {day: 'numeric', month: 'long', year: 'numeric'});
}

// b - a, in whole days (UTC-safe, see addDays)
function daysBetween(a, b) {
  const [ay, am, ad] = a.split('-').map(Number);
  const [by, bm, bd] = b.split('-').map(Number);
  return Math.round((Date.UTC(by, bm - 1, bd) - Date.UTC(ay, am - 1, ad)) / 86400000);
}

// ── Main render ──

function renderPhase4(p) {
  document.getElementById('apsP4Id').textContent   = p.id;
  document.getElementById('apsP4Addr').textContent = p.addr.substring(0, 55);
  document.getElementById('p4haEmail').value = HA_EMAIL;

  const cc = CC[p.la];
  document.getElementById('p4couName').value = cc ? cc.full : p.la;
  const em = getCouncilEmail(p.la);
  document.getElementById('p4couEmail').value = em;
  updateCouncilEmailHint(p.la, em);

  // Chasing is driven by the database's Draft COT Issue Date — start
  // tracking automatically the first time this property is opened here.
  let st = loadChase(p.id);
  if (!st.issueDate && p.cotIssued) st = startChase(p, p.cotIssued, 'Draft COT Issue Date from database');

  renderIssueDateField(p, st);

  document.getElementById('p4out').innerHTML =
    renderChaseQueue(p.id, 'p4') +
    `<div class="orow" style="margin-top:24px"><div class="otitle">Lease Chasing</div></div>` +
    (st.issueDate
      ? renderStageBanner(p, st) + renderStageActions(p, st) +
        `<div style="margin-top:22px">
          <div style="font-size:10px;font-weight:700;letter-spacing:0.1em;color:#aaa;text-transform:uppercase;border-bottom:1px solid #eee;padding-bottom:5px;margin-bottom:8px;font-family:Arial,sans-serif">Activity Log</div>
          ${renderTimeline(st)}
        </div>`
      : `<div class="hint">No Draft COT Issue Date on file for this property yet. Enter one on the left to start chasing it.</div>`);
}

function renderIssueDateField(p, st) {
  const wrap = document.getElementById('p4IssueDateWrap');
  if (p.cotIssued) {
    wrap.innerHTML = `
      <div style="background:var(--amber-lt);border:1px solid var(--amber-bdr);border-radius:6px;padding:9px 12px;margin-bottom:10px;font-size:11px;color:#7a4f00;font-weight:600;font-family:Arial,sans-serif">${icon('pencil')} Auto-filled from database</div>
      <div class="fld"><input class="af" value="${esc(fmtDate(p.cotIssued))}" readonly></div>`;
  } else {
    wrap.innerHTML = `
      <div class="fld">
        <input type="date" id="p4IssueDateManual" value="${esc(st.issueDate || '')}" onchange="setIssueDate()">
        <div class="hint">Not in the database. Enter the date manually to start chasing.</div>
      </div>`;
  }
}

// Manual fallback — only relevant when the property has no Draft COT Issue
// Date in the database (the field above is otherwise locked to it).
function setIssueDate() {
  const p = selProp; if (!p) return;
  const val = document.getElementById('p4IssueDateManual').value;
  if (!val) { localStorage.removeItem(chaseKey(p.id)); renderPhase4(p); return; }
  const st = loadChase(p.id);
  if (st.issueDate) {
    st.issueDate = val;
    st.log.push({date: todayStr(), text: 'Issue date updated to ' + fmtDate(val) + '.'});
    saveChase(p.id, st);
  } else {
    startChase(p, val, 'manually entered');
  }
  renderPhase4(p);
}

// ── Stage rendering ──

function renderStageBanner(p, st) {
  if (st.stage === 'COMPLETE') {
    return `<div class="rbanner pass"><div class="rico">${icon('checkCircle')}</div><div><div class="rtit">Lease signed &amp; returned. Chase complete.</div><div class="rsub">${esc(p.id)} · ${esc(p.addr.substring(0, 50))}</div></div></div>`;
  }
  const label = st.stage === 'AWAITING_COUNCIL' ? 'Awaiting County Council confirmation' : 'Awaiting Housing Agency confirmation';
  const due   = st.nextReminder ? fmtDate(st.nextReminder) + (st.nextReminderLabel ? ', ' + st.nextReminderLabel : '') : 'Not set';
  return `<div class="rbanner warn"><div class="rico">${icon('clock')}</div><div><div class="rtit">${esc(label)}</div><div class="rsub">Next check-in: ${esc(due)} · Issued ${esc(fmtDate(st.issueDate))}</div></div></div>`;
}

function renderStageActions(p, st) {
  if (st.stage === 'COMPLETE') {
    return `<div style="margin:16px 0"><button class="abtn" onclick="resetChase()">${icon('reset')} Start a new chase for this property</button></div>`;
  }

  if (st.stage === 'AWAITING_HA') {
    return `
      <div style="margin:16px 0">
        <div style="display:flex;gap:10px;flex-wrap:wrap">
          <button class="btn btn-blue" style="width:auto;padding:9px 16px" onclick="genHAFollowup()">${icon('mail')} Generate HA Follow-Up Email</button>
        </div>
        <div id="p4email"></div>
      </div>`;
  }

  // AWAITING_COUNCIL
  const em = getCouncilEmail(p.la);
  return `
    <div style="margin:16px 0">
      <div style="display:flex;gap:10px;flex-wrap:wrap">
        <button class="btn btn-blue" style="width:auto;padding:9px 16px" onclick="genCouncilFollowup()" ${em ? '' : 'disabled'}>${icon('mail')} Generate Council Follow-Up Email</button>
      </div>
      ${em ? '' : '<div class="hint" style="margin-top:6px">Enter the council\'s leasing/housing email on the left to enable this.</div>'}
      <div id="p4email"></div>
      <div style="display:flex;gap:8px;margin-top:14px;flex-wrap:wrap">
        <button class="abtn green" onclick="markCouncilConfirmed()">${icon('checkCircle')} Lease signed &amp; returned</button>
        <button class="abtn" onclick="markCouncilNotYet()">${icon('clock')} Not yet, recheck in 2 weeks</button>
      </div>
    </div>`;
}

function renderTimeline(st) {
  if (!st.log.length) return '<div class="hint">No activity yet.</div>';
  const items = st.log.slice().reverse().map(e =>
    `<div class="tl-item"><div class="tl-date">${esc(fmtDate(e.date))}</div><div class="tl-text">${esc(e.text)}</div></div>`
  ).join('');
  return `<div class="tl">${items}</div>`;
}

// ── Stage transitions ──

function markHAConfirmed() {
  const p = selProp; if (!p) return;
  const st = loadChase(p.id);
  st.stage             = 'AWAITING_COUNCIL';
  st.nextReminder      = addDays(todayStr(), 14);
  st.nextReminderLabel = 'Council follow-up due';
  st.log.push({date: todayStr(), text: 'Housing Agency confirmed the lease has been drafted & sent to the Local Authority.'});
  saveChase(p.id, st);
  renderPhase4(p);
}

function markHAStillDrafting() {
  const p = selProp; if (!p) return;
  const st = loadChase(p.id);
  st.nextReminder      = addDays(todayStr(), 7);
  st.nextReminderLabel = 'HA follow-up due';
  st.log.push({date: todayStr(), text: 'Housing Agency still drafting the lease. Recheck in 7 days.'});
  saveChase(p.id, st);
  renderPhase4(p);
}

function markCouncilConfirmed() {
  const p = selProp; if (!p) return;
  const st = loadChase(p.id);
  st.stage             = 'COMPLETE';
  st.nextReminder      = '';
  st.nextReminderLabel = '';
  st.log.push({date: todayStr(), text: "County Council confirmed the lease is signed & returned to the Housing Agency's solicitors."});
  saveChase(p.id, st);
  renderPhase4(p);
}

function markCouncilNotYet() {
  const p = selProp; if (!p) return;
  const st = loadChase(p.id);
  st.nextReminder      = addDays(todayStr(), 14);
  st.nextReminderLabel = 'Council follow-up due';
  st.log.push({date: todayStr(), text: 'Lease not yet signed & returned. Recheck in 2 weeks.'});
  saveChase(p.id, st);
  renderPhase4(p);
}

// ── Email generation ──

function insertEmailCard(sub, body, to) {
  p4EmailBody = 'SUBJECT: ' + sub + '\nTO: ' + to + '\n\n' + body;
  const gmailUrl = 'https://mail.google.com/mail/?view=cm&fs=1&to='
    + encodeURIComponent(to) + '&su=' + encodeURIComponent(sub) + '&body=' + encodeURIComponent(body);
  const el = document.getElementById('p4email');
  if (!el) return;
  el.innerHTML = `
    <div class="ecard" style="margin-top:10px">
      <div class="emeta">
        <div class="emrow"><span class="emk">To</span><strong>${esc(to)}</strong></div>
        <div class="emrow"><span class="emk">Subject</span><strong>${esc(sub)}</strong></div>
      </div>
      <div class="ebody">${esc(body)}</div>
    </div>
    <div style="display:flex;gap:8px;margin-top:8px">
      <button class="abtn" onclick="copyP4Email()">${icon('copy')} Copy email</button>
      <button class="abtn" onclick="window.open('${gmailUrl}','_blank')">${icon('mail')} Open in Gmail</button>
    </div>`;
}

function copyP4Email() {
  navigator.clipboard.writeText(p4EmailBody).then(() => alert('Email copied to clipboard!'));
}

function genHAFollowup() {
  const p = selProp; if (!p) return;
  const st = loadChase(p.id);
  st.log.push({date: todayStr(), text: 'HA follow-up email drafted (' + HA_EMAIL + ').'});
  saveChase(p.id, st);
  renderPhase4(p);

  const sub  = 'COT/Lease Status Check: ' + p.addr;
  const body =
`Hi,

Can you please confirm if lease docs have been drafted and sent to the LA for this case?

Property Address: ${p.addr}

Kind Regards,
Inga Berzonskyte`;
  insertEmailCard(sub, body, HA_EMAIL);
}

function genCouncilFollowup() {
  const p = selProp; if (!p) return;
  const to = getCouncilEmail(p.la);
  if (!to) { alert("Enter the council's leasing/housing email on the left first."); return; }

  const cc = CC[p.la];
  const st = loadChase(p.id);
  st.log.push({date: todayStr(), text: 'Council follow-up email drafted (' + to + ').'});
  saveChase(p.id, st);
  renderPhase4(p);

  const sub  = 'Lease Signing Status: ' + p.addr;
  const body =
`Hi,

Following the recent Certificate of Title issued for the property below, could you please confirm whether the lease has been signed and returned to the Housing Agency's solicitors?

Property Address: ${p.addr}
County Council: ${cc ? cc.full : p.la}

Kind Regards,
Inga Berzonskyte`;
  insertEmailCard(sub, body, to);
}
