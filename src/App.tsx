import { useEffect, useMemo, useRef, useState } from "react";
import type { FormEvent, ReactNode } from "react";

type Feeling =
  | "Less alone"
  | "Seen / Understood"
  | "Comforted"
  | "Hopeful"
  | "Brave"
  | "Inspired"
  | "Ready to keep going"
  | "Other";

type Capsule = {
  id: number | string;
  title: string;
  feeling: Feeling;
  mediaType?: MediaType;
  motif: string;
  caption: string;
  memory: string;
  hearts: number;
  stars: number;
};

type MediaType = "Anime" | "Manga" | "Game" | "Music";
type Route = "home" | "capsules";

const feelings: Feeling[] = [
  "Less alone",
  "Seen / Understood",
  "Comforted",
  "Hopeful",
  "Brave",
  "Inspired",
  "Ready to keep going",
  "Other",
];

const mediaTypes: MediaType[] = ["Anime", "Manga", "Game", "Music"];

const productionOrigin = "https://capsule.aniwell.net";

function apiUrl(path: string) {
  return window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1"
    ? `${productionOrigin}${path}`
    : path;
}

function normalizeMediaType(value: unknown): MediaType | undefined {
  const cleaned = String(value ?? "").trim();

  return mediaTypes.includes(cleaned as MediaType) ? (cleaned as MediaType) : undefined;
}

function getCapsuleMediaType(capsule: Capsule): MediaType {
  if (capsule.mediaType) {
    return capsule.mediaType;
  }

  const text = `${capsule.title} ${capsule.memory}`.toLowerCase();

  if (/\b(game|final fantasy|persona|zelda|pokemon|pokémon|kingdom hearts|nier|undertale)\b/.test(text)) {
    return "Game";
  }

  if (/\b(song|music|band|album|lyrics|vocaloid|utaite|soundtrack|ost|theme)\b/.test(text)) {
    return "Music";
  }

  if (/\b(manga|comic|manhwa|webtoon|chapter)\b/.test(text)) {
    return "Manga";
  }

  return "Anime";
}

const sampleCapsules: Capsule[] = [
  {
    id: 1,
    title: "Naruto",
    feeling: "Less alone",
    mediaType: "Anime",
    motif: "lantern",
    caption: "A small light in the dark.",
    memory:
      "When Naruto kept trying even when everyone rejected him, I felt like maybe I could keep going too.",
    hearts: 128,
    stars: 73,
  },
  {
    id: 2,
    title: "A Silent Voice",
    feeling: "Seen / Understood",
    mediaType: "Manga",
    motif: "letter",
    caption: "A note that gave your feeling a name.",
    memory: "Shoya's journey made me feel less alone in my regrets.",
    hearts: 146,
    stars: 81,
  },
  {
    id: 3,
    title: "Clannad",
    feeling: "Comforted",
    mediaType: "Anime",
    motif: "moon",
    caption: "A moonlit place to rest.",
    memory: "This story broke me and healed me at the same time.",
    hearts: 98,
    stars: 64,
  },
  {
    id: 4,
    title: "Violet Evergarden",
    feeling: "Hopeful",
    mediaType: "Anime",
    motif: "dawn",
    caption: "A small dawn after a long night.",
    memory:
      "She taught me that it's okay to keep searching for the right words.",
    hearts: 123,
    stars: 77,
  },
  {
    id: 5,
    title: "Attack on Titan",
    feeling: "Brave",
    mediaType: "Manga",
    motif: "flame",
    caption: "A spark that helped you step forward.",
    memory: "Eren's determination made me face my own fears.",
    hearts: 112,
    stars: 59,
  },
  {
    id: 6,
    title: "Final Fantasy X",
    feeling: "Inspired",
    mediaType: "Game",
    motif: "music",
    caption: "A melody that woke something inside.",
    memory: "The music helped me feel something I could not put into words.",
    hearts: 131,
    stars: 85,
  },
  {
    id: 7,
    title: "Fullmetal Alchemist",
    feeling: "Ready to keep going",
    mediaType: "Manga",
    motif: "compass",
    caption: "A path that reminded you to continue.",
    memory:
      "It reminded me that even after losing something, you can still walk forward.",
    hearts: 120,
    stars: 70,
  },
  {
    id: 8,
    title: "Unknown",
    feeling: "Other",
    mediaType: "Music",
    motif: "prism",
    caption: "A feeling that does not need a name yet.",
    memory:
      "I do not know exactly what I felt, but something inside me changed.",
    hearts: 88,
    stars: 52,
  },
];

