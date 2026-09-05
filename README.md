# KATAX Website — Kaya for Accounting & Tax Services Inc.

A 4-page site (Home, About, Services, Contact) plus a small backend that
serves it and handles the contact form.

```
katax-website/
├── frontend/           Static site — HTML, CSS, JS, assets
│   ├── index.html
│   ├── about.html
│   ├── services.html
│   ├── contact.html
│   ├── admin.html      admin dashboard (clients, messages, site content)
│   ├── css/styles.css
│   ├── js/main.js
│   └── assets/         logo.svg, favicon.svg
├── backend/             Node/Express server
│   ├── server.js        serves frontend/ + mounts the API
│   ├── db.js            Supabase client (all data lives in Supabase now)
│   ├── routes/contact.js, content.js, admin.js
│   ├── supabase-setup.sql   run once in Supabase to create tables + seed data
│   ├── package.json
│   └── .env.example
└── DESIGN.md            design rationale
```

## Run it

**Data now lives in Supabase (a free hosted database)** instead of local
JSON files — this means client records and messages survive server
restarts and redeploys, which matters once you're on a host with
non-persistent storage (most free tiers, including Render's).

### 1. Create a free Supabase project

1. Go to **[supabase.com](https://supabase.com)** → sign up (no credit card) → **New project**.
2. Pick any name/region/password (that password is for their dashboard, unrelated to your site).
3. Once the project is ready, go to **SQL Editor** → **New query**.
4. Open `backend/supabase-setup.sql` from this project, copy its entire
   contents, paste into the SQL editor, and click **Run**. This creates the
   three tables (`site_content`, `contacts`, `clients`) and pre-fills
   `site_content` with the current homepage text/services so the site
   isn't empty on first load.
5. Go to **Settings → API**. You'll need two values from this page:
   - **Project URL**
   - **service_role** key (not the "anon" key — the admin dashboard needs
     full read/write access)

### 2. Configure and run the server

```bash
cd backend
npm install
cp .env.example .env
```

Open `.env` and fill in:
- `SUPABASE_URL` and `SUPABASE_KEY` (from step 1 above)
- `ADMIN_PASSWORD` — any password of your choice, required for the admin
  dashboard to work

Then:

```bash
npm start
```

Then open **http://localhost:3000**. The frontend is served directly by the
backend, so there's only one server to run.

### Admin dashboard

Go to **http://localhost:3000/admin.html** and log in with the
`ADMIN_PASSWORD` you set. From there you can:

- **Manage a client database** — add, edit, and delete client records
  (name, phone, email, service, status: Lead/Active/Completed/On Hold, and
  notes). This is separate from website contact-form messages — it's your
  own running list of actual clients.
- **View and delete messages** sent through the contact form.
- **Edit site content** — the homepage headline/subtext, phone/email/address
  (updates everywhere they appear across the site), and the services list
  (title + short description for each; add or remove services).

Clients, messages, and site content all live in your Supabase project now
(tables `clients`, `contacts`, `site_content`) — changes take effect
immediately, no redeploy needed, no code to touch. There's no separate
username, just the one shared password. The services page's longer bullet
lists under each service are static HTML and aren't editable from the
dashboard; edit `frontend/services.html` directly for those.

### Contact form

- Submissions save to the Supabase `contacts` table — no extra setup
  beyond the Supabase config above.
- To also get an email for each new message, fill in the `SMTP_*` values in
  `.env` (any SMTP provider — Gmail app password, SendGrid, Resend, etc.)
  and restart the server. Without those values the form still works; it
  just won't send an email.
- The form includes a honeypot field and basic rate limiting (5 submissions
  per 15 minutes per IP) against spam/abuse. Admin login is separately
  rate-limited (10 attempts per 15 minutes per IP).

### Deploying

This is a standard Node app — it runs as-is on Render, Railway, Fly.io, a
VPS, etc. Set the `PORT` environment variable if your host requires it
(most set it automatically), and set `SUPABASE_URL`, `SUPABASE_KEY`, and
`ADMIN_PASSWORD` as environment variables on whichever host you use (same
values as your local `.env`). Because data lives in Supabase rather than
local files, it's safe to use hosts with non-persistent storage (e.g.
Render's free tier) — a restart or redeploy won't lose any client data.

If you'd rather host the frontend on a static host (Netlify/Vercel/GitHub
Pages) and the backend separately, change the `fetch('/api/contact', ...)`
URL in `frontend/js/main.js` to the backend's full URL and enable CORS in
`server.js`.

Your domain (e.g. katax.ca) can point to whichever host runs this backend
by updating its DNS — usually an A record or CNAME your host's dashboard
gives you. That's a change you make with your domain registrar (e.g.
IONOS), separate from the app hosting itself.

## Details to verify before launch

A few fields were transcribed from a business-card photo and one plain-text
file — worth double-checking before this goes live:

- **Street address** — the card's street number/name was partly cut off in
  the photo, so the site currently shows only "Toronto, ON M1E 4Y2" with no
  street address. Add the full address in the footer of all four HTML
  files and in `contact.html`'s info block and map query.
- **Contact email** — the site uses `info@katax.ca` (from the mission
  document, typed clearly). The business card also shows what looks like
  `admin@katax.ca` and a personal Gmail address that didn't OCR cleanly —
  confirm which inbox you want enquiries to land in.
- **Phone number** — `437-230-5860`, taken directly from the card.
- **Logo** — `frontend/assets/logo.svg` is a new mark built to match the
  card's color scheme (navy + brick red bars), not a trace of the original
  logo file. Swap in the real logo file if you have the source artwork.

## Editing content

There's no templating layer — each HTML file repeats its own header/footer,
so a change to nav links, phone number, or footer text needs to be made in
all four files (`index.html`, `about.html`, `services.html`,
`contact.html`). This keeps the site dependency-free; if the site grows
past four pages, it'd be worth introducing a static-site generator (Astro,
Eleventy) to share layout in one place.
