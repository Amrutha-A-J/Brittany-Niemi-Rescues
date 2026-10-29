# Brittany Niemi Rescues

Website for a cat rescue in Regina, SK: a public site for adoptable cats and applications, plus a private admin for the rescue.

Next.js on Cloudflare Workers (free plan): D1 for the database, R2 for photos, KV for the page cache, Brevo for email.

```bash
npm install
npm run db:migrate && npm run db:seed
npm run staff:add -- you@example.com
npm run dev          # http://localhost:3000
npm run dev:demo     # browser-only demo with sample data, http://localhost:3001
```

Setup, deploying and costs: [SETUP.md](SETUP.md).

## Footer signature

The footer uses Ami's original pen strokes for "by Ami", alongside regular caption text.
"At pixelmoose.ca" stays on its own second line at every width; the credit is centered on
phones and aligned to the right on desktop. The whole credit links to https://pixelmoose.ca
and has a full accessible name and keyboard focus outline. The inline SVG uses currentColor
so its color follows each site's light and dark theme. DeveloperCredit owns the markup,
with fixed attribution text in the site content or developer-credit configuration module.

The footer monogram is 48px tall on phones and 56px on desktop, using the existing Logo
component so the vector stays crisp. The header logo keeps its separate size.
