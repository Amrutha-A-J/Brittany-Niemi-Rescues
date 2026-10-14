# Brittany Niemi Rescues: setup guide

The website is a Next.js app (`web/`) backed by Supabase (database, logins, photo storage) and Brevo (email).

- **Public site:** `/` (homepage), `/adopt` (all cats with filters), `/cats/<name>` (one page per cat), `/apply`, `/foster`
- **Rescue admin:** `/admin` (cats, applications, meet & greets, adopted, account)

---

## 0. Demo mode (no backend)

For design reviews, the site runs entirely in the browser with no database:

```bash
npm run dev:demo        # http://localhost:3001
```

- Sample data comes from `src/lib/demo/seed.json` (cats, applications, a meet & greet, an adoption). Photos are from TheCatAPI.
- Admin login: **brittany / catsrule** (set in `seed.json`). This isn't real security; demo data only.
- Everything works: adding cats and photos, applying, approving, scheduling, adopting. Changes are saved in that
  visitor's own browser only. "Reset demo data" in the admin sidebar starts over.
- A banner marks it as a preview, and it's hidden from Google.
- To deploy the demo on Vercel, set the environment variable `NEXT_PUBLIC_DEMO=1` and nothing else.

Turning demo mode off (no `NEXT_PUBLIC_DEMO`) switches back to the real Supabase backend described below.

---

## 1. Run everything on your Mac

You need [Homebrew](https://brew.sh) and Node 20+. Docker runs through Colima, which is free and needs no admin password.

```bash
brew install colima docker   # one time
colima start                 # once after each restart of your Mac
cd web
npm install
npx supabase start           # starts the local database, auth and storage (first run downloads ~2 GB)
```

`supabase start` prints an **API URL**, an **anon key** and a **service_role key**. Put them in `web/.env.local`:

```
NEXT_PUBLIC_SITE_URL=http://localhost:3000
NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon key>
SUPABASE_SERVICE_ROLE_KEY=<service_role key>
```

Create the demo login and the 10 sample cats, then start the site:

```bash
npm run db:seed
npm run dev
```

- Website: http://localhost:3000
- Admin: http://localhost:3000/admin. The demo login is `demo@brittanyniemirescues.test` / `catsrule`.
- Supabase Studio, to look at the data: http://127.0.0.1:54323
- Password-reset emails: locally these never leave your Mac. Read them at http://127.0.0.1:54324 (Mailpit).
- Without Brevo keys, the app's own emails (application confirmations, invites) are printed in the terminal instead of sent.

Stop everything with `npx supabase stop` and `colima stop`. Your data is kept.

---

## Database changes (migrations)

Every change to the database structure is a SQL file in `supabase/migrations/`, applied in date order.
Each database records which files it has already had, so you never run SQL by hand. Commands only apply what's new.

| Command | What it does |
|---|---|
| `npm run db:new -- add_cat_weight` | Creates a new, empty migration file to write SQL in |
| `npm run db:migrate` | Applies new migrations to your **local** database |
| `npm run db:reset` | Wipes the local database, re-applies every migration and re-seeds the demo data |
| `npm run db:status -- .env.demo` | Lists which migrations the online database has |
| `npm run db:push -- .env.demo --dry-run` | Previews what would be applied online |
| `npm run db:push -- .env.demo` | Applies new migrations to the online database |

**Automatic:** once the code is on GitHub, `.github/workflows/migrate.yml` runs `db:push` every time a migration file
lands on `master`. Add one repository secret, `DATABASE_URL`, under Settings → Secrets and variables → Actions.
When you move to Lightsail, swap that secret for the new database's URL; nothing else changes.

Rule of thumb: never edit a migration that has already been applied. Add a new one instead.

---

## 2. Put a demo online for Brittany (free)

### 2a. Supabase (database)
1. Create a free project at https://supabase.com. Choose the **Canada (Central)** region.
2. Fill in `web/.env.demo` (the comments in that file say where each value is in the Supabase dashboard), then create the tables:
   ```bash
   npm run db:push -- .env.demo
   ```
3. **Authentication → Sign In / Providers**: turn **off** "Allow new users to sign up".
4. **Authentication → URL Configuration**:
   - Site URL: your Vercel URL, e.g. `https://brittany-niemi-rescues.vercel.app`
   - Redirect URLs: add `https://brittany-niemi-rescues.vercel.app/**`
5. Create the demo login and sample cats against the hosted project:
   ```bash
   npm run db:seed:demo
   ```
   To use a different login: `npm run db:seed:demo -- her@email.com SomePassword`.

### 2b. Vercel (hosting)
1. Push this project to GitHub, then **Import** it at https://vercel.com/new.
2. Set **Root Directory** to `web`.
3. Add these environment variables:
   | Name | Value |
   |---|---|
   | `NEXT_PUBLIC_SITE_URL` | `https://<your-project>.vercel.app` |
   | `NEXT_PUBLIC_SUPABASE_URL` | from step 2a |
   | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | from step 2a |
   | `NEXT_PUBLIC_NOINDEX` | `1`. This keeps the demo out of Google; remove it at launch. |
4. Deploy. Never add the `service_role` key to Vercel; it's only for the seed script.

---

## 3. Email with Brevo (free, 300 emails/day)

1. Sign up at https://brevo.com.
2. **Senders, domains & dedicated IPs → Senders**: add and verify the address emails should come from.
   Once you own a domain, authenticate the domain there too, so emails don't land in spam.
3. **SMTP & API → API keys**: create a key.
4. Add these to `.env.local` and to Vercel:
   ```
   BREVO_API_KEY=...
   EMAIL_FROM=the verified sender address
   EMAIL_FROM_NAME=Brittany Niemi Rescues
   RESCUE_NOTIFY_EMAIL=where new-application alerts should go
   ```
5. Send password-reset emails through Brevo too. In Supabase, go to **Authentication → Emails → SMTP Settings**, enable custom SMTP and enter:
   host `smtp-relay.brevo.com`, port `587`, and the SMTP login and key from Brevo's **SMTP & API → SMTP** tab.

The app sends these emails:
- To the applicant: confirmation of their application, approved, not a match (optional), and a meet & greet invite with an "Add to Google Calendar" button and an `.ics` file for Apple Calendar and Outlook
- To the rescue: new application, and meet & greet booked

---

## 4. Password resets

- **Forgot it:** click "Forgot password?" on `/admin/login`. A link arrives by email, opens "Choose a new password", and logs her in.
- **Change it:** while logged in, go to **Account → Change password**.
- **Locked out completely:** in Supabase, go to **Authentication → Users**, find her account, and choose **Send password recovery**.
- **Adding another volunteer:** in **Authentication → Users → Add user**, then run this in the SQL Editor:
  ```sql
  insert into public.staff (user_id) select id from auth.users where email = 'their@email.com';
  ```

---

## 5. Going live checklist

- [ ] Replace the placeholder logo: put the file at `public/logo.png` (or `.svg`) and update `src/components/site/Logo.tsx`
- [ ] Buy a domain and connect it in Vercel. Update `NEXT_PUBLIC_SITE_URL` and the Supabase URL settings.
- [ ] Remove `NEXT_PUBLIC_NOINDEX`
- [ ] Delete the sample cats and the demo login, then create her real login
- [ ] Add the site in [Google Search Console](https://search.google.com/search-console) and submit `https://<domain>/sitemap.xml`
- [ ] Create a free [Google Business Profile](https://business.google.com) for the rescue in Moose Jaw
- [ ] Put the website link in the Instagram bio
