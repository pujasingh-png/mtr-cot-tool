// ═══════════════════════════════════════════════════
// COUNTY COUNCIL DATA
// One entry per local authority — full name, postal address, eircode, gale day.
// ═══════════════════════════════════════════════════
const CC = {
  "Carlow CC":          {full:"Carlow County Council",                  addr:"County Buildings, Athy Road, Carlow, R93 E7R7",                                                   eir:"R93 E7R7",  gale:"Last Monday of each Month"},
  "Cavan CC":           {full:"Cavan County Council",                   addr:"Cavan Courthouse, Farnham Street, Cavan, Co. Cavan, H12 R6V2",                                   eir:"H12 R6V2",  gale:"Flexible"},
  "Clare CC":           {full:"Clare County Council",                   addr:"New Road, Ennis, Co. Clare, V95 DXP2",                                                            eir:"V95 DXP2",  gale:"Monthly on 1st or 2nd Friday of every month"},
  "Cork CC":            {full:"Cork County Council",                    addr:"County Hall, Carrigrohane Road, Cork, T12 R2NC",                                                  eir:"T12 R2NC",  gale:"Quarterly in advance"},
  "Cork City":          {full:"Cork City Council",                      addr:"City Hall, Anglesea Street, Cork, T12 T997",                                                      eir:"T12 T997",  gale:"1st Friday of every Quarter"},
  "Donegal CC":         {full:"Donegal County Council",                 addr:"Public Service Centre, Drumlonagher, Donegal, Co. Donegal, F94 DK6C",                            eir:"F94 DK6C",  gale:"Last Friday of every month"},
  "DC-DCC":             {full:"Dublin City Council",                    addr:"Civic Offices, Wood Quay, Dublin 8, D08 RF3F",                                                   eir:"D08 RF3F",  gale:"The first Monday after the first Friday of every month (except where a bank holiday falls in which case it will be the first Tuesday)"},
  "DC-DLR CC":          {full:"Dun Laoghaire Rathdown County Council", addr:"County Hall, Marine Road, Dún Laoghaire, Co.Dublin, A96 K6C9",                                  eir:"A96 K6C9",  gale:"Quarterly in advance"},
  "DC-FCC":             {full:"Fingal County Council",                  addr:"County Hall, Main Street, Swords, Co Dublin, K67 X8Y2",                                          eir:"K67 X8Y2",  gale:"First Friday of every month"},
  "DC-SDCC":            {full:"South Dublin County Council",            addr:"Leasing Section, County Hall, Tallaght, Dublin 24, D24 YNN5",                                    eir:"D24 YNN5",  gale:"Last Friday of the month"},
  "Galway CC":          {full:"Galway County Council",                  addr:"County Hall, Prospect Hill, Galway, H91 H6KX",                                                   eir:"H91 H6KX",  gale:"Last Thursday of the month"},
  "Galway City":        {full:"Galway City Council",                    addr:"City Hall, College Road, Galway, H91 X4K8",                                                      eir:"H91 X4K8",  gale:"First working day of the month"},
  "Kerry CC":           {full:"Kerry County Council",                   addr:"Voluntary Housing Section, Housing Department, Rathass, Tralee, Co. Kerry, V92 H7VT",            eir:"V92 H7VT",  gale:"First Friday of every month"},
  "Kildare CC":         {full:"Kildare County Council",                 addr:"Áras Chill Dara, Devoy Park, Naas, Co Kildare, W91 X77F",                                       eir:"W91 X77F",  gale:"Last day of each month"},
  "Kilkenny CC":        {full:"Kilkenny County Council",                addr:"Housing Department, Johns Green House, Johns Green, Kilkenny, R95 CX92",                         eir:"R95 CX92",  gale:"First Friday of every month"},
  "Laois CC":           {full:"Laois County Council",                   addr:"Áras an Chontae, JFL Avenue, Portlaoise, Co. Laois, R32 EHP9",                                  eir:"R32 EHP9",  gale:"The first day of every month"},
  "Leitrim CC":         {full:"Leitrim County Council",                 addr:"Áras An Chontae, St. George's Terrace, Carrick on Shannon, Co Leitrim, N41 PF67",               eir:"N41 PF67",  gale:"Last Tuesday or Wednesday of every month"},
  "Limerick City & Co": {full:"Limerick City & County Council",         addr:"City Hall, Merchants Quay, Limerick City, V94 EH90",                                             eir:"V94 EH90",  gale:"First Friday of every month"},
  "Longford CC":        {full:"Longford County Council",                addr:"Housing Section, Town Hall, Market Square, Longford, N39C5F2",                                   eir:"N39C5F2",   gale:"Last Friday of every month"},
  "Louth CC":           {full:"Louth County Council",                   addr:"County Hall, Millennium Centre, Dundalk, Co. Louth, A91 KFW6",                                   eir:"A91 KFW6",  gale:"First Thursday of every month"},
  "Mayo CC":            {full:"Mayo County Council",                    addr:"Housing Department, College House, Station Rd., Swinford, Co. Mayo, F12 V126",                   eir:"F12 V126",  gale:"First Friday of the month"},
  "Meath CC":           {full:"Meath County Council",                   addr:"Buvinda House, Dublin Road, Navan, Co. Meath, C15 Y291",                                         eir:"C15 Y291",  gale:"Quarterly in advance — First Friday in the Quarter"},
  "Monaghan CC":        {full:"Monaghan County Council",                addr:"County Offices, The Glen, Monaghan, H18 YT50",                                                   eir:"H18 YT50",  gale:"The last day of each Quarter"},
  "Offaly CC":          {full:"Offaly County Council",                  addr:"Áras an Chontae, Charleville Road, Tullamore, Co. Offaly, R35 F893",                            eir:"R35 F893",  gale:"First Saturday of each calendar month"},
  "Roscommon CC":       {full:"Roscommon County Council",               addr:"Housing Section, Áras an Chontae, Roscommon, County Roscommon, F42 VR98",                       eir:"F42 VR98",  gale:"First Friday of each month"},
  "Sligo CC":           {full:"Sligo County Council",                   addr:"County Hall, Riverside, Sligo, F91 V763",                                                        eir:"F91 Y763",  gale:"On the 10th Day of each Quarter (January, April, July, October)"},
  "Tipperary CC":       {full:"Tipperary County Council",               addr:"Civic Offices, Nenagh, Co Tipperary, E45 A099",                                                  eir:"E45 A099",  gale:"The last day of the month"},
  "Waterford City & Co":{full:"Waterford City & County Council",        addr:"Housing Department, Bailey's New Street, Waterford, X91 XH42",                                   eir:"X91 XH42",  gale:"First day of every month"},
  "Westmeath CC":       {full:"Westmeath County Council",               addr:"Aras An Chontae, Mount Street, Mullingar, Co. Westmeath, N91 FH4N",                             eir:"N91 FH4N",  gale:"The first day of each calendar month"},
  "Wexford CC":         {full:"Wexford County Council",                 addr:"County Hall, Carricklawn, Wexford, Y35 WY93",                                                    eir:"Y35 WY93",  gale:"First Tuesday of every month"},
  "Wicklow CC":         {full:"Wicklow County Council",                 addr:"Social Development (Housing & Community), Wicklow County Council, Station Road, Wicklow Town, A67 FW96", eir:"A67 FW96", gale:"On a monthly or Quarterly basis"},
};

// ── Excel column index map ──
const COL = {ID:0, ADDR:1, EIR:2, LA:3, FOLIO:4, RES:5, RES2:6, RENT:7};

// ── Shared application state ──
let allProps = [];   // full property list loaded from Excel
let selProp  = null; // currently selected property object
let cotText  = '';   // raw text extracted from uploaded COT document
let cotFile  = '';   // filename of uploaded COT document
let p1Email  = '';   // generated Phase 1 email content (subject + body)
