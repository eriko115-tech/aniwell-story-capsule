export async function onRequestGet(context) {
  const siteKey = context.env.TURNSTILE_SITE_KEY || "";

  return Response.json(
    {
      turnstileSiteKey: siteKey,
    },
    {
      headers: {
        "cache-control": "no-store",
      },
    }
  );
}
