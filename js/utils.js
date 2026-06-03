// ═══════════════════════════════════════════════════
// UTILITIES — shared helpers used across all phases
// ═══════════════════════════════════════════════════

// HTML-escape a value for safe insertion into innerHTML
function esc(s) {
  return String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
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
  ['Setup', 'P1', 'P2', 'P3'].forEach(k => {
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
  ['P1', 'P2', 'P3'].forEach(k => {
    document.getElementById('tab'  + k).classList.remove('locked');
    document.getElementById('lock' + k).style.display = 'none';
  });
}

function lockTabs() {
  ['P1', 'P2', 'P3'].forEach(k => {
    document.getElementById('tab'  + k).classList.add('locked');
    document.getElementById('lock' + k).style.display = '';
  });
}

function proceedToPhase1() {
  hideGate('p1');
  showTab('p1');
}
