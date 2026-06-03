// ═══════════════════════════════════════════════════
// PHASE 1 — Generate COT request email
// ═══════════════════════════════════════════════════

function genEmail() {
  const p = selProp; if (!p) return;
  const cc = CC[p.la];
  const cf = cc ? cc.full : p.la;
  const ca = document.getElementById('p1cadr').value;
  const gl = document.getElementById('p1gal').value;
  const rv = parseFloat(p.rent) || 0;
  const rf = rv
    ? '€' + rv.toLocaleString('en-IE', {minimumFractionDigits: 2, maximumFractionDigits: 2})
    : '[Annual Rent]';
  const ad  = p.addr;
  const sub = 'COT request- ' + ad;

  const body =
`Hi Jim ,

Could you please issue the COT for the property above?

Addressee : ${cf} , ${ca}
Property Address: ${ad}
Annual Rent: ${rf}
Date for payment of Rent: ${gl}

Kind Regards,
Inga Berzonskyte`;

  p1Email = 'SUBJECT: ' + sub + '\n\n' + body;

  // Build Gmail compose URL — opens a pre-filled draft in one click
  const gmailUrl = 'https://mail.google.com/mail/?view=cm&fs=1&su='
    + encodeURIComponent(sub)
    + '&body='
    + encodeURIComponent(body);

  document.getElementById('p1ph').style.display  = 'none';
  document.getElementById('p1out').style.display = 'block';
  document.getElementById('p1out').innerHTML = `
    <div class="orow">
      <div class="otitle">Email Preview</div>
      <div style="display:flex;gap:8px">
        <button class="abtn" onclick="copyEmail()">📋 Copy email</button>
        <button class="abtn" onclick="window.open('${gmailUrl}','_blank')">✉️ Open in Gmail</button>
      </div>
    </div>
    <div class="chips">
      ${['Property address', 'Annual rent', 'Council auto-filled', 'Gale day auto-filled']
        .map(c => `<span class="chip g">✓ ${c}</span>`).join('')}
    </div>
    <div class="ecard">
      <div class="emeta">
        <div class="emrow"><span class="emk">Subject</span><strong>${esc(sub)}</strong></div>
      </div>
      <div class="ebody">${esc(body)}</div>
    </div>`;
}

function copyEmail() {
  navigator.clipboard.writeText(p1Email).then(() => alert('Email copied to clipboard!'));
}
