const jsonHeaders = {
  "content-type": "application/json; charset=utf-8",
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

const allowedMediaTypes = new Set(["Anime", "Manga", "Game", "Music"]);

export async function onRequestOptions() {
  return new Response(null, {
    status: 204,
    headers: {
      ...jsonHeaders,
      "access-control-allow-origin": "*",
      "access-control-allow-methods": "POST, OPTIONS",
      "access-control-allow-headers": "content-type",
    },
  });
}

export async function onRequestPost(context) {
  try {
    const payload = await context.request.json();
    const submission = normalizeSubmission(payload);

    if (!submission.ok) {
      return Response.json({ ok: false, error: submission.error }, { status: 400 });
    }

    const value = submission.value;
    const db = context.env.DB;

    if (!db) {
      return Response.json(
        { ok: false, error: "D1 database binding DB is not configured." },
        { status: 500 },
      );
    }

    const id = crypto.randomUUID();
    const createdAt = new Date().toISOString();
    const country = getRequestCountry(context.request);

    try {
      await db
        .prepare(
          `INSERT INTO story_submissions (
          id,
          created_at,
          email,
          title,
          media_type,
          memory,
          name,
          social,
          feelings,
          consent,
          share_anonymously,
          country_code,
          country_name,
          status,
          user_agent
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        )
        .bind(
          id,
          createdAt,
          value.email,
          value.title,
          value.mediaType,
          value.memory,
          value.name,
          value.social,
          JSON.stringify(value.feelings),
          value.consent,
          value.consent === "yes" ? 1 : 0,
          country.code,
          country.name,
          "pending",
          context.request.headers.get("user-agent") ?? "",
        )
        .run();
    } catch (error) {
      if (!isMissingMediaTypeColumn(error)) {
        throw error;
      }

      await db
        .prepare(
          `INSERT INTO story_submissions (
          id,
          created_at,
          email,
          title,
          memory,
          name,
          social,
          feelings,
          consent,
          share_anonymously,
          country_code,
          country_name,
          status,
          user_agent
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        )
        .bind(
          id,
          createdAt,
          value.email,
          value.title,
          value.memory,
          value.name,
          value.social,
          JSON.stringify(value.feelings),
          value.consent,
          value.consent === "yes" ? 1 : 0,
          country.code,
          country.name,
          "pending",
          context.request.headers.get("user-agent") ?? "",
        )
        .run();
    }

    const emailResult = await sendNotificationEmail(context.env, {
      id,
      createdAt,
      country,
      ...value,
    });

    return Response.json({
      ok: true,
      id,
      emailSent: emailResult.sent,
      emailError: emailResult.error,
    });
  } catch (error) {
    return Response.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "Unexpected server error.",
      },
      { status: 500 },
    );
  }
}

function normalizeSubmission(payload) {
  const email = clean(payload.email);
  const title = clean(payload.title);
  const mediaType = clean(payload.mediaType);
  const memory = clean(payload.memory);
  const name = clean(payload.name);
  const social = clean(payload.social);
  const consent = clean(payload.consent);
  const feelings = Array.isArray(payload.feelings)
    ? payload.feelings.map(clean).filter((feeling) => allowedFeelings.has(feeling))
    : [];

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { ok: false, error: "A valid email address is required." };
  }

  if (!title) {
    return { ok: false, error: "Story title is required." };
  }

  if (!memory) {
    return { ok: false, error: "Story memory is required." };
  }

  if (consent !== "yes" && consent !== "no") {
    return { ok: false, error: "Sharing consent is required." };
  }

  return {
    ok: true,
    value: {
      email,
      title,
      mediaType: allowedMediaTypes.has(mediaType) ? mediaType : "",
      memory,
      name,
      social,
      feelings,
      consent,
    },
  };
}

function isMissingMediaTypeColumn(error) {
  return /media_type|no such column|has no column/i.test(
    error instanceof Error ? error.message : String(error),
  );
}

function clean(value) {
  return String(value ?? "").trim().slice(0, 4000);
}

