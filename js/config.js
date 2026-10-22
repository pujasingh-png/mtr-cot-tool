// ═══════════════════════════════════════════════════
// CONFIG — SharePoint / Microsoft Entra settings
// Fill these in once (see DEPLOY.md). They are not secrets:
// a SPA client ID is public by design.
// ═══════════════════════════════════════════════════

const SP_CONFIG = {
  // Entra ID → App registrations → your app → Overview
  clientId: '5c0ae860-87e8-4bed-91d4-6111f3b9a9fa',   // "Application (client) ID"
  tenantId: 'bdbc2541-3143-47b2-9f8c-0dacabbcf041',   // "Directory (tenant) ID"

  // SharePoint link to MTR_Data_Live.xlsx
  // (in SharePoint: file → ⋯ → Copy link). Users can override it in the app.
  mtrFileUrl: ''
};
