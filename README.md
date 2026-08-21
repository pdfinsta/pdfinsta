# Evergreen Pages — PDF Storefront

A small storefront for selling PDFs that live on Google Drive. Buyers pay online
(SSLCommerz — supports bKash, Nagad, Rocket, cards) or send money manually and submit
a Transaction ID for approval. Either way, once payment is confirmed, the buyer's
personal order-tracking page reveals the Google Drive download link.

## What's included

- **Storefront** (`/`, `/product.html`, `/checkout.html`, `/success.html`, `/track.html`)
- **Admin panel** (`/admin/login.html`, `/admin/dashboard.html`) — add/edit/hide/delete
  products, and review + approve/reject manual payments
- **Backend** — Node.js + Express + MongoDB (Mongoose), SSLCommerz sandbox integration

The Drive link for a product is **never** sent to the browser until an order's status
is `paid` or `approved` — the public product API strips it out.

## 1. Install

```bash
npm install
cp .env.example .env
```

Fill in `.env`:

| Variable | What it is |
|---|---|
| `MONGODB_URI` | Free cluster from [MongoDB Atlas](https://www.mongodb.com/cloud/atlas/register). Create a cluster → Database Access (user/password) → Network Access (allow `0.0.0.0/0` for simplicity) → get the connection string. |
| `SESSION_SECRET` | Any long random string. |
| `ADMIN_USER` / `ADMIN_PASS` | Your admin login. Change the default password. |
| `SSLCOMMERZ_STORE_ID` / `SSLCOMMERZ_STORE_PASSWORD` | Free sandbox credentials from [SSLCommerz Developer Registration](https://developer.sslcommerz.com/registration/). Keep `SSLCOMMERZ_IS_LIVE=false` until you're ready to go live with a real merchant account. |
| `MANUAL_BKASH_NUMBER` / `MANUAL_NAGAD_NUMBER` | The personal/merchant numbers you want buyers to send money to for the manual option. |
| `SITE_URL` | Your site's public URL (used to build SSLCommerz callback URLs). Update this once deployed. |

Run locally:

```bash
npm start
```

Visit `http://localhost:3000`. Admin panel: `http://localhost:3000/admin/login.html`.

## 2. Add your first product

1. Log into `/admin/login.html`
2. Click **Add product**
3. Fill in title, description, price, category
4. **Cover image URL** — any publicly reachable image link (Imgur, a Drive image
   shared as "Anyone with the link" and converted to a direct image URL, etc.)
5. **Google Drive download link** — the actual PDF's share link, set to
   *"Anyone with the link can view"* in Google Drive's sharing settings

That's it — the product appears on the homepage immediately.

## 3. How payment unlocks the download

- **Online (SSLCommerz):** buyer is redirected to the gateway. On success, SSLCommerz
  posts back to `/api/orders/ssl/success`, the order is marked `paid`, and the buyer's
  tracking page immediately shows the Drive link.
- **Manual (bKash/Nagad):** buyer sends money to the number(s) you configured, then
  submits the sender number + Transaction ID on the checkout form. The order sits as
  `pending` until you review it in **Admin → Orders → Review**, check the Transaction
  ID in your bKash/Nagad app, and click **Approve** (or **Reject**).
- Buyers check status/download anytime at `/track.html` using their **Order ID** +
  the **email** they checked out with (this pair acts as a simple access key — no
  buyer accounts needed).

## 4. Deploying (Render / Railway, free tier)

1. Push this project to a GitHub repo.
2. On Render: **New → Web Service** → connect the repo.
   - Build command: `npm install`
   - Start command: `npm start`
3. Add all the variables from `.env` in the service's **Environment** settings.
4. Once deployed, update `SITE_URL` in the environment to your live URL
   (e.g. `https://your-app.onrender.com`) and redeploy — this is required for
   SSLCommerz's success/fail/cancel callback URLs to work.
5. In your SSLCommerz sandbox panel, nothing extra is needed — callback URLs are
   sent per-transaction from the server.

Railway and Vercel (as a Node server, not static) work the same way — install
command, start command, environment variables, then set `SITE_URL` to the deployed
domain.

## 5. Going live with real payments

When ready: register a live SSLCommerz merchant account, swap in the live
`SSLCOMMERZ_STORE_ID` / `SSLCOMMERZ_STORE_PASSWORD`, and set
`SSLCOMMERZ_IS_LIVE=true`.

## Notes on security

- The Drive link is only ever included in API responses for orders whose status is
  `paid` or `approved`.
- The admin panel uses a single shared username/password stored in `.env` — fine for
  a solo operator, but if you ever add more admins, upgrade to per-user accounts.
- Consider making the Drive files "view-only" rather than downloadable-and-editable,
  and periodically rotate the share link for high-value PDFs if you're worried about
  link sharing after purchase.
