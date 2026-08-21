# Full Setup Guide — Evergreen Pages

This walks through everything from zero to a live, working PDF store: installing
Node, setting up the free database, getting sandbox payment credentials, running it
locally, publishing your first product, testing a full purchase, and deploying.

---

## Part 1 — Install Node.js

1. Go to [nodejs.org](https://nodejs.org) and install the **LTS** version (18 or higher).
2. Confirm it worked:
   ```bash
   node -v
   npm -v
   ```
   Both should print a version number.

---

## Part 2 — Get the project running locally

1. Unzip `evergreen-pages-pdf-store.zip` into a folder.
2. Open a terminal in that folder and install dependencies:
   ```bash
   npm install
   ```
3. Copy the environment template:
   ```bash
   cp .env.example .env
   ```
   You'll fill this in over the next two parts — leave it open in an editor.

---

## Part 3 — Set up the database (MongoDB Atlas, free)

1. Go to [mongodb.com/cloud/atlas/register](https://www.mongodb.com/cloud/atlas/register) and create a free account.
2. When prompted, create a new **free (M0) cluster** — any cloud provider/region is fine, pick one close to you.
3. **Create a database user:**
   - Left sidebar → **Database Access** → **Add New Database User**
   - Choose a username and password (autogenerate is fine — save it somewhere)
   - Give it "Read and write to any database" permission
4. **Allow network access:**
   - Left sidebar → **Network Access** → **Add IP Address**
   - Click **Allow Access From Anywhere** (`0.0.0.0/0`) — simplest for getting started; you can restrict later
5. **Get your connection string:**
   - Go to **Database** → click **Connect** on your cluster → **Drivers**
   - Copy the connection string, it looks like:
     ```
     mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority
     ```
   - Replace `<username>` and `<password>` with the database user you made
   - Add a database name before the `?`, e.g. `.../pdfstore?retryWrites=true...`
6. Paste the full string into `.env` as `MONGODB_URI`.

---

## Part 4 — Set up sandbox payments (SSLCommerz, free)

1. Go to [developer.sslcommerz.com/registration](https://developer.sslcommerz.com/registration/) and register for a free **sandbox** account.
2. Verify your email, then log into the sandbox panel.
3. Find your **Store ID** and **Store Password** (also called API/Secret key) under your store's settings/integration page.
4. In `.env`, set:
   ```
   SSLCOMMERZ_STORE_ID=your_sandbox_store_id
   SSLCOMMERZ_STORE_PASSWORD=your_sandbox_store_password
   SSLCOMMERZ_IS_LIVE=false
   ```
5. Sandbox mode lets you test full checkouts with fake card/mobile-banking details — SSLCommerz's sandbox checkout page shows you dummy test numbers to use.

---

## Part 5 — Finish your `.env` file

Fill in the remaining values:

```
PORT=3000
SITE_URL=http://localhost:3000

SESSION_SECRET=<any long random string>

ADMIN_USER=admin
ADMIN_PASS=<pick a real password, not the default>

MANUAL_BKASH_NUMBER=<your bKash number for manual payments>
MANUAL_NAGAD_NUMBER=<your Nagad number for manual payments>
```

`SITE_URL` matters — SSLCommerz uses it to know where to send buyers back after
paying. Keep it as `http://localhost:3000` for now; you'll update it once deployed.

---

## Part 6 — Run it

```bash
npm start
```

You should see:
```
MongoDB connected
PDF store running on port 3000
```

Visit `http://localhost:3000` — you'll see an empty catalog. Visit
`http://localhost:3000/admin/login.html` and log in with the `ADMIN_USER` /
`ADMIN_PASS` you set.

---

## Part 7 — Prepare your PDF and cover image on Google Drive

**The PDF itself:**
1. Upload the PDF to Google Drive.
2. Right-click it → **Share** → change access to **"Anyone with the link"** → set role to **Viewer**.
3. Copy the link (looks like `https://drive.google.com/file/d/FILE_ID/view?usp=sharing`).
4. That's the exact link you'll paste into **Drive download link** in the admin panel.

**The cover image** (shown on the product card — needs to be a direct image URL, not a Drive "view" page):
- Easiest: upload the cover image to [imgur.com](https://imgur.com) (no account needed) and copy the **direct image link** (ends in `.jpg`/`.png`).
- Alternative: host it on Drive, get the file ID from the share link, and use:
  `https://drive.google.com/uc?export=view&id=FILE_ID` — this works but Google
  occasionally rate-limits hot-linked Drive images, so Imgur or another image host
  is more reliable for the cover.

---

## Part 8 — Publish your first product

1. In the admin panel, click **Add product**.
2. Fill in:
   - **Title / Description / Price (BDT) / Category**
   - **Cover image URL** — from Part 7
   - **Google Drive download link** — from Part 7
3. Save. It appears on the homepage immediately.

---

## Part 9 — Test a full purchase (sandbox)

**Online payment:**
1. From the homepage, open your product → **Buy this PDF** → fill in your details → **Pay online**.
2. You'll land on SSLCommerz's sandbox checkout — choose any test payment method shown there and use the dummy test credentials SSLCommerz displays on that page.
3. On success, you're redirected back and the order is marked `paid` automatically.
4. Go to `/track.html`, enter your Order ID + the email you checked out with → your Drive link appears.

**Manual payment:**
1. Same flow, but choose **bKash / Nagad (manual)**, enter any test sender number/Transaction ID, and submit.
2. In the admin panel → **Orders** tab, find the order (status `pending`) → **Review** → **Approve**.
3. Track the order again — the link now appears.

---

## Part 10 — Deploy (Render, free tier)

1. Push the project to a GitHub repository (create one, then `git init`, `git add .`, `git commit`, `git push`).
2. Go to [render.com](https://render.com), sign up, click **New → Web Service**, and connect your GitHub repo.
3. Settings:
   - **Build command:** `npm install`
   - **Start command:** `npm start`
4. Under **Environment**, add every variable from your `.env` file (Render won't read `.env` from the repo — you paste them into its dashboard).
5. Deploy. Once live, copy your Render URL (e.g. `https://evergreen-pages.onrender.com`).
6. Go back into Render's environment settings, update `SITE_URL` to that live URL, and redeploy — this step is required, or SSLCommerz's redirect-back URLs will point to `localhost` and fail.

Railway or Vercel (as a Node web service) follow the same pattern: build command,
start command, environment variables, then set `SITE_URL` to your live domain.

---

## Part 11 — Go live with real payments

When you're ready to accept real money:
1. Apply for a **live** SSLCommerz merchant account (requires business verification).
2. Replace `SSLCOMMERZ_STORE_ID` / `SSLCOMMERZ_STORE_PASSWORD` with the live credentials.
3. Set `SSLCOMMERZ_IS_LIVE=true`.
4. Redeploy.

---

## Troubleshooting

| Problem | Likely cause |
|---|---|
| `MongoDB connection failed` on startup | Wrong username/password in `MONGODB_URI`, or your IP isn't allowed in Atlas Network Access |
| SSLCommerz checkout says invalid store | Store ID/password typo, or mixing sandbox credentials with `SSLCOMMERZ_IS_LIVE=true` (or vice versa) |
| Redirect after payment goes to `localhost` in production | `SITE_URL` wasn't updated after deploying — update it and redeploy |
| Cover image doesn't show on the product card | The image URL isn't a direct image link (Drive "view" links won't work directly — see Part 7) |
| Admin login doesn't work | Check `ADMIN_USER` / `ADMIN_PASS` in your deployed environment match what you're typing |
