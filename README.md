# Anime Story Capsule by Aniwell

Mobile-first MVP for collecting anime, manga, game, music, character, scene, and quote memories in a dark celestial Crystal Capsule experience.

The main page explains the project and prioritizes the submission form. The capsule gallery is a separate route so users are not overwhelmed before sharing their own story.

## Routes

- `/` - main explanation, hero, submission form, thank-you state, follow and waitlist CTAs
- `/capsules` - separate anonymous capsule gallery with feeling filters

## Local Development

```bash
npm install
npm run dev
```

## Build

```bash
npm run build
```

## Cloudflare Pages

Use these settings:

- Framework preset: Vite
- Build command: `npm run build`
- Output directory: `dist`
- Node version: current LTS

For direct URL visits to `/capsules`, configure a single-page app fallback to `index.html` in Cloudflare Pages.

## Cloudflare D1 And Email

The form posts to `functions/api/submit.js`.

Required Cloudflare Pages bindings and environment variables:

- D1 binding: `DB`
- Secret: `RESEND_API_KEY`
- Variable: `NOTIFICATION_TO`
- Variable: `NOTIFICATION_FROM`

Create the table with:

```bash
wrangler d1 execute YOUR_DATABASE_NAME --file schema.sql --remote
```

For `wrangler` deploys, copy `wrangler.toml.example` to `wrangler.toml`, then replace `database_id`.

Deploy with:

```bash
npm run build
wrangler pages deploy dist --project-name YOUR_CLOUDFLARE_PAGES_PROJECT
```

Submitted capsules are saved with `status = pending`. Do not display real user submissions publicly until they are consented and approved.

## Where To Update Content

- Social links: `src/App.tsx`, `FollowAniwell`
- Goods and waitlist CTAs: `src/App.tsx`, `GoodsCTA`
- Sample capsule data: `src/App.tsx`, `sampleCapsules`
- Feeling categories and capsule variants: `src/App.tsx`, `feelings` and `feelingMeta`
- Visual tokens: `src/styles.css`, `:root`

## Backend Integration Notes

The MVP now saves submissions through a Cloudflare Pages Function at `/api/submit`.

Real public capsules should only appear in the gallery after:

1. The user consented to anonymous sharing.
2. Aniwell approved the submission.

Never publish email addresses, full names, social handles, or private contact details.
