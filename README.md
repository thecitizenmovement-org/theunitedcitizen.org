# Deploying the United Citizens Movement site to thecitizenmovement.org

Files in this folder are ready to publish as-is:
- `index.html` — the complete site, self-contained (all assets inlined).
- `CNAME` — tells GitHub Pages the custom domain is thecitizenmovement.org.

## Steps (free, ~20 minutes)

### 1. GitHub account + repository
1. Create a free account at github.com (if you don't have one).
2. Create a new public repository named `thecitizenmovement.org`.
3. Upload both files (`index.html` and `CNAME`) to the repository root
   (Add file → Upload files, then Commit changes).

### 2. Turn on GitHub Pages
1. In the repo: Settings → Pages.
2. Source: Deploy from a branch → Branch: `main`, folder `/ (root)` → Save.
3. Under "Custom domain," enter `thecitizenmovement.org` → Save.
   (The CNAME file already in the repo does the same thing.)

### 3. Point the domain at GitHub (IONOS DNS)
In your IONOS control panel → Domains → thecitizenmovement.org → DNS:
- Add four A records for `@` pointing to:
  - 185.199.108.153
  - 185.199.109.153
  - 185.199.110.153
  - 185.199.111.153
- Add a CNAME record for `www` pointing to `<your-github-username>.github.io`
  (replace with your actual GitHub username).
- Remove any old A records for `@` that pointed elsewhere (e.g. the IONOS
  placeholder page).

DNS changes can take up to 24 hours to spread, usually under an hour.
GitHub will issue the HTTPS certificate automatically once DNS resolves.

## If you get stuck
Hana can walk through any of these steps with you, or do the GitHub/IONOS
clicks in the browser once you're signed in.
