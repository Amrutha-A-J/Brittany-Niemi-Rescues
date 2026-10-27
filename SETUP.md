# Brittany Niemi Rescues: setup guide

The website is a Next.js app (`web/`) that runs on Cloudflare's free plan:

- **Cloudflare Workers** runs the site (via [OpenNext](https://opennext.js.org/cloudflare))
- **D1** is the database (cats, applications, meet & greets, adoptions, fosters, logins)
- **R2** stores the cat photos
- **KV** caches the public pages
- **Brevo** sends email

Pages:
- **Public site:** `/` (homepage), `/adopt` (all cats with filters), `/cats/<name>` (one page per cat), `/apply`, `/foster`
- **Rescue admin:** `/admin` (cats, applications, fosters, meet & greets, adopted, account)

### What it costs

The hosting costs **$0/month** at this site's size. These are the free limits that matter:

| | Free allowance | This site |
|---|---|---|
| Workers | 100,000 requests/day, 3 MiB Worker | a few hundred requests/day, ~2.3 MiB Worker |
| D1 database | 5 GB, 5M rows read/day | a few MB |
| R2 photos | 10 GB, no download fees | ~300 KB per photo |
| Brevo | 300 emails/day | a handful |

The only fixed cost is the yearly domain renewal. If the site ever outgrows the free plan, Workers Paid is $5/month.
Turning on R2 asks for a card on file, even though usage stays free.

---

## 0. Demo mode (no backend)

For design reviews, the site runs entirely in the browser with no database:

```bash
npm run dev:demo        # http://localhost:3001
```

- Sample data comes from `src/lib/demo/seed.json`. Photos are from TheCatAPI.
- Admin login: **brittany / catsrule** (set in `seed.json`). This isn't real security; demo data only.
- Everything works, and changes are saved in that visitor's own browser only. "Reset demo data" in the admin sidebar starts over.
- `.github/workflows/pages.yml` publishes this demo to GitHub Pages on every push to `master`.

---

## 1. Run the real site on your Mac

You need Node 20+. There's nothing else to install: Wrangler (Cloudflare's CLI, a dev dependency) keeps a local
database and photo bucket in `.wrangler/state`.

```bash
cd web
npm install
npm run db:migrate                          # create the tables in the local database
npm run db:seed                             # optional: load the sample cats, applications and fosters
npm run staff:add -- you@example.com        # create a login (asks for a password)
npm run dev                                 # http://localhost:3000, admin at /admin
```

- Without Brevo keys in `.env.local`, emails aren't sent. The admin says so when it would have sent one.
- `npm run preview` builds the real Cloudflare Worker and runs it locally on http://localhost:8787, the closest thing to production.

---

## Database changes (migrations)

Every change to the database structure is a SQL file in `migrations/`, applied in order. Each database records
which files it has already had, so commands only apply what's new.

| Command | What it does |
|---|---|
| `npm run db:new -- add_cat_weight` | Creates a new, empty migration file to write SQL in |
| `npm run db:migrate` | Applies new migrations to your **local** database |
| `npm run db:migrate:remote` | Applies new migrations to the **live** database |

The deploy workflow (step 3) runs `db:migrate:remote` automatically before every deploy.
Rule of thumb: never edit a migration that has already been applied. Add a new one instead.

---

## 2. Create the Cloudflare resources (one time)

Do this in Brittany's Cloudflare account, the one that owns the domain.

```bash
cd web
npx wrangler login                                     # opens the browser to sign in
npx wrangler d1 create brittany-niemi-rescues          # prints a database_id
npx wrangler r2 bucket create brittany-niemi-rescues-photos
npx wrangler kv namespace create cache                 # prints an id
```

1. In `wrangler.jsonc`, replace the placeholder ids: put the `database_id` in all four D1 entries,
   and the KV `id` in both KV entries. Commit that change.
2. Create the tables and her login in the live database:
   ```bash
   npm run db:migrate:remote
   npm run staff:add -- her@email.com --remote
   ```
3. Add the email settings as Worker secrets (each command asks for the value):
   ```bash
   npx wrangler secret put BREVO_API_KEY
   npx wrangler secret put EMAIL_FROM
   npx wrangler secret put EMAIL_FROM_NAME
   npx wrangler secret put RESCUE_NOTIFY_EMAIL
   ```
4. First deploy by hand: `NEXT_PUBLIC_SITE_URL=https://<her domain> npm run deploy`
5. Cloudflare dashboard → **Workers & Pages → brittany-niemi-rescues → Settings → Domains & Routes → Add → Custom domain**,
   and enter her domain. Cloudflare sets up DNS and HTTPS on its own, because the domain is already there.

---

## 3. Deploy automatically from GitHub

`.github/workflows/deploy.yml` applies new migrations and deploys on every push to `master`. It skips itself until these are set
(GitHub repo → Settings → Secrets and variables → Actions):

| Kind | Name | Value |
|---|---|---|
| Secret | `CLOUDFLARE_API_TOKEN` | Cloudflare → My Profile → API Tokens → Create Token → "Edit Cloudflare Workers" template, plus **Account → D1 → Edit** |
| Secret | `CLOUDFLARE_ACCOUNT_ID` | Cloudflare dashboard → Workers & Pages → Account ID (right-hand side) |
| Variable | `SITE_URL` | `https://<her domain>`, no trailing slash |

---

## 4. Email with Brevo (free, 300 emails/day)

1. Sign up at https://brevo.com.
2. **Senders, domains & dedicated IPs**: authenticate her domain (Brevo gives DNS records to add in Cloudflare → DNS),
   then add the sender address, so emails don't land in spam.
3. **SMTP & API → API keys**: create a key.
4. Put the values in `.env.local` for local testing, and in the Worker secrets (step 2.3) for the live site.

The app sends these emails:
- To the applicant: confirmation of their application, approved, not a match (optional), and a meet & greet invite with an "Add to Google Calendar" button and an `.ics` file for Apple Calendar and Outlook
- To the rescue: new application, and meet & greet booked
- To staff: password reset links

---

## 5. Logins and passwords

- **Forgot it:** click "Forgot password?" on `/admin/login`. A one-hour link arrives by email, opens "Choose a new password", and logs her in.
  (This needs Brevo set up.)
- **Change it:** while logged in, go to **Account → Change password**. This also logs out every other device.
- **Locked out completely, or adding a volunteer:** `npm run staff:add -- their@email.com --remote`.
  Running it for an existing email sets a new password.
- Logins last 30 days per browser. Passwords are stored as salted PBKDF2 hashes, never in plain text.

---

## 6. Going live checklist

- [ ] Replace the placeholder logo: put the file at `public/logo.png` (or `.svg`) and update `src/components/site/Logo.tsx`
- [ ] Create the Cloudflare resources and deploy (steps 2–3)
- [ ] Remove `NEXT_PUBLIC_NOINDEX` if it's set
- [ ] Create her real login; don't load the sample data into the live database
- [ ] Add the site in [Google Search Console](https://search.google.com/search-console) and submit `https://<domain>/sitemap.xml`
- [ ] Create a free [Google Business Profile](https://business.google.com) for the rescue in Regina
- [ ] Put the website link in the Instagram bio