const feelingMeta: Record<Feeling, { className: string; short: string; image: string }> = {
  "Less alone": {
    className: "less-alone",
    short: "Lantern",
    image: "/assets/capsules/capsule-less-alone.png",
  },
  "Seen / Understood": {
    className: "seen",
    short: "Letter",
    image: "/assets/capsules/capsule-seen.png",
  },
  Comforted: {
    className: "comforted",
    short: "Moon",
    image: "/assets/capsules/capsule-comforted.png",
  },
  Hopeful: {
    className: "hopeful",
    short: "Rest",
    image: "/assets/capsules/capsule-hopeful.png",
  },
  Brave: {
    className: "brave",
    short: "Flame",
    image: "/assets/capsules/capsule-brave.png",
  },
  Inspired: {
    className: "inspired",
    short: "Feather",
    image: "/assets/capsules/capsule-inspired.png",
  },
  "Ready to keep going": {
    className: "ready",
    short: "Sprout",
    image: "/assets/capsules/capsule-ready.png",
  },
  Other: {
    className: "other",
    short: "Prism",
    image: "/assets/capsules/capsule-other.png",
  },
};

export function App() {
  const [route, setRoute] = useState<Route>(() =>
    window.location.pathname.includes("capsules") ? "capsules" : "home",
  );

  useEffect(() => {
    const syncRoute = () => {
      setRoute(window.location.pathname.includes("capsules") ? "capsules" : "home");
    };

    window.addEventListener("popstate", syncRoute);
    return () => window.removeEventListener("popstate", syncRoute);
  }, []);

  useEffect(() => {
    if (!window.location.hash) {
      return;
    }

    window.setTimeout(() => {
      document
        .querySelector(window.location.hash)
        ?.scrollIntoView({ behavior: "auto" });
    }, 100);
  }, [route]);

  const navigate = (nextRoute: Route, hash?: string) => {
    const path = nextRoute === "capsules" ? "/capsules" : "/";
    window.history.pushState({}, "", `${path}${hash ?? ""}`);
    setRoute(nextRoute);
    window.setTimeout(() => {
      if (hash) {
        document.querySelector(hash)?.scrollIntoView({ behavior: "smooth" });
      } else {
        window.scrollTo({ top: 0, behavior: "smooth" });
      }
    }, 0);
  };

  return (
    <div className="site-shell">
      <StarField />
      <Header onNavigate={navigate} />
      {route === "home" ? (
        <MainPage onNavigate={navigate} />
      ) : (
        <GalleryPage onNavigate={navigate} />
      )}
      <MusicControl />
      <Footer />
    </div>
  );
}

function MusicControl() {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [playing, setPlaying] = useState(false);
  const [blocked, setBlocked] = useState(false);

  const toggleMusic = async () => {
    const audio = audioRef.current;

    if (!audio) {
      return;
    }

    if (playing) {
      audio.pause();
      audio.currentTime = 0;
      setPlaying(false);
      return;
    }

    try {
      audio.volume = 0.42;
      await audio.play();
      setPlaying(true);
      setBlocked(false);
    } catch {
      setBlocked(true);
      setPlaying(false);
    }
  };

  return (
    <div className="music-control">
      <audio
        ref={audioRef}
        src="/assets/crystal-corridor.mp3"
        preload="auto"
        loop
        onEnded={() => setPlaying(false)}
      />
      <button
        className={playing ? "music-button is-playing" : "music-button"}
        type="button"
        aria-label={playing ? "Stop music" : "Play music"}
        onClick={toggleMusic}
      >
        <span className="music-icon" aria-hidden="true">
          {playing ? "II" : "M"}
        </span>
        <span>{playing ? "Stop" : "Music"}</span>
      </button>
      {blocked ? <p>Tap again to play.</p> : null}
    </div>
  );
}

