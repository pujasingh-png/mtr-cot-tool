// ═══════════════════════════════════════════════════
// PHASE 3 — LIR document generation & QC
// ═══════════════════════════════════════════════════

async function genLIR() {
  const p = selProp; if (!p) return;
  const bor = p.res   || '—';
  const adr = p.addr;
  const eir = p.eir   || '';
  const fol = p.folio || '';

  // Reset download button
  const dlBtn = document.getElementById('p3dlBtn');
  dlBtn.style.display = 'none';
  dlBtn.textContent   = '⬇ Download .docx';

  document.getElementById('p3ph').style.display  = 'none';
  document.getElementById('p3out').style.display = 'block';
  document.getElementById('pv3bor').textContent  = bor;
  document.getElementById('pv3adr').textContent  = adr;
  document.getElementById('pv3eir').textContent  = eir;
  document.getElementById('pv3fol').textContent  = fol || '(not available)';
  document.getElementById('pv3dat').textContent  = '—';

  runLIRQC(adr, fol);
  await genLIRDocx(bor, adr, eir, fol);
}

// ── Final QC — LIR vs COT ──

function runLIRQC(adr, fol) {
  const qcEl = document.getElementById('p3qc');
  if (!cotText) { qcEl.style.display = 'none'; return; }
  qcEl.style.display = 'block';

  const nm     = s => String(s).toLowerCase().replace(/[,.\s]+/g, ' ').trim();
  const checks = [];
  const parts  = adr.split(',').map(s => s.trim()).filter(Boolean);
  const mc     = parts.filter(pt => nm(cotText).includes(nm(pt))).length;
  const aOk    = mc >= Math.max(1, parts.length - 1);
  checks.push({
    lbl: 'Property address matches COT',
    ok:  aOk,
    fnd: aOk ? 'Matched in COT ✓' : 'Not fully matched — verify manually'
  });
  if (fol) {
    const fOk = nm(cotText).includes(nm(fol));
    checks.push({lbl: 'Folio number matches COT', ok: fOk, fnd: fOk ? 'Found in COT ✓' : 'Not found — verify manually'});
  } else {
    checks.push({lbl: 'Folio number', ok: false, fnd: 'Not in database'});
  }
  document.getElementById('p3qcItems').innerHTML = checks.map(c =>
    `<div class="qc-item ${c.ok ? 'ok' : 'fail'}">
      <div class="qc-ico">${c.ok ? '✅' : '❌'}</div>
      <div><div class="qc-lbl">${esc(c.lbl)}</div><div class="qc-val">${esc(c.fnd)}</div></div>
    </div>`).join('');
}

// ── .docx generation ──

