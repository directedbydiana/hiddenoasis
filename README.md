# ShadedOasis

Digital contact cards that replace Dot cards at networking events. The homepage is a
searchable directory of cards. Each contact also lives at `/<slug>` and can be saved to
a phone via `/<slug>/vcard.vcf`.

## Running locally

```bash
cp .env.example .env.local   # then fill in ADMIN_PASSWORD and AUTH_SECRET
npm install
npm run dev
```

Contacts are stored in `.data/contacts.json` (gitignored) during local development.
On first run it is seeded from `data/contacts.seed.json`.

## Pages

| Path | Who | What |
| --- | --- | --- |
| `/` | everyone | Directory: search, A–Z filter, one card per contact |
| `/<slug>` | everyone | A single card with every link and a Save contact button |
| `/new`, `/edit/<slug>` | everyone | The card editor (see below) |
| `/admin` | password | Manage list, sign out |

## The editor

Anyone can open the editor, fill in a card, see it live (plus how the vCard lands on
iPhone and Android), and **Download .vcf**. The file is built in the browser, so nothing
is stored and no password is needed.

**Add to directory** / **Save changes** writes the card to the shared store and needs the
admin password. The editor asks for it in a dialog; a correct password also starts a
7-day session so later saves don't ask again. Deleting a contact is only offered while
signed in.

The editor covers names, title, organizations, email, phone, photo (downscaled in the
browser), links, an accent color, a one-line tagline, and photo alt text. Cards show
Email, Call, and the first four links; with more links a "Show all" button opens a
dialog listing every link. The contact's own page lists them all.

## Theme

Light and dark mode follow the system preference by default. The toggle in the header
overrides it and remembers the choice in `localStorage`. Each accent color has a
light-mode and a dark-mode shade so banners and buttons stay readable in both.

## Authentication

Everything under `/admin` is gated by `middleware.ts`. Signing in with `ADMIN_PASSWORD`
(on `/admin/login` or from the editor's save dialog) sets a signed, httpOnly session
cookie using `AUTH_SECRET`. If either variable is missing, saving and `/admin` are
disabled and the pages say so.

## Storage on Netlify

In production the contact list is kept in [Netlify Blobs](https://docs.netlify.com/blobs/overview/)
(store `hiddenoasis`, key `contacts`). No setup is needed beyond deploying on Netlify
with the Next.js runtime; the store is created on first save. Until the first save the
site serves `data/contacts.seed.json`.

To use the production store from your machine, set `NETLIFY_SITE_ID` and
`NETLIFY_BLOBS_TOKEN` (a personal access token) in `.env.local`. `CONTACTS_STORE=file|blobs`
forces a backend.

## Deploying

Netlify builds with the Node version in `.nvmrc`. Set `ADMIN_PASSWORD` and `AUTH_SECRET`
in the site's environment variables before the first deploy. The old `/dianacdev`,
`/diana_cervantes.vcf`, `/admin/new`, and `/admin/edit/<slug>` URLs redirect to their
current locations.

## Environment variables

| Variable | Purpose |
| --- | --- |
| `ADMIN_PASSWORD` | Password for saving cards and `/admin` |
| `AUTH_SECRET` | ≥16 random chars, signs the session cookie |
| `CONTACTS_STORE` | Optional: `file` or `blobs` |
| `NETLIFY_SITE_ID`, `NETLIFY_BLOBS_TOKEN` | Optional: use Netlify Blobs outside Netlify |
