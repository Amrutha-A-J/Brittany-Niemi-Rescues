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