async function genLIRDocx(bor, adr, eir, fol) {
  try {
    const rows = [
      ["Name of Lessor:",                                            "IH MTR VII DAC acting through its general partner Manustin Holdings LTD trading as Irish Homes"],
      ["Address of Lessor:",                                         "FDW House, Blackthorn Business Park, Coes Road, Dundalk, Louth"],
      ["Contact Name for the Lessor including email address:",       "Ann Cowan\naccounts@irishhomes.ie"],
      ["Lessor’s Solicitor’s name and address:",          "Grainne Loughnane\nKane Tuohy LLP\nHambledon House\n19-26 Pembroke Street Lower\nDublin 2"],
      ["Lessor’s Surveyor’s name and address:",           "Anthony Gannon\nPremier Irish Homes\nUnit 35, Orion Business Park\nBallycoolin, Dublin 15, D15 KP74"],
      ["Borrower(s) Name:",                                          bor],
      ["Property address:",                                          adr],
      ["Eircode:",                                                   eir || ""],
      ["Folio No:",                                                  fol || ""],
      ["Draft Certificate of Title included: (Required)",           "Yes"],
      ["Lease Term:",                                                "25 Years"],
      ["Target Date:",                                               ""],
    ];

    // XML-escape helper (local to avoid any global naming conflict)
    const xe = s => String(s || "")
      .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;").replace(/'/g, "&apos;");

    // Convert a string with \n into multiple runs separated by <w:br/>
    const makeRuns = (text, bold = false) => {
      const parts = String(text || "").split("\n");
      return parts.map((p, i) =>
        `<w:r>${bold
          ? '<w:rPr><w:b/><w:sz w:val="20"/><w:szCs w:val="20"/></w:rPr>'
          : '<w:rPr><w:sz w:val="20"/><w:szCs w:val="20"/></w:rPr>'}` +
        `<w:t xml:space="preserve">${xe(p)}</w:t></w:r>` +
        (i < parts.length - 1 ? '<w:r><w:br/></w:r>' : '')
      ).join("");
    };

    const tableRowsXml = rows.map(([label, value]) => `
      <w:tr>
        <w:tc>
          <w:tcPr>
            <w:tcW w:w="4000" w:type="dxa"/>
            <w:tcBorders>
              <w:top w:val="single" w:sz="6" w:space="0" w:color="000000"/>
              <w:left w:val="single" w:sz="6" w:space="0" w:color="000000"/>
              <w:bottom w:val="single" w:sz="6" w:space="0" w:color="000000"/>
              <w:right w:val="single" w:sz="6" w:space="0" w:color="000000"/>
            </w:tcBorders>
            <w:shd w:val="clear" w:color="auto" w:fill="F2F2F2"/>
          </w:tcPr>
          <w:p><w:pPr><w:spacing w:before="60" w:after="60"/></w:pPr>${makeRuns(label, true)}</w:p>
        </w:tc>
        <w:tc>
          <w:tcPr>
            <w:tcW w:w="5606" w:type="dxa"/>
            <w:tcBorders>
              <w:top w:val="single" w:sz="6" w:space="0" w:color="000000"/>
              <w:left w:val="single" w:sz="6" w:space="0" w:color="000000"/>
              <w:bottom w:val="single" w:sz="6" w:space="0" w:color="000000"/>
              <w:right w:val="single" w:sz="6" w:space="0" w:color="000000"/>
            </w:tcBorders>
          </w:tcPr>
          <w:p><w:pPr><w:spacing w:before="60" w:after="60"/></w:pPr>${makeRuns(value)}</w:p>
        </w:tc>
      </w:tr>`).join("");

    const documentXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:wpc="http://schemas.microsoft.com/office/word/2010/wordprocessingCanvas"
  xmlns:mc="http://schemas.openxmlformats.org/markup-compatibility/2006"
  xmlns:o="urn:schemas-microsoft-com:office:office"
  xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"
  xmlns:m="http://schemas.openxmlformats.org/officeDocument/2006/math"
  xmlns:v="urn:schemas-microsoft-com:vml"
  xmlns:wp14="http://schemas.microsoft.com/office/word/2010/wordprocessingDrawing"
  xmlns:wp="http://schemas.openxmlformats.org/drawingml/2006/wordprocessingDrawing"
  xmlns:w10="urn:schemas-microsoft-com:office:word"
  xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"
  xmlns:w14="http://schemas.microsoft.com/office/word/2010/wordml"
  xmlns:wpg="http://schemas.microsoft.com/office/word/2010/wordprocessingGroup"
  xmlns:wpi="http://schemas.microsoft.com/office/word/2010/wordprocessingInk"
  xmlns:wne="http://schemas.microsoft.com/office/word/2006/wordml"
  xmlns:wps="http://schemas.microsoft.com/office/word/2010/wordprocessingShape"
  mc:Ignorable="w14 wp14">
<w:body>
  <w:p>
    <w:pPr>
      <w:jc w:val="center"/>
      <w:spacing w:before="0" w:after="240"/>
    </w:pPr>
    <w:r>
      <w:rPr><w:b/><w:u w:val="single"/><w:sz w:val="24"/><w:szCs w:val="24"/></w:rPr>
      <w:t>Information Required for the Pre-population of the AFL and Lease</w:t>
    </w:r>
  </w:p>
  <w:tbl>
    <w:tblPr>
      <w:tblW w:w="9606" w:type="dxa"/>
      <w:tblBorders>
        <w:insideH w:val="single" w:sz="6" w:space="0" w:color="000000"/>
        <w:insideV w:val="single" w:sz="6" w:space="0" w:color="000000"/>
      </w:tblBorders>
      <w:tblLayout w:type="fixed"/>
    </w:tblPr>
    <w:tblGrid>
      <w:gridCol w:w="4000"/>
      <w:gridCol w:w="5606"/>
    </w:tblGrid>
    <w:tr>
      <w:tc>
        <w:tcPr>
          <w:tcW w:w="9606" w:type="dxa"/>
          <w:gridSpan w:val="2"/>
          <w:tcBorders>
            <w:top w:val="single" w:sz="6" w:space="0" w:color="000000"/>
            <w:left w:val="single" w:sz="6" w:space="0" w:color="000000"/>
            <w:bottom w:val="single" w:sz="6" w:space="0" w:color="000000"/>
            <w:right w:val="single" w:sz="6" w:space="0" w:color="000000"/>
          </w:tcBorders>
          <w:shd w:val="solid" w:color="8EAADB" w:fill="8EAADB"/>
        </w:tcPr>
        <w:p>
          <w:pPr><w:spacing w:before="80" w:after="80"/></w:pPr>
          <w:r><w:rPr><w:b/><w:color w:val="FFFFFF"/><w:sz w:val="22"/><w:szCs w:val="22"/></w:rPr><w:t>Lessor</w:t></w:r>
        </w:p>
      </w:tc>
    </w:tr>
    ${tableRowsXml}
  </w:tbl>
  <w:sectPr>
    <w:pgSz w:w="11906" w:h="16838"/>
    <w:pgMar w:top="1080" w:right="1080" w:bottom="1080" w:left="1080"/>
  </w:sectPr>
</w:body>
</w:document>`;

    const contentTypes = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>
</Types>`;

    const rels = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>
</Relationships>`;

    const wordRels = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
</Relationships>`;

    const zip = new JSZip();
    zip.file("[Content_Types].xml", contentTypes);
    zip.file("_rels/.rels", rels);
    zip.file("word/document.xml", documentXml);
    zip.file("word/_rels/document.xml.rels", wordRels);

    const buf  = await zip.generateAsync({
      type: "arraybuffer",
      mimeType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    });
    const blob = new Blob([buf], {
      type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    });

    const firstPart = adr.split(",")[0].trim();
    const filename  = "2. HA Lease Information Requirements " + firstPart + ".docx";
    const url       = URL.createObjectURL(blob);
    const dlBtn     = document.getElementById("p3dlBtn");
    dlBtn.href             = url;
    dlBtn.download         = filename;
    dlBtn.style.display    = "inline-flex";
    dlBtn.textContent      = "⬇️  Download " + filename;

  } catch(err) {
    alert("Error generating LIR: " + err.message);
    console.error(err);
  }
}
