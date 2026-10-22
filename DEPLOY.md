# Deploying the MTR COT Tool (Render + SharePoint)

Everything here uses free tiers and needs no card or Azure subscription.
Render redeploys automatically on every push to `main`.

## 1. Host on Render (free static site)

If the site is already on Render, skip to step 2 — just note its URL
(e.g. `https://mtr-cot-tool.onrender.com`).

1. Sign up at <https://render.com> with GitHub.
2. **New → Static Site** → select the `mtr-cot-tool` repo.
3. Settings:
   - Branch: `main`
   - Build command: *(leave empty)*
   - Publish directory: `.`
4. **Create Static Site**. Copy the URL once it's live — this is the link for the team.

## 2. Register the app in Microsoft Entra ID (free, part of Microsoft 365)

1. <https://entra.microsoft.com> → **Applications → App registrations → New registration**
   - Name: `MTR COT Tool`
   - Supported account types: **Accounts in this organizational directory only**
   - Redirect URI: platform **Single-page application (SPA)**, value
     `https://<your-render-url>/redirect.html`
2. Under **Authentication**, optionally add `http://localhost:8743/redirect.html` for local testing.
3. **API permissions → Add a permission → Microsoft Graph → Delegated → `Files.Read.All`**.
   If your tenant blocks user consent, an admin clicks **Grant admin consent for Irish Homes**.
4. From **Overview**, copy the **Application (client) ID** and **Directory (tenant) ID**.

## 3. Point the app at the SharePoint file

1. In SharePoint, `MTR_Data_Live.xlsx` → **⋯ → Copy link** (People in Irish Homes / existing access).
2. Edit `js/config.js`:

   ```js
   const SP_CONFIG = {
     clientId:   '<Application (client) ID>',
     tenantId:   '<Directory (tenant) ID>',
     mtrFileUrl: '<SharePoint link to MTR_Data_Live.xlsx>'
   };
   ```
3. Commit and push — Render redeploys.

## 4. Share with the team

- Send the Render URL, or in a Teams channel click **+ → Website** and paste it to pin it as a tab.
- On first use, each person clicks **☁ Load from SharePoint**, signs in with their work account and
  (if prompted) accepts the permission. After that it loads the latest file in one click.
- Manual upload still works as a fallback. **Change file link** lets a user point at a different file
  (saved in their own browser only).

## How access is protected

The site itself is public, but it contains no data. The spreadsheet goes straight from SharePoint to the
user's browser, only after they sign in with their Irish Homes account and only if they already have
access to it. Protect the GitHub and Render accounts with two-factor sign-in, since they control the code.
