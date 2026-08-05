const jsonHeaders = {
  "content-type": "application/json; charset=utf-8",
  "cache-control": "no-store",
  "access-control-allow-origin": "*",
};

const allowedFeelings = new Set([
  "Less alone",
  "Seen / Understood",
  "Comforted",
  "Hopeful",
  "Brave",
  "Inspired",
  "Ready to keep going",
  "Other",
]);

export async function onRequestOptions() {
  return new Response(null, {
    status: 204,
    headers: {
      ...jsonHeaders,
      "access-control-allow-origin": "*",
      "access-control-allow-methods": "GET, OPTIONS",
      "access-control-allow-headers": "content-type",
    },
  });
}

export async function onRequestGet(context) {
  try {
    const db = context.env.DB;

    if (!db) {
      return Response.json(
        { ok: false, error: "D1 database binding DB is not configured." },
        { status: 500, headers: jsonHeaders },
      );
    }

    const { results } = await db
      .prepare(
        `SELECT id, created_at, title, memory, feelings, country_code, country_name, heart_reactions, star_reactions
          FROM story_submissions
          WHERE share_anonymously = 1
            AND status != 'rejected'
          ORDER BY created_at DESC
          LIMIT 80`,
      )
      .all();

    return Response.json(
      {
        ok: true,
        capsules: results.map(toPublicCapsule),
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

function toPublicCapsule(row, index) {
  const parsedFeelings = parseFeelings(row.feelings);
  const feeling = parsedFeelings[0] ?? "Other";
  const stableNumber = hashString(row.id);

  return {
    id: row.id,
    title: cleanPublicText(row.title, 90),
    memory: cleanPublicText(row.memory, 420),
    feeling,
    motif: "",
    caption: "",
    hearts: 36 + ((stableNumber + index * 17) % 118) + Number(row.heart_reactions || 0),
    stars: 22 + ((stableNumber + index * 11) % 72) + Number(row.star_reactions || 0),
    countryCode: row.country_code || "XX",
    countryName: row.country_name || "Unknown",
    createdAt: row.created_at,
  };
}

function parseFeelings(value) {
  try {
    const parsed = JSON.parse(value || "[]");

    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed.filter((feeling) => allowedFeelings.has(feeling));
  } catch {
    return [];
  }
}

function cleanPublicText(value, maxLength) {
  const cleaned = String(value ?? "").trim().replace(/\s+/g, " ");

  if (cleaned.length <= maxLength) {
    return cleaned;
  }

  const excerpt = cleaned.slice(0, maxLength - 3);
  const lastSpace = excerpt.lastIndexOf(" ");

  return `${excerpt.slice(0, lastSpace > 120 ? lastSpace : excerpt.length)}...`;
}

function hashString(value) {
  return String(value)
    .split("")
    .reduce((hash, char) => (hash * 31 + char.charCodeAt(0)) >>> 0, 0);
}
