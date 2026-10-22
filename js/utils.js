// ═══════════════════════════════════════════════════
// UTILITIES — shared helpers used across all phases
// ═══════════════════════════════════════════════════

// HTML-escape a value for safe insertion into innerHTML
function esc(s) {
  return String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

// Convert a parsed-Excel date cell (JS Date, when XLSX.read used cellDates:true)
// to a plain 'YYYY-MM-DD' string. SheetJS builds these Date objects with the
// local-time constructor (so the *local* calendar fields match the date shown
// in Excel) — reading them back with UTC getters would shift the day
// whenever the browser's timezone is ahead of UTC (e.g. Irish Summer Time).
function excelDateToISO(v) {
  if (!v) return '';
  if (v instanceof Date && !isNaN(v)) {
    // A date-formatted cell that's actually empty (or holds a 0) decodes to
    // the Excel serial-0 sentinel, ~1899-12-30 — not a real date. The MTR
    // scheme predates nothing before ~2000, so treat anything that old as blank.
    if (v.getFullYear() < 2000) return '';
    return v.getFullYear() + '-' + String(v.getMonth() + 1).padStart(2, '0') + '-' + String(v.getDate()).padStart(2, '0');
  }
  return '';
}

// ═══════════════════════════════════════════════════
// TAB NAVIGATION
// ═══════════════════════════════════════════════════

// Normalise any phase key to the capitalised suffix used in element IDs
// 'setup' → 'Setup', 'p1'/'P1' → 'P1', etc.
function phaseKey(t) {
  if (!t) return '';
  const s = String(t).toLowerCase();
  if (s === 'setup') return 'Setup';
  return s.toUpperCase().replace(/^P/, 'P');
}

function showTab(t) {
  const key = phaseKey(t);
  ['Setup', 'P1', 'P2', 'P3', 'P4', 'P5'].forEach(k => {
    document.getElementById('panel' + k).classList.remove('on');
  });
  document.querySelectorAll('.tab').forEach(el => el.classList.remove('on'));
  document.getElementById('panel' + key).classList.add('on');
  document.getElementById('tab'   + key).classList.add('on');
}

function tryTab(phase) {
  if (!selProp) {
    const key = phaseKey(phase);
    document.getElementById('gate'    + key).style.display = 'flex';
    document.getElementById('content' + key).style.display = 'none';
    showTab(phase);
    return;
  }
  hideGate(phase);
  showTab(phase);
  // Phase 4/5 depend on cross-tab state (chase progress, the queue) that can
  // go stale — refresh whichever one is being opened.
  const key = phaseKey(phase);
  if (key === 'P4') renderPhase4(selProp);
  if (key === 'P5') renderPhase5();
}

function showGate(phase) {
  const key = phaseKey(phase);
  document.getElementById('gate'    + key).style.display = 'flex';
  document.getElementById('content' + key).style.display = 'none';
}

function hideGate(phase) {
  const key = phaseKey(phase);
  document.getElementById('gate'    + key).style.display = 'none';
  document.getElementById('content' + key).style.display = 'flex';
}

function goSetup() {
  showTab('setup');
}

function unlockTabs() {
  ['P1', 'P2', 'P3', 'P4', 'P5'].forEach(k => {
    document.getElementById('tab'  + k).classList.remove('locked');
    document.getElementById('lock' + k).style.display = 'none';
  });
}

function lockTabs() {
  ['P1', 'P2', 'P3', 'P4', 'P5'].forEach(k => {
    document.getElementById('tab'  + k).classList.add('locked');
    document.getElementById('lock' + k).style.display = '';
  });
}

function proceedToPhase1() {
  hideGate('p1');
  showTab('p1');
}
