# Aniwell Story Capsule

Mobile-first landing page MVP for **Anime Story Capsule by Aniwell**. The page recreates the dark celestial Crystal Capsule direction with responsive HTML, CSS, and local JavaScript interactions.

## Project Overview

- One continuous scrolling experience inspired by the three mobile mockup zones
- Hero, Anime Expo card, How It Works timeline, capsule gallery, story form, social follow card, goods CTA, and footer
- Real submission flow using Cloudflare Pages Functions, D1, Turnstile, and Resend email notifications
- Filterable sample capsule gallery

## Files

- `index.html`: page structure and semantic sections
- `styles.css`: theme variables, responsive layout, glass cards, and crystal capsule visuals
- `script.js`: sample capsule rendering, filter chips, Turnstile loading, and form submission
- `functions/api/config.js`: exposes the public Turnstile site key to the browser
- `functions/api/submit.js`: validates Turnstile, stores submissions in D1, and sends the notification email
- `schema.sql`: D1 database schema for capsule submissions
- `wrangler.jsonc`: local Pages/D1 configuration
- `og-placeholder.svg`: placeholder social preview image

## Local Development

```bash
npm install
npm run dev
```

Then open the local Pages URL shown by Wrangler.

## Build Command

This is a Pages + Functions project. There is still no build step for the front-end assets.

## Cloudflare Pages Deployment

- Framework preset: `None`
- Build command: leave blank
- Build output directory: `/`
- Root directory: `outputs/aniwell-story-capsule` if this project lives inside a larger repository

## Where To Update Things

- Social links: update the placeholder `#` links in `index.html`
- Sample capsule data: update `sampleCapsules` in `script.js`
- Notification email recipient/sender: set `NOTIFY_EMAIL_TO` and `NOTIFY_EMAIL_FROM` in Cloudflare Pages environment variables
- Turnstile widget: configured automatically from `/api/config` once `TURNSTILE_SITE_KEY` is set
- Form backend behavior: update `functions/api/submit.js`

## Cloudflare Setup

### 1. Create a D1 database

Create a D1 database in Cloudflare named `aniwell-story-capsule-db`, then replace the placeholder `database_id` in `wrangler.jsonc`.

Run the schema:

```bash
wrangler d1 execute aniwell-story-capsule-db --remote --file=./schema.sql
```

### 2. Add the D1 binding to Pages

In the Pages project:

- Go to `Settings`
- Open `Bindings`
- Add a `D1 database` binding
- Binding name: `DB`
- Select your `aniwell-story-capsule-db`

### 3. Create a Turnstile widget

Create a Cloudflare Turnstile widget for your Pages domain and add:

- `TURNSTILE_SITE_KEY`
- `TURNSTILE_SECRET_KEY`

### 4. Configure Resend

Create a Resend API key and verify your sender domain/address, then add:

- `RESEND_API_KEY`
- `NOTIFY_EMAIL_TO`
- `NOTIFY_EMAIL_FROM`

`NOTIFY_EMAIL_TO` is the inbox that should receive new submission notifications.  
`NOTIFY_EMAIL_FROM` must be a verified sender in Resend.

## Form Behavior

- Front-end submits to `/api/submit`
- Pages Function validates the Turnstile token server-side
- Submission is saved into D1
- Notification email is sent through Resend
- Public gallery still uses sample data only

Important: never auto-publish user submissions publicly unless the user consented to anonymous sharing and Aniwell approved the submission.
