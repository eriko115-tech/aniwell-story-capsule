# Anime Story Capsule — by Aniwell

Mobile-first landing page for Aniwell's "Anime Story Capsule" project, built for Anime Expo 2026 and beyond.

Visitors place the anime, manga, game, or music story that stayed with them into a glowing crystal capsule — collecting emails, short memories, and consent for anonymous sharing.

## Structure

```
index.html      - page markup
styles.css      - crystal/cosmic visual theme
main.js         - form handling, gallery filters, sample data
```

No build step required — plain HTML/CSS/JS, deployable as a static site.

## Local preview

Just open `index.html` in a browser, or serve the folder with any static server:

```
npx serve .
```

## Form & data integration (MVP → production)

The submission form currently runs entirely client-side (see the comment block in `main.js` above the `form.addEventListener("submit", ...)` handler). To go live, wire it to one of:

- Airtable
- Supabase
- Cloudflare Workers + D1
- Google Forms
- Netlify Forms
- beehiiv / Mailchimp

**Do not auto-publish submissions to the public gallery without human moderation**, even when the user consented to anonymous sharing. The gallery (`sampleCapsules` in `main.js`) currently uses static sample data — comments in the file mark where to swap in real, approved data.

## Deployment (Cloudflare Pages)

1. Push this repo to GitHub.
2. In the Cloudflare dashboard: **Workers & Pages → Create → Pages → Connect to Git**.
3. Select this repo.
4. Build settings:
   - Framework preset: `None`
   - Build command: *(leave blank)*
   - Build output directory: `/`
5. Deploy. Cloudflare will auto-deploy on every push to `main`.

Suggested custom domain: `story.aniwell.jp`

## Privacy & safety

- Email, full name, and social handles are never displayed publicly.
- This project is for reflection and community-building — not medical advice, therapy, diagnosis, or crisis support.
