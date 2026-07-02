function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store",
    },
  });
}

async function verifyTurnstile(token, secret, ip) {
  const body = new URLSearchParams();
  body.set("secret", secret);
  body.set("response", token);

  if (ip) {
    body.set("remoteip", ip);
  }

  const response = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
    method: "POST",
    headers: {
      "content-type": "application/x-www-form-urlencoded",
    },
    body,
  });

  return response.json();
}

function readCheckboxValues(formData, key) {
  return formData
    .getAll(key)
    .map((value) => String(value).trim())
    .filter(Boolean);
}

function trimValue(value) {
  return String(value || "").trim();
}

function requireEnv(env, names) {
  const missing = names.filter((name) => !env[name]);
  return missing;
}

async function sendNotificationEmail(env, payload) {
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${env.RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: env.NOTIFY_EMAIL_FROM,
      to: [env.NOTIFY_EMAIL_TO],
      subject: `New Aniwell capsule: ${payload.title}`,
      text: [
        "A new Aniwell Anime Story Capsule submission was received.",
        "",
        `Email: ${payload.email}`,
        `Story title: ${payload.title}`,
        `Moment: ${payload.memory}`,
        `Name/Nickname: ${payload.displayName || "(not provided)"}`,
        `Social handle: ${payload.socialHandle || "(not provided)"}`,
        `Feelings: ${payload.feelings.join(", ") || "(not provided)"}`,
        `Consent to anonymous sharing: ${payload.consent}`,
        `Submitted at: ${payload.createdAt}`,
      ].join("\n"),
      html: `
        <h2>New Aniwell Anime Story Capsule submission</h2>
        <p><strong>Email:</strong> ${payload.email}</p>
        <p><strong>Story title:</strong> ${payload.title}</p>
        <p><strong>Moment:</strong><br/>${payload.memory.replace(/\n/g, "<br/>")}</p>
        <p><strong>Name/Nickname:</strong> ${payload.displayName || "(not provided)"}</p>
        <p><strong>Social handle:</strong> ${payload.socialHandle || "(not provided)"}</p>
        <p><strong>Feelings:</strong> ${payload.feelings.join(", ") || "(not provided)"}</p>
        <p><strong>Consent to anonymous sharing:</strong> ${payload.consent}</p>
        <p><strong>Submitted at:</strong> ${payload.createdAt}</p>
      `,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Resend request failed: ${errorText}`);
  }
}

export async function onRequestPost(context) {
  const { request, env } = context;

  if (!env.DB) {
    return json({ error: "D1 binding is missing." }, 500);
  }

  const missing = requireEnv(env, [
    "TURNSTILE_SECRET_KEY",
    "RESEND_API_KEY",
    "NOTIFY_EMAIL_TO",
    "NOTIFY_EMAIL_FROM",
  ]);

  if (missing.length) {
    return json(
      {
        error: `Missing Cloudflare environment variables: ${missing.join(", ")}`,
      },
      500
    );
  }

  const formData = await request.formData();

  if (trimValue(formData.get("website"))) {
    return json({ error: "Spam detected." }, 400);
  }

  const email = trimValue(formData.get("email"));
  const title = trimValue(formData.get("title"));
  const memory = trimValue(formData.get("memory"));
  const displayName = trimValue(formData.get("displayName"));
  const socialHandle = trimValue(formData.get("socialHandle"));
  const consent = trimValue(formData.get("consent"));
  const feelings = readCheckboxValues(formData, "feeling");
  const turnstileToken = trimValue(formData.get("cf-turnstile-response"));

  if (!email || !title || !memory || !consent) {
    return json({ error: "Please complete all required fields." }, 400);
  }

  if (!turnstileToken) {
    return json({ error: "Turnstile verification is required." }, 400);
  }

  const ip = request.headers.get("CF-Connecting-IP") || "";
  const verification = await verifyTurnstile(turnstileToken, env.TURNSTILE_SECRET_KEY, ip);

  if (!verification.success) {
    return json(
      {
        error: "Turnstile verification failed. Please try again.",
        details: verification["error-codes"] || [],
      },
      400
    );
  }

  const createdAt = new Date().toISOString();
  const approvedForGallery = 0;

  const result = await env.DB.prepare(
    `
      INSERT INTO capsule_submissions (
        email,
        title,
        memory,
        display_name,
        social_handle,
        feelings_json,
        consent_to_share,
        approved_for_gallery,
        created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `
  )
    .bind(
      email,
      title,
      memory,
      displayName || null,
      socialHandle || null,
      JSON.stringify(feelings),
      consent === "yes" ? 1 : 0,
      approvedForGallery,
      createdAt
    )
    .run();

  const payload = {
    email,
    title,
    memory,
    displayName,
    socialHandle,
    feelings,
    consent,
    createdAt,
  };

  try {
    await sendNotificationEmail(env, payload);
  } catch (error) {
    console.error("Email notification failed", error);

    return json({
      ok: true,
      id: result.meta?.last_row_id || null,
      warning:
        "Your story was saved, but the notification email could not be sent. Please check your Resend settings.",
    });
  }

  return json({
    ok: true,
    id: result.meta?.last_row_id || null,
  });
}
