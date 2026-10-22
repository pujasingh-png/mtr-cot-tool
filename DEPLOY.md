# Deploying the MTR COT Tool (Azure Static Web Apps + SharePoint)

Everything here uses free tiers. Do it once; after that every push to `main` redeploys automatically.

## 1. Create the Static Web App (Azure, Free plan)

1. Sign in at <https://portal.azure.com>. If you have no subscription, create a free one
   (Microsoft asks for a card for identity verification; the Free plan of Static Web Apps costs $0).
2. **Create a resource → Static Web App**
   - Plan type: **Free**
   - Deployment source: **Other** (this repo already contains the GitHub Actions workflow)
3. When it's created, open it and copy:
   - the **URL** (e.g. `https://happy-river-0a1b2c3.azurestaticapps.net`) — this is the link for the team
   - **Manage deployment token** → copy the token
4. In GitHub: repo → **Settings → Secrets and variables → Actions → New repository secret**
   - Name: `AZURE_STATIC_WEB_APPS_API_TOKEN`
   - Value: the token from step 3
5. Push to `main` (or run the workflow from the **Actions** tab). The site goes live at the URL above.

## 2. Register the app in Microsoft Entra ID (free, part of Microsoft 365)

1. <https://entra.microsoft.com> → **Applications → App registrations → New registration**
   - Name: `MTR COT Tool`
   - Supported account types: **Accounts in this organizational directory only**
   - Redirect URI: platform **Single-page application (SPA)**, value
     `https://<your-static-web-app-url>/redirect.html`
2. After creating it, under **Authentication** add a second SPA redirect URI for local testing:
   `http://localhost:8743/redirect.html`
3. **API permissions → Add a permission → Microsoft Graph → Delegated → `Files.Read.All`**.
   If your tenant blocks user consent, an admin clicks **Grant admin consent for Irish Homes**.
4. From **Overview**, copy the **Application (client) ID** and **Directory (tenant) ID**.

## 3. Point the app at the SharePoint file

1. In SharePoint, open the folder with `MTR_Data_Live.xlsx` → **⋯ → Copy link**.
   The link only needs to work for people in Irish Homes; each user's own SharePoint access is enforced.
2. Edit `js/config.js`:

   ```js
   const SP_CONFIG = {
     clientId:   '<Application (client) ID>',
     tenantId:   '<Directory (tenant) ID>',
     mtrFileUrl: '<SharePoint link to MTR_Data_Live.xlsx>'
   };
   ```
3. Commit and push — the workflow redeploys.

## 4. Share with the team

- Send the Static Web App URL, or in a Teams channel click **+ → Website** and paste it to pin it as a tab.
- On first use, each person clicks **☁ Load from SharePoint**, signs in with their work account and
  (if prompted) accepts the permission. After that it loads the latest file in one click.
- Manual upload still works as a fallback. **Change file link** lets a user point at a different file
  (saved in their own browser only).

## How access is protected

The site itself is public, but it contains no data. The spreadsheet is only fetched after a user signs in
with their Irish Homes account, and only if they already have access to it in SharePoint.
