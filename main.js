const sampleCapsules = [
  {
    id: 1,
    title: "Naruto",
    feeling: "Less alone",
    memory:
      "When Naruto kept trying even when everyone rejected him, I felt like maybe I could keep going too.",
    hearts: 128,
    stars: 73,
    variant: "variant-blue",
    detail: "orb",
  },
  {
    id: 2,
    title: "Attack on Titan",
    feeling: "Brave",
    memory: "Eren's determination made me face my own fears.",
    hearts: 112,
    stars: 59,
    variant: "variant-amber",
    detail: "orb",
  },
  {
    id: 3,
    title: "Clannad",
    feeling: "Comforted",
    memory: "This story broke me and healed me at the same time.",
    hearts: 98,
    stars: 64,
    variant: "variant-violet",
    detail: "orb",
  },
  {
    id: 4,
    title: "A Silent Voice",
    feeling: "Understood",
    memory: "Shoya's journey made me feel less alone in my regrets.",
    hearts: 146,
    stars: 81,
    variant: "variant-violet",
    detail: "paper",
  },
  {
    id: 5,
    title: "Violet Evergarden",
    feeling: "Hopeful",
    memory: "She taught me that it's okay to keep searching for the right words.",
    hearts: 123,
    stars: 77,
    variant: "variant-garden",
    detail: "seedling",
  },
  {
    id: 6,
    title: "Final Fantasy X",
    feeling: "Ready to keep going",
    memory: "Tidus showed me that it's okay to cry, even if you're still walking forward.",
    hearts: 131,
    stars: 85,
    variant: "variant-wheel",
    detail: "wheel",
  },
];

const filters = [
  "All",
  "Less alone",
  "Brave",
  "Comforted",
  "Understood",
  "Hopeful",
  "Ready to keep going",
];

const filterBar = document.querySelector("#filter-bar");
const galleryGrid = document.querySelector("#gallery-grid");
const storyForm = document.querySelector("#story-form");
const thankYou = document.querySelector("#thank-you");
const resetButton = document.querySelector("#reset-form");
const formStatus = document.querySelector("#form-status");
const turnstileContainer = document.querySelector("#turnstile-container");

let activeFilter = "All";
let turnstileWidgetId = null;

function setFormStatus(message, type = "") {
  formStatus.textContent = message;
  formStatus.className = "form-status";

  if (type) {
    formStatus.classList.add(`is-${type}`);
  }
}

function memoryMarkup(detail) {
  if (detail === "paper") {
    return '<span class="memory-paper"></span>';
  }

  if (detail === "seedling") {
    return '<span class="memory-seedling"></span>';
  }

  if (detail === "wheel") {
    return '<span class="memory-wheel"></span>';
  }

  return '<span class="memory-orb"></span>';
}

function buildCapsuleThumb(capsule) {
  return `
    <div class="capsule-thumb crystal-capsule ${capsule.variant}" aria-hidden="true">
      <div class="crystal-top"></div>
      <div class="crystal-body">
        <span class="glow-shard shard-a"></span>
        <span class="glow-shard shard-b"></span>
        <span class="glow-note note-a">✦</span>
        ${memoryMarkup(capsule.detail)}
      </div>
      <div class="crystal-base"></div>
    </div>
  `;
}

function renderFilterBar() {
  filterBar.innerHTML = "";

  filters.forEach((filter) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = `filter-chip${filter === activeFilter ? " active" : ""}`;
    button.textContent = filter;
    button.addEventListener("click", () => {
      activeFilter = filter;
      renderFilterBar();
      renderGallery();
    });
    filterBar.appendChild(button);
  });
}

function renderGallery() {
  const visibleCapsules =
    activeFilter === "All"
      ? sampleCapsules
      : sampleCapsules.filter((capsule) => capsule.feeling === activeFilter);

  galleryGrid.innerHTML = "";

  visibleCapsules.forEach((capsule) => {
    const article = document.createElement("article");
    article.className = "capsule-card";
    article.innerHTML = `
      ${buildCapsuleThumb(capsule)}
      <div class="capsule-meta">
        <span class="feel-tag">${capsule.feeling}</span>
        <h3>${capsule.title}</h3>
        <p>"${capsule.memory}"</p>
        <div class="stats-row">
          <span>♡ ${capsule.hearts}</span>
          <span>✧ ${capsule.stars}</span>
        </div>
      </div>
    `;
    galleryGrid.appendChild(article);
  });
}

async function loadTurnstile() {
  try {
    const response = await fetch("/api/config");
    const config = await response.json();

    if (!response.ok || !config.turnstileSiteKey) {
      setFormStatus(
        "Turnstile is not configured yet. Add your Cloudflare keys before collecting submissions.",
        "error"
      );
      return;
    }

    if (!window.turnstile) {
      setFormStatus(
        "Turnstile script is still loading. Refresh once the page finishes loading.",
        "error"
      );
      return;
    }

    turnstileWidgetId = window.turnstile.render(turnstileContainer, {
      sitekey: config.turnstileSiteKey,
      theme: "dark",
      appearance: "always",
      callback: () => setFormStatus("Turnstile check complete.", "success"),
      "expired-callback": () =>
        setFormStatus("Turnstile expired. Please confirm again before submitting.", "error"),
      "error-callback": () =>
        setFormStatus("Turnstile could not load. Please try again.", "error"),
    });
  } catch (error) {
    setFormStatus(
      "Form configuration could not be loaded. Check your Pages Functions deployment.",
      "error"
    );
  }
}

async function submitStory(formData) {
  const response = await fetch("/api/submit", {
    method: "POST",
    body: formData,
  });

  return response.json().then((data) => ({ ok: response.ok, data }));
}

storyForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  if (!storyForm.reportValidity()) {
    return;
  }

  const formData = new FormData(storyForm);
  const token = formData.get("cf-turnstile-response");

  if (!token) {
    setFormStatus("Please complete the Turnstile check before submitting.", "error");
    return;
  }

  setFormStatus("Sending your capsule...", "success");

  try {
    const result = await submitStory(formData);

    if (!result.ok) {
      setFormStatus(result.data.error || "We could not send your story. Please try again.", "error");

      if (window.turnstile && turnstileWidgetId !== null) {
        window.turnstile.reset(turnstileWidgetId);
      }
      return;
    }

    storyForm.classList.add("hidden");
    thankYou.classList.remove("hidden");

    if (result.data.warning) {
      setFormStatus(result.data.warning, "error");
    } else {
      setFormStatus("Your story has been saved and notification email was sent.", "success");
    }

    thankYou.scrollIntoView({ behavior: "smooth", block: "nearest" });
  } catch (error) {
    setFormStatus("A network error occurred while sending your story.", "error");

    if (window.turnstile && turnstileWidgetId !== null) {
      window.turnstile.reset(turnstileWidgetId);
    }
  }
});

resetButton.addEventListener("click", () => {
  storyForm.reset();
  storyForm.classList.remove("hidden");
  thankYou.classList.add("hidden");
  setFormStatus("");

  if (window.turnstile && turnstileWidgetId !== null) {
    window.turnstile.reset(turnstileWidgetId);
  }

  storyForm.scrollIntoView({ behavior: "smooth", block: "start" });
});

renderFilterBar();
renderGallery();
loadTurnstile();