async function sendNotificationEmail(env, submission) {
  if (!env.RESEND_API_KEY || !env.NOTIFICATION_TO || !env.NOTIFICATION_FROM) {
    return {
      sent: false,
      error: "Email env vars missing: RESEND_API_KEY, NOTIFICATION_TO, NOTIFICATION_FROM.",
    };
  }

  const subject = `New Anime Story Capsule: ${submission.title}`;
  const html = renderEmailHtml(submission);
  const text = renderEmailText(submission);

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      authorization: `Bearer ${env.RESEND_API_KEY}`,
      "content-type": "application/json",
    },
    body: JSON.stringify({
      from: env.NOTIFICATION_FROM,
      to: env.NOTIFICATION_TO.split(",").map((email) => email.trim()).filter(Boolean),
      reply_to: submission.email,
      subject,
      html,
      text,
    }),
  });

  if (!response.ok) {
    const message = await response.text();
    return { sent: false, error: `Resend failed: ${response.status} ${message}` };
  }

  return { sent: true };
}

function renderEmailHtml(submission) {
  return `
    <h1>New Anime Story Capsule</h1>
    <p><strong>Submitted:</strong> ${escapeHtml(submission.createdAt)}</p>
    <p><strong>Email:</strong> ${escapeHtml(submission.email)}</p>
    <p><strong>Name:</strong> ${escapeHtml(submission.name || "Not provided")}</p>
    <p><strong>Social:</strong> ${escapeHtml(submission.social || "Not provided")}</p>
    <p><strong>Story title:</strong> ${escapeHtml(submission.title)}</p>
    <p><strong>Story type:</strong> ${escapeHtml(submission.mediaType || "Not selected")}</p>
    <p><strong>Feelings:</strong> ${escapeHtml(submission.feelings.join(", ") || "Not selected")}</p>
    <p><strong>Country:</strong> ${escapeHtml(submission.country?.name || "Unknown")} (${escapeHtml(submission.country?.code || "XX")})</p>
    <p><strong>Anonymous sharing consent:</strong> ${escapeHtml(submission.consent)}</p>
    <h2>Memory</h2>
    <p>${escapeHtml(submission.memory).replace(/\n/g, "<br>")}</p>
    <p><small>D1 status: pending moderation. Submission id: ${escapeHtml(submission.id)}</small></p>
  `;
}

function renderEmailText(submission) {
  return [
    "New Anime Story Capsule",
    `Submitted: ${submission.createdAt}`,
    `Email: ${submission.email}`,
    `Name: ${submission.name || "Not provided"}`,
    `Social: ${submission.social || "Not provided"}`,
    `Story title: ${submission.title}`,
    `Story type: ${submission.mediaType || "Not selected"}`,
    `Feelings: ${submission.feelings.join(", ") || "Not selected"}`,
    `Country: ${submission.country?.name || "Unknown"} (${submission.country?.code || "XX"})`,
    `Anonymous sharing consent: ${submission.consent}`,
    "",
    "Memory:",
    submission.memory,
    "",
    `D1 status: pending moderation. Submission id: ${submission.id}`,
  ].join("\n");
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function getRequestCountry(request) {
  const code = String(request.cf?.country || request.headers.get("cf-ipcountry") || "XX")
    .trim()
    .toUpperCase();

  return {
    code,
    name: countryNames[code] || "Unknown",
  };
}

const countryNames = {
  AU: "Australia",
  BR: "Brazil",
  CA: "Canada",
  CN: "China",
  DE: "Germany",
  ES: "Spain",
  FR: "France",
  GB: "United Kingdom",
  ID: "Indonesia",
  IN: "India",
  IT: "Italy",
  JP: "Japan",
  KR: "South Korea",
  MX: "Mexico",
  PH: "Philippines",
  SG: "Singapore",
  TH: "Thailand",
  TW: "Taiwan",
  US: "United States",
  VN: "Vietnam",
  XX: "Unknown",
};
