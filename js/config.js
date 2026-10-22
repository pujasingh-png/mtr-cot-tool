// ═══════════════════════════════════════════════════
// CONFIG — SharePoint / Microsoft Entra settings
// Fill these in once (see DEPLOY.md). They are not secrets:
// a SPA client ID is public by design.
// ═══════════════════════════════════════════════════

const SP_CONFIG = {
  // Entra ID → App registrations → your app → Overview
  clientId: '',   // "Application (client) ID"
  tenantId: '',   // "Directory (tenant) ID"

  // SharePoint link to MTR_Data_Live.xlsx
  // (in SharePoint: file → ⋯ → Copy link). Users can override it in the app.
  mtrFileUrl: ''
};
