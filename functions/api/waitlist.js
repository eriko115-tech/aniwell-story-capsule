const jsonHeaders = {
  "content-type": "application/json; charset=utf-8",
  "cache-control": "no-store",
  "access-control-allow-origin": "*",
};

export async function onRequestOptions() {
  return new Response(null, {
    status: 204,
    headers: {
      ...jsonHeaders,
      "access-control-allow-methods": "POST, OPTIONS",
      "access-control-allow-headers": "content-type",
    },
  });
}

export async function onRequestPost(context) {
  try {
    const db = context.env.DB;

    if (!db) {
      return Response.json(
        { ok: false, error: "D1 database binding DB is not configured." },
        { status: 500, headers: jsonHeaders },
      );
    }

    const payload = await context.request.json();
    const email = String(payload.email ?? "").trim().toLowerCase();

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return Response.json(
        { ok: false, error: "Please enter a valid email address." },
        { status: 400, headers: jsonHeaders },
      );
    }

    const id = crypto.randomUUID();
    const createdAt = new Date().toISOString();

    await db
      .prepare(
        `INSERT OR IGNORE INTO waitlist_subscribers (
          id,
          created_at,
          email,
          source,
          user_agent
        ) VALUES (?, ?, ?, ?, ?)`,
      )
      .bind(
        id,
        createdAt,
        email,
        "goods_cta",
        context.request.headers.get("user-agent") ?? "",
      )
      .run();

    return Response.json({ ok: true }, { headers: jsonHeaders });
  } catch (error) {
    return Response.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "Unexpected server error.",
      },
      { status: 500, headers: jsonHeaders },
    );
  }
}
