// ─────────────────────────────────────────────────────────────
// SAMPLE DATA — for MVP gallery only.
// Real submissions must only appear here after:
//   1) the user consented to anonymous sharing, AND
//   2) an Aniwell team member approved the submission.
// Replace this array with a fetch() to your backend
// (Airtable / Supabase / Cloudflare D1) once moderation is set up.
// ─────────────────────────────────────────────────────────────
const sampleCapsules = [
  {
    id: 1,
    title: "Naruto",
    feeling: "Less alone",
    memory: "When Naruto kept trying even when everyone rejected him, I felt like maybe I could keep going too.",
    displayName: "Anonymous",
    hearts: 128,
    lights: 73,
  },
  {
    id: 2,
    title: "Attack on Titan",
    feeling: "Brave",
    memory: "Eren's determination made me face my own fears.",
    displayName: "Anonymous",
    hearts: 112,
    lights: 59,
  },
  {
    id: 3,
    title: "Clannad",
    feeling: "Comforted",
    memory: "This story broke me and healed me at the same time.",
    displayName: "Anonymous",
    hearts: 98,
    lights: 64,
  },
  {
    id: 4,
    title: "A Silent Voice",
    feeling: "Understood",
    memory: "Shoya's journey made me feel less alone in my regrets.",
    displayName: "Anonymous",
    hearts: 146,
    lights: 81,
  },
  {
    id: 5,
    title: "Violet Evergarden",
    feeling: "Hopeful",
    memory: "She taught me that it's okay to keep searching for the right words.",
    displayName: "Anonymous",
    hearts: 123,
    lights: 77,
  },
  {
    id: 6,
    title: "Final Fantasy X",
    feeling: "Ready to keep going",
    memory: "Tidus showed me that it's okay to cry, even if you're still walking forward.",
    displayName: "Anonymous",
    hearts: 131,
    lights: 85,
  },
  {
    id: 7,
    title: "Your Lie in April",
    feeling: "Hopeful",
    memory: "The music helped me cry for something I could not put into words.",
    displayName: "Anonymous",
    hearts: 104,
    lights: 68,
  },
  {
    id: 8,
    title: "Mob Psycho 100",
    feeling: "Brave",
    memory: "Mob taught me that being ordinary and being kind is its own kind of strength.",
    displayName: "Anonymous",
    hearts: 87,
    lights: 52,
  },
];

const PAGE_SIZE = 6;
let currentFilter = "all";
let visibleCount = PAGE_SIZE;

const capsuleGrid = document.getElementById("capsule-grid");
const loadMoreBtn = document.getElementById("load-more");
const filterButtons = document.querySelectorAll(".filter-btn");

function renderCapsules() {
  const filtered = sampleCapsules.filter(
    (c) => currentFilter === "all" || c.feeling === currentFilter
  );
  const toShow = filtered.slice(0, visibleCount);

  capsuleGrid.innerHTML = toShow
    .map(
      (c) => `
    <article class="capsule-card">
      <div class="capsule-card__icon" aria-hidden="true">◈</div>
      <div class="capsule-card__body">
        <span class="capsule-tag">${escapeHtml(c.feeling)}</span>
        <h3 class="capsule-card__title">${escapeHtml(c.title)}</h3>
        <p class="capsule-card__memory">"${escapeHtml(c.memory)}"</p>
        <div class="capsule-card__footer">
          <span class="capsule-card__name">${escapeHtml(c.displayName)}</span>
          <div class="capsule-reactions">
            <button class="reaction" data-reaction="heart" data-id="${c.id}" aria-label="I felt this too">♡ ${c.hearts}</button>
            <button class="reaction" data-reaction="light" data-id="${c.id}" aria-label="This gave me hope">✦ ${c.lights}</button>
          </div>
        </div>
      </div>
    </article>
  `
    )
    .join("");

  loadMoreBtn.style.display = visibleCount >= filtered.length ? "none" : "inline-block";
}

