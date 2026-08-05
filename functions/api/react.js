const jsonHeaders = {
  "content-type": "application/json; charset=utf-8",
  "cache-control": "no-store",
  "access-control-allow-origin": "*",
};

const reactionColumns = {
  heart: "heart_reactions",
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
    const id = String(payload.id ?? "").trim();
    const reaction = String(payload.reaction ?? "").trim();
    const column = reactionColumns[reaction];

    if (!id || !column) {
      return Response.json(
        { ok: false, error: "A valid capsule id and reaction are required." },
        { status: 400, headers: jsonHeaders },
      );
    }

    const update = await db
      .prepare(
        `UPDATE story_submissions
          SET ${column} = ${column} + 1
          WHERE id = ?
            AND share_anonymously = 1
            AND status != 'rejected'`,
      )
      .bind(id)
      .run();

    if (!update.meta || update.meta.changes !== 1) {
      return Response.json(
        { ok: false, error: "Capsule was not found or is not public." },
        { status: 404, headers: jsonHeaders },
      );
    }

    const row = await db
      .prepare(
        `SELECT heart_reactions, star_reactions
          FROM story_submissions
          WHERE id = ?`,
      )
      .bind(id)
      .first();

    return Response.json(
      {
        ok: true,
        heartReactions: Number(row?.heart_reactions || 0),
        starReactions: Number(row?.star_reactions || 0),
      },
      { headers: jsonHeaders },
    );
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
