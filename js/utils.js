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
// ADDRESS MATCHING — database address vs COT text
// ═══════════════════════════════════════════════════

const addrNorm = s => String(s || '').toLowerCase().replace(/[,.’'‘“”"()]/g, ' ').replace(/\s+/g, ' ').trim();

function editDistance(a, b) {
  const d = Array.from({length: a.length + 1}, (_, i) => [i]);
  for (let j = 1; j <= b.length; j++) d[0][j] = j;
  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
    }
  }
  return d[a.length][b.length];
}

// Every comma-separated part of the address must appear in the COT text.
// For each part that doesn't, look in `near` (the COT's own address text, if
// found) for a close spelling — up to 2 letters different — to show the user.
function matchAddress(addr, text, near) {
  const hay   = addrNorm(text);
  const parts = String(addr || '').split(',').map(s => s.trim()).filter(Boolean);
  const words = String(near || '').replace(/\s+/g, ' ').trim().split(' ').filter(Boolean);
  const missing = parts.filter(pt => !hay.includes(addrNorm(pt))).map(pt => {
    const want = addrNorm(pt), n = want.split(' ').length;
    let best = null, bd = Math.min(2, Math.floor(want.length / 4));
    for (let i = 0; i + n <= words.length; i++) {
      const cand = words.slice(i, i + n).join(' ').replace(/[,.;:]+$/, '');
      const dist = editDistance(want, addrNorm(cand));
      if (dist > 0 && dist <= bd) { bd = dist; best = cand; }
    }
    return {part: pt, cot: best};
  });
  return {parts, missing};
}

// Pull the property address as written in the COT. Prefers the First Schedule
// wording ("known as … being the property"); otherwise finds where the first
// address part appears and takes the text through the furthest later part
// (usually the Eircode) within the next 250 characters.
function findCotAddress(addr, text) {
  const flat = String(text || '').replace(/\s+/g, ' ');
  const ka   = flat.match(/known as\s+(.+?)\s+being the property/i);
  if (ka) return ka[1].trim();

  const low   = flat.toLowerCase();
  const parts = String(addr || '').split(',').map(s => s.trim().toLowerCase()).filter(Boolean);
  for (let i = 0; i < parts.length; i++) {
    let start = low.indexOf(parts[i]);
    if (start < 0) continue;
    let end = start + parts[i].length;
    // Earlier parts weren't found as written (e.g. misspelt) — step back far
    // enough to include them, then snap to the start of a word
    if (i > 0) {
      const back = parts.slice(0, i).reduce((n, pt) => n + pt.length + 2, 0);
      start = Math.max(0, start - back);
      while (start > 0 && flat[start - 1] !== ' ') start--;
    }
    for (let j = i + 1; j < parts.length; j++) {
      const k = low.indexOf(parts[j], end);
      if (k >= 0 && k - start < 250) end = k + parts[j].length;
    }
    return flat.substring(start, end).trim();
  }
  return '';
}

// Plain-English summary of the parts that differ
function describeAddressGaps(missing) {
  return missing.map(m => m.cot
    ? 'Does not match: database has "' + m.part + '", COT has "' + m.cot + '".'
    : '"' + m.part + '" not found in the COT.').join(' ');
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

// ═══════════════════════════════════════════════════
// ICONS — inline SVG line icons (Lucide, ISC licence)
// Use icon('name') in templates, or data-icon="name" in index.html.
// ═══════════════════════════════════════════════════

const ICONS = {
  lock:        '<rect width="18" height="11" x="3" y="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>',
  sheet:       '<path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"/><path d="M14 2v4a2 2 0 0 0 2 2h4"/><path d="M8 13h2"/><path d="M14 13h2"/><path d="M8 17h2"/><path d="M14 17h2"/>',
  file:        '<path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"/><path d="M14 2v4a2 2 0 0 0 2 2h4"/><path d="M10 9H8"/><path d="M16 13H8"/><path d="M16 17H8"/>',
  cloud:       '<path d="M17.5 19H9a7 7 0 1 1 6.71-9h1.79a4.5 4.5 0 1 1 0 9Z"/>',
  check:       '<path d="M20 6 9 17l-5-5"/>',
  checkCircle: '<circle cx="12" cy="12" r="10"/><path d="m9 12 2 2 4-4"/>',
  xCircle:     '<circle cx="12" cy="12" r="10"/><path d="m15 9-6 6"/><path d="m9 9 6 6"/>',
  alert:       '<path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3"/><path d="M12 9v4"/><path d="M12 17h.01"/>',
  info:        '<circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/>',
  arrowR:      '<path d="M5 12h14"/><path d="m12 5 7 7-7 7"/>',
  arrowL:      '<path d="m12 19-7-7 7-7"/><path d="M19 12H5"/>',
  chevron:     '<path d="m6 9 6 6 6-6"/>',
  mail:        '<rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>',
  copy:        '<rect width="14" height="14" x="8" y="8" rx="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/>',
  download:    '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><path d="m7 10 5 5 5-5"/><path d="M12 15V3"/>',
  shield:      '<path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"/><path d="m9 12 2 2 4-4"/>',
  pencil:      '<path d="M21.17 6.81a1 1 0 0 0-3.99-3.99L3.84 16.17a2 2 0 0 0-.5.83l-1.32 4.35a.5.5 0 0 0 .62.62l4.35-1.32a2 2 0 0 0 .83-.5z"/>',
  clock:       '<circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/>',
  loader:      '<path d="M21 12a9 9 0 1 1-6.22-8.56"/>',
  reset:       '<path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/>',
};

function icon(name, cls) {
  return '<svg class="ic' + (cls ? ' ' + cls : '') + '" viewBox="0 0 24 24" aria-hidden="true">' + (ICONS[name] || '') + '</svg>';
}

function renderIcons(root) {
  (root || document).querySelectorAll('[data-icon]').forEach(el => { el.innerHTML = icon(el.dataset.icon); });
}

// Scripts load at the end of <body>, so the static markup is already parsed
renderIcons();