function escapeHtml(str) {
  const div = document.createElement("div");
  div.textContent = str;
  return div.innerHTML;
}

filterButtons.forEach((btn) => {
  btn.addEventListener("click", () => {
    filterButtons.forEach((b) => b.classList.remove("active"));
    btn.classList.add("active");
    currentFilter = btn.dataset.filter;
    visibleCount = PAGE_SIZE;
    renderCapsules();
  });
});

loadMoreBtn.addEventListener("click", () => {
  visibleCount += PAGE_SIZE;
  renderCapsules();
});

// Lightweight reaction buttons — local increment only for MVP.
// Real implementation should POST to backend to persist counts.
capsuleGrid.addEventListener("click", (e) => {
  const btn = e.target.closest(".reaction");
  if (!btn) return;
  const id = Number(btn.dataset.id);
  const capsule = sampleCapsules.find((c) => c.id === id);
  if (!capsule) return;
  if (btn.dataset.reaction === "heart") capsule.hearts += 1;
  else capsule.lights += 1;
  renderCapsules();
});

renderCapsules();

// ─────────────────────────────────────────────────────────────
// FORM SUBMISSION
// For MVP this is handled entirely client-side (no network call).
//
// To connect a real backend, replace the try block below with a
// fetch() call to one of:
//   - Airtable:            POST https://api.airtable.com/v0/{base}/{table}
//   - Supabase:             supabase.from('capsules').insert(payload)
//   - Cloudflare Workers/D1: fetch('/api/submit', { method: 'POST', body: JSON.stringify(payload) })
//   - Google Forms:          POST to the form's formResponse URL
//   - Netlify Forms:         add data-netlify="true" to the <form> tag
//   - beehiiv / Mailchimp:   POST email only to your list endpoint
//
// Never auto-publish submissions to the public gallery without
// human moderation, even if consent was given.
// ─────────────────────────────────────────────────────────────
const form = document.getElementById("capsule-form");
const thankyou = document.getElementById("thankyou");

form.addEventListener("submit", (e) => {
  e.preventDefault();

  let valid = true;

  const email = document.getElementById("email");
  const emailError = document.getElementById("email-error");
  if (!email.value || !email.checkValidity()) {
    emailError.textContent = "Please enter a valid email address.";
    valid = false;
  } else {
    emailError.textContent = "";
  }

  const title = document.getElementById("story-title");
  const titleError = document.getElementById("title-error");
  if (!title.value.trim()) {
    titleError.textContent = "Please share a story title.";
    valid = false;
  } else {
    titleError.textContent = "";
  }

  const memory = document.getElementById("memory");
  const memoryError = document.getElementById("memory-error");
  if (!memory.value.trim()) {
    memoryError.textContent = "Please share what moment stayed with you.";
    valid = false;
  } else {
    memoryError.textContent = "";
  }

  const consent = form.querySelector('input[name="consent"]:checked');
  const consentError = document.getElementById("consent-error");
  if (!consent) {
    consentError.textContent = "Please choose a sharing preference.";
    valid = false;
  } else {
    consentError.textContent = "";
  }

  if (!valid) return;

  // Placeholder payload — wire this into a real endpoint later.
  const payload = {
    email: email.value,
    story_title: title.value,
    memory: memory.value,
    display_name: document.getElementById("display-name").value,
    social_handle: document.getElementById("social-handle").value,
    feelings: Array.from(form.querySelectorAll('input[name="feelings"]:checked')).map(
      (el) => el.value
    ),
    consent: consent.value,
  };

  // console.log("Capsule submission (placeholder):", payload);

  form.hidden = true;
  thankyou.hidden = false;
  thankyou.scrollIntoView({ behavior: "smooth", block: "start" });
});

const memoryField = document.getElementById("memory");
const memoryChar = document.getElementById("memory-char");
memoryField.addEventListener("input", () => {
  memoryChar.textContent = `${memoryField.value.length} / 1000`;
});
