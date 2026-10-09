# ShadedOasis

A digital rolodex that replaces Dot cards at networking events, styled as a motel's
front-desk card file. The homepage is a rotating Rolodex of guest cards on a plain
background whose color follows the viewer's local time of day. Each contact also lives
at `/<slug>` and can be saved to a phone via `/<slug>/vcard.vcf`.

## Running locally

```bash
cp .env.example .env.local   # then fill in ADMIN_PASSWORD and AUTH_SECRET
npm install
npm run dev
```

Contacts are stored in `.data/contacts.json` (gitignored) during local development.
On first run it is seeded from `data/contacts.seed.json`.

## The Rolodex

- A–Z key-fob tabs: click, or type a letter, to jump.
- Search strip filters cards instantly.
- Turn cards with the scroll wheel, drag, swipe, or arrow keys. Enter flips the active
  card to its notes side.
- Stamp actions on every card: Call, Email, Copy, Save (.vcf), Edit, Notes.
- Decorative filler cards (blank index cards, a drive-in ticket, a front-desk receipt,
  a door hanger) sit between the real cards so the file looks full. They are
  decoration only and hidden from assistive tech.
- `prefers-reduced-motion` swaps the rotation for a crossfade and drops the fillers.
- On phones the file becomes a scrolling stack with large single-column rows, and the
  search box and letter scrubber stay pinned at the top.
- The "Hours" control in the footer pins a time of day (also `?time=night` etc.) or
  returns to live local time. Live mode re-checks every few minutes.

## Editing contacts

Everything under `/admin` is gated by `middleware.ts`. Signing in with
`ADMIN_PASSWORD` sets a signed, httpOnly session cookie (7 days) using `AUTH_SECRET`.
If either variable is missing, admin is disabled and the login page says so.

The editor covers names, title, organizations, email, phone, photo, and links, plus the
card design: shape, paper, ink (only WCAG AA pairings are enabled), accent color, photo
treatment and alt text, and a one-line note. Surprise me, Undo, and Reset are always
available. Designs save as structured settings, never images. The right column shows the
card live and how the vCard lands on iPhone and Android.

Cards show Email, Call, and the first four links; with more links an "All N links"
button opens a dialog listing every link. The contact's own page lists them all.

## Storage on Netlify

In production the contact list is kept in [Netlify Blobs](https://docs.netlify.com/blobs/overview/)
(store `hiddenoasis`, key `contacts`). No setup is needed beyond deploying on Netlify
with the Next.js runtime; the store is created on first save. Until the first save the
site serves `data/contacts.seed.json`.

To use the production store from your machine, set `NETLIFY_SITE_ID` and
`NETLIFY_BLOBS_TOKEN` (a personal access token) in `.env.local`. `CONTACTS_STORE=file|blobs`
forces a backend.

## Fonts

Google fonts (Work Sans, Special Elite, Caveat) load through `next/font/google`. The two
local display faces live in `app/fonts/` and load through `next/font/local`:
Machine Heavy for signage, Tropical Sunlight for script accents and typed signatures.

## Deploying

Netlify builds with the Node version in `.nvmrc`. Set `ADMIN_PASSWORD` and `AUTH_SECRET`
in the site's environment variables before the first deploy. The old `/dianacdev` and
`/diana_cervantes.vcf` URLs redirect to the current card.

## Environment variables

| Variable | Purpose |
| --- | --- |
| `ADMIN_PASSWORD` | Password for `/admin` |
| `AUTH_SECRET` | ≥16 random chars, signs the session cookie |
| `CONTACTS_STORE` | Optional: `file` or `blobs` |
| `NETLIFY_SITE_ID`, `NETLIFY_BLOBS_TOKEN` | Optional: use Netlify Blobs outside Netlify |