function Header({ onNavigate }: { onNavigate: (route: Route, hash?: string) => void }) {
  const [open, setOpen] = useState(false);

  return (
    <header className="header">
      <button className="brand" type="button" onClick={() => onNavigate("home")}>
        <img className="brand-logo" src="/assets/aniwell-logo.png" alt="Aniwell" />
      </button>
      <button
        className="menu-button"
        type="button"
        aria-label="Open navigation"
        aria-expanded={open}
        onClick={() => setOpen(!open)}
      >
        <span />
        <span />
        <span />
      </button>
      <nav className={open ? "nav-popover is-open" : "nav-popover"} aria-label="Main">
        <button type="button" onClick={() => onNavigate("home", "#story-form")}>
          Add Story
        </button>
        <button type="button" onClick={() => onNavigate("capsules")}>
          Capsules
        </button>
        <a href="#follow">Follow</a>
      </nav>
    </header>
  );
}

function MainPage({ onNavigate }: { onNavigate: (route: Route, hash?: string) => void }) {
  return (
    <main>
      <section className="hero section">
        <div className="hero-copy">
          <p className="eyebrow">Created for Anime Expo 2026</p>
          <h1>Anime Story Capsule</h1>
          <p className="hero-subtitle">
            Every fan has a story. Every story has a moment. And sometimes,
            that moment changes a life.
          </p>
          <p>
            What anime, manga, or game changed yours? Share your story with us.
          </p>
          <div className="hero-actions">
            <button
              className="primary-button"
              type="button"
              onClick={() =>
                document
                  .querySelector("#story-form")
                  ?.scrollIntoView({ behavior: "smooth" })
              }
            >
              Add My Story <span aria-hidden="true">+</span>
            </button>
            <button
              className="text-link"
              type="button"
              onClick={() => onNavigate("capsules")}
            >
              View Other Capsules <span aria-hidden="true">-&gt;</span>
            </button>
          </div>
        </div>
        <div className="hero-art" aria-label="Glowing crystal story capsule">
          <CrystalCapsule feeling="Inspired" size="hero" />
        </div>
      </section>

      <section className="section compact">
        <GlassCard className="concept-card">
          <h2>What is Anime Story Capsule?</h2>
          <p>
            Anime Story Capsule is a place to keep the anime, manga, game,
            music, character, scene, or quote that stayed with you.
          </p>
          <p>
            It can be something that made you feel less alone, gave your feeling
            a name, helped you rest, gave you hope, sparked courage, inspired
            you, or reminded you to keep going.
          </p>
          <p>You do not need to explain it perfectly. Just share the story.</p>
        </GlassCard>
      </section>

      <StoryForm onNavigate={onNavigate} />
      <HowItWorks />
      <AnimeExpoCard />
      <GalleryTeaser onNavigate={onNavigate} />
      <FollowAniwell />
      <GoodsCTA />
    </main>
  );
}

