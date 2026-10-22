// ═══════════════════════════════════════════════════
// SHAREPOINT — sign-in (MSAL) & file download (Microsoft Graph)
// ═══════════════════════════════════════════════════

const SP_SCOPES   = ['Files.Read.All'];
const SP_URL_KEY  = 'mtrFileUrl';   // localStorage key for a per-user file link override

let msalApp = null;

function spConfigured() {
  return !!(SP_CONFIG.clientId && SP_CONFIG.tenantId && window.msal);
}

async function spInit() {
  if (msalApp || !spConfigured()) return msalApp;
  msalApp = new msal.PublicClientApplication({
    auth: {
      clientId:    SP_CONFIG.clientId,
      authority:   'https://login.microsoftonline.com/' + SP_CONFIG.tenantId,
      redirectUri: window.location.origin + '/redirect.html'
    },
    cache: {cacheLocation: 'localStorage'}
  });
  await msalApp.initialize();
  return msalApp;
}

async function spGetToken() {
  await spInit();
  let account = msalApp.getAllAccounts()[0];
  if (!account) {
    const res = await msalApp.loginPopup({scopes: SP_SCOPES});
    account = res.account;
  }
  try {
    return (await msalApp.acquireTokenSilent({scopes: SP_SCOPES, account})).accessToken;
  } catch (err) {
    return (await msalApp.acquireTokenPopup({scopes: SP_SCOPES, account})).accessToken;
  }
}

function spAccountName() {
  const a = msalApp && msalApp.getAllAccounts()[0];
  return a ? (a.name || a.username) : '';
}

// ── File link handling ──

function spFileUrl() {
  let saved = '';
  try { saved = localStorage.getItem(SP_URL_KEY) || ''; } catch (e) {}
  return saved || SP_CONFIG.mtrFileUrl;
}

function spSetFileUrl(url) {
  try {
    if (url) localStorage.setItem(SP_URL_KEY, url);
    else     localStorage.removeItem(SP_URL_KEY);
  } catch (e) {}
}

// Graph "shares" API accepts any SharePoint/OneDrive link encoded as u!<base64url>
function spShareId(url) {
  const b64 = btoa(unescape(encodeURIComponent(url)));
  return 'u!' + b64.replace(/=+$/, '').replace(/\//g, '_').replace(/\+/g, '-');
}

async function spDownload(url) {
  const token = await spGetToken();
  const base  = 'https://graph.microsoft.com/v1.0/shares/' + spShareId(url) + '/driveItem';
  const hdrs  = {Authorization: 'Bearer ' + token};

  const meta = await fetch(base + '?$select=name,lastModifiedDateTime', {headers: hdrs});
  if (!meta.ok) throw new Error(await spError(meta));
  const item = await meta.json();

  const res = await fetch(base + '/content', {headers: hdrs});
  if (!res.ok) throw new Error(await spError(res));
  return {name: item.name, modified: item.lastModifiedDateTime, data: await res.arrayBuffer()};
}

async function spError(res) {
  if (res.status === 404) return 'File not found. Check the SharePoint link.';
  if (res.status === 403) return 'You do not have access to this file in SharePoint.';
  try {
    const j = await res.json();
    return (j.error && j.error.message) || ('HTTP ' + res.status);
  } catch (e) { return 'HTTP ' + res.status; }
}