function StoryForm({ onNavigate }: { onNavigate: (route: Route, hash?: string) => void }) {
  const [submitted, setSubmitted] = useState(false);
  const [submittedFeeling, setSubmittedFeeling] = useState<Feeling>("Other");
  const [selectedFeelings, setSelectedFeelings] = useState<Feeling[]>([]);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [emailNotice, setEmailNotice] = useState("");

  const toggleFeeling = (feeling: Feeling) => {
    setSelectedFeelings((current) =>
      current.includes(feeling)
        ? current.filter((item) => item !== feeling)
        : [...current, feeling],
    );
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formElement = event.currentTarget;
    const form = new FormData(formElement);
    const email = String(form.get("email") ?? "").trim();
    const title = String(form.get("title") ?? "").trim();
    const mediaType = normalizeMediaType(form.get("mediaType"));
    const memory = String(form.get("memory") ?? "").trim();
    const name = String(form.get("name") ?? "").trim();
    const social = String(form.get("social") ?? "").trim();
    const consent = String(form.get("consent") ?? "");

    if (!email || !title || !memory || !consent) {
      setError("Please complete the required fields before adding your story.");
      return;
    }

    setSubmitting(true);
    setError("");
    setEmailNotice("");

    try {
      const response = await fetch(apiUrl("/api/submit"), {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({
          email,
          title,
          mediaType,
          memory,
          name,
          social,
          feelings: selectedFeelings,
          consent,
        }),
      });

      const result = (await response.json()) as {
        ok?: boolean;
        error?: string;
        emailSent?: boolean;
        emailError?: string;
      };

      if (!response.ok || !result.ok) {
        throw new Error(result.error || "Could not submit your story.");
      }

      setSubmittedFeeling(selectedFeelings[0] ?? "Other");
      setSubmitted(true);
      setEmailNotice(
        result.emailSent
          ? "Your story was saved and Aniwell has been notified."
          : "Your story was saved. Email notification is not configured yet.",
      );
      formElement.reset();
      setSelectedFeelings([]);
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : "Could not submit your story. Please try again.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className="section" id="story-form">
      <GlassCard className="form-card">
        {!submitted ? (
          <>
            <div className="section-heading">
              <p className="eyebrow">Write and submit</p>
              <h2>Place Your Story in the Capsule</h2>
              <p>Your story may be the one that helps someone else.</p>
            </div>
            <form onSubmit={handleSubmit} noValidate>
              <Field label="Email Address" required>
                <input name="email" type="email" placeholder="you@example.com" />
              </Field>
              <Field label="Story Title" required>
                <input
                  name="title"
                  type="text"
                  placeholder="Anime, manga, game, song, character, scene, or quote"
                />
              </Field>
              <fieldset>
                <legend>
                  Story Type
                  <span>Choose the closest category.</span>
                </legend>
                <div className="radio-card compact-options">
                  {mediaTypes.map((mediaType) => (
                    <label key={mediaType} className="choice-row">
                      <input name="mediaType" type="radio" value={mediaType} />
                      <span>{mediaType}</span>
                    </label>
                  ))}
                </div>
              </fieldset>
              <Field label="What moment stayed with you?" required>
                <textarea
                  name="memory"
                  rows={5}
                  placeholder="Share the scene, line, song, or feeling that stayed with you."
                />
              </Field>
              <Field label="Name or Nickname">
                <input name="name" type="text" placeholder="How should we call you?" />
              </Field>
              <Field label="Social Handle">
                <input
                  name="social"
                  type="text"
                  placeholder="Instagram, X, or any handle you'd like to share"
                />
              </Field>
              <fieldset>
                <legend>
                  What did it help you feel?
                  <span>Choose any that fit.</span>
                </legend>
                <div className="check-list">
                  {feelings.map((feeling) => (
                    <label key={feeling} className="choice-row">
                      <input
                        type="checkbox"
                        name="feelings"
                        value={feeling}
                        checked={selectedFeelings.includes(feeling)}
                        onChange={() => toggleFeeling(feeling)}
                      />
                      <span>{feeling}</span>
                    </label>
                  ))}
                </div>
              </fieldset>
              <fieldset>
                <legend>
                  May we anonymously share your capsule on this website or in
                  future Aniwell community projects? <b>*</b>
                </legend>
                <div className="radio-card">
                  <label className="choice-row">
                    <input name="consent" type="radio" value="yes" />
                    <span>Yes, you may share it anonymously.</span>
                  </label>
                  <label className="choice-row">
                    <input name="consent" type="radio" value="no" />
                    <span>No, please keep it private.</span>
                  </label>
                </div>
              </fieldset>
              {error ? <p className="form-error">{error}</p> : null}
              <button className="primary-button full" type="submit" disabled={submitting}>
                {submitting ? "Adding..." : "Add My Story"} <span aria-hidden="true">+</span>
              </button>
              <p className="privacy-note">
                We will never share your email, name, or social handle publicly.
              </p>
            </form>
          </>
        ) : (
          <div className="thank-you">
            <CrystalCapsule feeling={submittedFeeling} size="small" />
            <h2>Your capsule has been added.</h2>
            <p>Thank you for sharing a story that mattered to you.</p>
            {emailNotice ? <p className="privacy-note">{emailNotice}</p> : null}
            <div className="hero-actions centered">
              <button className="primary-button" type="button" onClick={() => onNavigate("capsules")}>
                View Other Capsules
              </button>
              <a className="text-link" href="#follow">
                Follow Aniwell <span aria-hidden="true">-&gt;</span>
              </a>
            </div>
          </div>
        )}
      </GlassCard>
    </section>
  );
}

function GalleryPage({ onNavigate }: { onNavigate: (route: Route, hash?: string) => void }) {
  const [filter, setFilter] = useState<Feeling | "All">("All");
  const [mediaFilter, setMediaFilter] = useState<MediaType | "All">("All");
  const [communityCapsules, setCommunityCapsules] = useState<Capsule[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  useEffect(() => {
    let cancelled = false;

    const loadCapsules = async () => {
      try {
        setLoading(true);
        setLoadError("");

        const response = await fetch(apiUrl("/api/capsules"), {
          headers: {
            accept: "application/json",
          },
          cache: "no-store",
        });
        const result = (await response.json()) as {
          ok?: boolean;
          capsules?: Capsule[];
          error?: string;
        };

        if (!response.ok || !result.ok || !Array.isArray(result.capsules)) {
          throw new Error(result.error || "Could not load community capsules.");
        }

        if (!cancelled) {
          setCommunityCapsules(result.capsules);
        }
      } catch (error) {
        if (!cancelled) {
          setLoadError(
            error instanceof Error
              ? error.message
              : "Could not load community capsules.",
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    loadCapsules();

    return () => {
      cancelled = true;
    };
  }, []);

  const allCapsules = useMemo(() => [...communityCapsules, ...sampleCapsules], [communityCapsules]);
  const capsules = useMemo(
    () =>
      allCapsules.filter((capsule) => {
        const feelingMatches = filter === "All" || capsule.feeling === filter;
        const mediaMatches = mediaFilter === "All" || getCapsuleMediaType(capsule) === mediaFilter;

        return feelingMatches && mediaMatches;
      }),
    [allCapsules, filter, mediaFilter],
  );

  return (
    <main className="gallery-page">
      <section className="section gallery-hero">
        <div className="section-heading">
          <p className="eyebrow">Community capsules</p>
          <h1>Open Another Capsule</h1>
          <p>Anonymous anime, manga, game, and music memories shared by the community.</p>
        </div>
        <button className="primary-button" type="button" onClick={() => onNavigate("home", "#story-form")}>
          Add Your Story <span aria-hidden="true">+</span>
        </button>
      </section>

      <section className="section gallery-list-section">
        <div className="filter-group">
          <p>Story type</p>
          <div className="filter-chips" aria-label="Filter capsules by story type">
            {(["All", ...mediaTypes] as const).map((chip) => (
              <button
                key={chip}
                type="button"
                className={mediaFilter === chip ? "chip active" : "chip"}
                onClick={() => setMediaFilter(chip)}
              >
                {chip}
              </button>
            ))}
          </div>
        </div>
        <div className="filter-group">
          <p>Feeling</p>
          <div className="filter-chips" aria-label="Filter capsules by feeling">
            {(["All", ...feelings] as const).map((chip) => (
              <button
                key={chip}
                type="button"
                className={filter === chip ? "chip active" : "chip"}
                onClick={() => setFilter(chip)}
              >
                {chip}
              </button>
            ))}
          </div>
        </div>
        {loading ? <p className="gallery-status">Loading community capsules...</p> : null}
        {loadError ? (
          <p className="gallery-status">
            Community capsules could not be loaded yet. Showing sample capsules.
          </p>
        ) : null}
        {!loading && !loadError && communityCapsules.length > 0 ? (
          <p className="gallery-status">
            Showing {communityCapsules.length} shared community capsule
            {communityCapsules.length === 1 ? "" : "s"}.
          </p>
        ) : null}
        <div className="capsule-list">
          {capsules.map((capsule) => (
            <CapsuleCard key={capsule.id} capsule={capsule} />
          ))}
        </div>
        {!loading && capsules.length === 0 ? (
          <p className="gallery-status">No capsules match these filters yet.</p>
        ) : null}
        <div className="bottom-cta">
          <button className="primary-button" type="button" onClick={() => onNavigate("home", "#story-form")}>
            Add Your Story to the Capsule
          </button>
        </div>
      </section>
    </main>
  );
}

function CapsuleCard({
  capsule,
}: {
  capsule: Capsule;
}) {
  const mediaType = getCapsuleMediaType(capsule);

  return (
    <article className="capsule-card">
      <CrystalCapsule feeling={capsule.feeling} size="card" />
      <div>
        <div className="tag-row">
          <span className="media-tag">{mediaType}</span>
          <span className={`feeling-tag ${feelingMeta[capsule.feeling].className}`}>
            {capsule.feeling}
          </span>
        </div>
        <h3>{capsule.title}</h3>
        <p>&quot;{capsule.memory}&quot;</p>
      </div>
    </article>
  );
}

function GalleryTeaser({ onNavigate }: { onNavigate: (route: Route) => void }) {
  return (
    <section className="section compact">
      <GlassCard className="teaser-card">
        <CrystalCapsule feeling="Comforted" size="tiny" />
        <div>
          <h2>Want to see what others have placed in their capsules?</h2>
          <button className="text-link" type="button" onClick={() => onNavigate("capsules")}>
            Open Another Capsule <span aria-hidden="true">-&gt;</span>
          </button>
        </div>
      </GlassCard>
    </section>
  );
}

function HowItWorks() {
  const steps = [
    {
      number: "1",
      title: "Add Your Story",
      body: "Share the anime story that moved you.",
    },
    {
      number: "2",
      title: "Your Capsule is Added",
      body: "Your story is placed in the capsule.",
    },
    {
      number: "3",
      title: "Stories Connect Us",
      body: "Your story may inspire someone around the world.",
    },
    {
      number: "4",
      title: "Care for Yourself and Others",
      body: "Together we build a kinder world.",
    },
  ];

  return (
    <section className="section how-section" id="how-it-works">
      <div className="timeline-card">
        <div className="timeline-heading">
          <span aria-hidden="true">✦</span>
          <h2>How It Works</h2>
          <span aria-hidden="true">✦</span>
        </div>
        <ol className="timeline">
          {steps.map((step) => (
            <li key={step.number}>
              <div className="timeline-copy">
                <span className="timeline-number">{step.number}</span>
                <h3>{step.title}</h3>
                <p>{step.body}</p>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

function AnimeExpoCard() {
  return (
    <section className="section compact">
      <GlassCard className="expo-card">
        <div>
          <p className="eyebrow">Created for Anime Expo 2026</p>
          <h2>A Psychiatrist on Anime Culture: How Your Favorite Anime Could Save Your Life</h2>
          <p>July 5, 2:30 PM - 3:50 PM<br />Room 404AB</p>
          <a className="text-link" href="#">
            Learn more about the panel <span aria-hidden="true">-&gt;</span>
          </a>
        </div>
        <CrystalCapsule feeling="Less alone" size="tiny" />
      </GlassCard>
    </section>
  );
}

function FollowAniwell() {
  const socialLinks = [
    {
      label: "Instagram",
      href: "https://www.instagram.com/aniwell_official/",
    },
    {
      label: "X",
      href: "https://x.com/PantoFrancesco",
    },
  ];

  return (
    <section className="section compact" id="follow">
      <GlassCard className="follow-card">
        <h2>Follow Aniwell</h2>
        <p>See where these stories go next.</p>
        <div className="socials" aria-label="Social links">
          {socialLinks.map((social) => (
            <a
              href={social.href}
              key={social.label}
              aria-label={social.label}
              target="_blank"
              rel="noreferrer"
            >
              {social.label}
            </a>
          ))}
        </div>
      </GlassCard>
    </section>
  );
}

function GoodsCTA() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");
  const [message, setMessage] = useState("");

  const handleWaitlistSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const cleanEmail = email.trim();

    if (!cleanEmail) {
      setStatus("error");
      setMessage("Please enter your email address.");
      return;
    }

    setStatus("submitting");
    setMessage("");

    try {
      const response = await fetch(apiUrl("/api/waitlist"), {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({ email: cleanEmail }),
      });
      const result = (await response.json()) as { ok?: boolean; error?: string };

      if (!response.ok || !result.ok) {
        throw new Error(result.error || "Could not join the waitlist.");
      }

      setStatus("success");
      setMessage("You're on the waitlist.");
      setEmail("");
    } catch (error) {
      setStatus("error");
      setMessage(
        error instanceof Error ? error.message : "Could not join the waitlist.",
      );
    }
  };

  return (
    <section className="section compact">
      <GlassCard className="goods-card">
        <div>
          <h2>Take the Next Step in Your Story</h2>
          <p>
            Aniwell creates self-care tools inspired by anime, manga, games,
            music, and characters.
          </p>
          <p>
            We are also planning to publish an English-language book.
          </p>
          <form className="waitlist-form" onSubmit={handleWaitlistSubmit} noValidate>
            <input
              aria-label="Email address for the waitlist"
              type="email"
              value={email}
              placeholder="you@example.com"
              onChange={(event) => setEmail(event.target.value)}
            />
            <button
              className="primary-button small"
              type="submit"
              disabled={status === "submitting"}
            >
              {status === "submitting" ? "Joining..." : "Join the Waitlist"}
              <span aria-hidden="true">-&gt;</span>
            </button>
          </form>
          {message ? (
            <p className={status === "error" ? "waitlist-message error" : "waitlist-message"}>
              {message}
            </p>
          ) : null}
        </div>
        <CrystalCapsule feeling="Other" size="tiny" />
      </GlassCard>
    </section>
  );
}

function Footer() {
  return (
    <footer className="footer">
      <div>
        <div className="brand footer-brand">
          <img className="brand-logo" src="/assets/aniwell-logo.png" alt="Aniwell" />
        </div>
        <p>
          Aniwell is building a world where anime, music, and characters support
          self-care and personal growth.
        </p>
      </div>
      <nav aria-label="Footer">
        {["About Aniwell", "Privacy Policy", "Terms of Use", "Contact"].map((link) => (
          <a href="#" key={link}>
            {link}
          </a>
        ))}
      </nav>
      <p className="disclaimer">
        This project is for reflection and community-building. It is not medical
        advice, therapy, diagnosis, treatment, or crisis support. If you are in
        immediate danger or need urgent help, please contact local emergency
        services or a crisis hotline in your country.
      </p>
    </footer>
  );
}

function Field({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: ReactNode;
}) {
  return (
    <label className="field">
      <span>
        {label} {required ? <b>*</b> : <em>(optional)</em>}
      </span>
      {children}
    </label>
  );
}

function GlassCard({
  className = "",
  children,
}: {
  className?: string;
  children: ReactNode;
}) {
  return <div className={`glass-card ${className}`}>{children}</div>;
}

function CrystalCapsule({
  feeling,
  size,
}: {
  feeling: Feeling;
  size: "hero" | "small" | "card" | "tiny";
}) {
  const meta = feelingMeta[feeling];
  const image = size === "hero" ? "/assets/capsules/capsule-hero-clean.png" : meta.image;

  return (
    <div className={`crystal-wrap ${size} ${meta.className}`} title={meta.short}>
      <span className="crystal-aura" />
      <img className="crystal-image" src={image} alt="" draggable="false" />
    </div>
  );
}

function StarField() {
  return (
    <div className="star-field" aria-hidden="true">
      <span />
      <span />
      <span />
      <span />
      <span />
    </div>
  );
}
