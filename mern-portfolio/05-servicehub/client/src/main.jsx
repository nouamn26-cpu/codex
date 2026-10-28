import React, { useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import "./style.css";

const SUBJECTS = [
  "Mathematics",
  "Web Development",
  "English",
  "Physics",
  "Design",
  "Computer Science",
];
const money = (n) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(n);
const date = (n) =>
  new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(n));
const localTomorrow = () => {
  const d = new Date(Date.now() + 86400000);
  d.setHours(16, 0, 0, 0);
  return new Date(d - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
};
function Icon({ name = "arrow", size = 20, ...rest }) {
  const paths = {
    search: (
      <>
        <circle cx="10.5" cy="10.5" r="6.5" />
        <path d="m16 16 4.5 4.5" />
      </>
    ),
    arrow: <path d="M5 12h14m-5-5 5 5-5 5" />,
    star: (
      <path d="m12 3 2.8 5.7 6.2.9-4.5 4.4 1.1 6.2-5.6-3-5.6 3 1.1-6.2L3 9.6l6.2-.9Z" />
    ),
    book: (
      <>
        <path d="M12 6v15M3 4c4-1 6 0 9 2 3-2 5-3 9-2v15c-4-1-6 0-9 2-3-2-5-3-9-2Z" />
      </>
    ),
    calendar: (
      <>
        <rect x="3" y="5" width="18" height="16" rx="3" />
        <path d="M7 3v4m10-4v4M3 11h18m-13 4h2m4 0h2" />
      </>
    ),
    chat: (
      <path d="M21 11.5a8.5 8.5 0 0 1-8.5 8.5H4l-2 2v-9.5A8.5 8.5 0 1 1 21 11.5Z" />
    ),
    check: <path d="m5 12 4 4L19 6" />,
    close: <path d="m6 6 12 12M6 18 18 6" />,
    globe: (
      <>
        <circle cx="12" cy="12" r="9" />
        <path d="M3 12h18M12 3c5 5 5 13 0 18-5-5-5-13 0-18Z" />
      </>
    ),
    shield: (
      <>
        <path d="m12 3 8 3v6c0 5-8 9-8 9s-8-4-8-9V6Z" />
        <path d="m8 12 3 3 5-6" />
      </>
    ),
    spark: (
      <path d="m12 2 2.5 7.5L22 12l-7.5 2.5L12 22l-2.5-7.5L2 12l7.5-2.5Z" />
    ),
    user: (
      <>
        <circle cx="12" cy="8" r="4" />
        <path d="M4 22v-2a8 8 0 0 1 16 0v2" />
      </>
    ),
    clock: (
      <>
        <circle cx="12" cy="12" r="9" />
        <path d="M12 7v5l3 2" />
      </>
    ),
    location: (
      <>
        <path d="M20 10c0 6-8 12-8 12S4 16 4 10a8 8 0 1 1 16 0Z" />
        <circle cx="12" cy="10" r="2.5" />
      </>
    ),
  };
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...rest}
    >
      {paths[name] || paths.arrow}
    </svg>
  );
}
function Avatar({ tutor, large = false }) {
  return (
    <div
      className={`avatar ${large ? "large" : ""}`}
      style={{ background: tutor.color || "#eee0d5" }}
    >
      <svg viewBox="0 0 120 120" aria-hidden="true">
        <path
          d="M20 120c0-30 17-44 40-44s40 14 40 44"
          fill="#fff"
          opacity=".85"
        />
        <ellipse cx="60" cy="51" rx="24" ry="29" fill="#c48b65" />
        <path
          d="M36 50c-9-30 19-49 42-32 16 11 11 30 7 38-2-19-11-22-19-29-9 13-17 15-30 16"
          fill="#302c2a"
        />
        <path
          d="M44 89 60 104 77 89"
          fill="none"
          stroke="#efbe9b"
          strokeWidth="7"
        />
        <circle cx="51" cy="51" r="2" fill="#302c2a" />
        <circle cx="70" cy="51" r="2" fill="#302c2a" />
        <path
          d="M54 67q6 5 12 0"
          fill="none"
          stroke="#754a37"
          strokeWidth="2.5"
          strokeLinecap="round"
        />
      </svg>
      <span className="availability-dot" title="Accepting requests" />
    </div>
  );
}
function Dialog({ title, children, onClose, wide = false }) {
  useEffect(() => {
    const listener = (e) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", listener);
    return () => document.removeEventListener("keydown", listener);
  }, [onClose]);
  return (
    <div className="overlay" onClick={onClose}>
      <section
        className={`dialog ${wide ? "wide" : ""}`}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="dialog-top">
          <h2>{title}</h2>
          <button
            className="icon-btn"
            aria-label="Close dialog"
            onClick={onClose}
          >
            <Icon name="close" />
          </button>
        </div>
        {children}
      </section>
    </div>
  );
}
function App() {
  const [token, setToken] = useState(
    () => localStorage.getItem("servicehub-token") || "",
  );
  const [user, setUser] = useState(null),
    [view, setView] = useState("discover"),
    [tutors, setTutors] = useState([]),
    [sessions, setSessions] = useState([]),
    [admin, setAdmin] = useState(null),
    [profile, setProfile] = useState(null);
  const [q, setQ] = useState(""),
    [subject, setSubject] = useState(""),
    [max, setMax] = useState(100),
    [sort, setSort] = useState("recommended"),
    [loading, setLoading] = useState(true),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [notice, setNotice] = useState("");
  const [auth, setAuth] = useState(""),
    [detail, setDetail] = useState(null),
    [thread, setThread] = useState(null),
    [messages, setMessages] = useState([]),
    [review, setReview] = useState(null),
    [report, setReport] = useState(null),
    [about, setAbout] = useState(false);
  async function api(url, method = "GET", body) {
    const response = await fetch(`/api${url}`, {
      method,
      headers: {
        ...(body ? { "Content-Type": "application/json" } : {}),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      ...(body ? { body: JSON.stringify(body) } : {}),
    });
    const result = await response.json();
    if (!response.ok)
      throw new Error(result.error || "The request could not be completed.");
    return result;
  }
  function showNotice(message) {
    setNotice(message);
    setTimeout(() => setNotice(""), 5000);
  }
  async function loadTutors() {
    setLoading(true);
    try {
      const data = await api(
        `/tutors?q=${encodeURIComponent(q)}&subject=${encodeURIComponent(subject)}&max=${max}`,
      );
      setTutors(data.tutors);
      setError("");
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }
  async function loadSessions() {
    try {
      setSessions((await api("/sessions")).sessions);
    } catch (e) {
      setError(e.message);
    }
  }
  async function loadAdmin() {
    try {
      setAdmin(await api("/admin"));
    } catch (e) {
      setError(e.message);
    }
  }
  async function loadProfile() {
    try {
      const d = await api("/profile");
      setProfile(
        d.tutor || {
          headline: "",
          bio: "",
          location: "",
          rate: 25,
          experience: 0,
          subjects: ["Mathematics"],
        },
      );
    } catch (e) {
      setError(e.message);
    }
  }
  useEffect(() => {
    const timeout = setTimeout(loadTutors, 180);
    return () => clearTimeout(timeout);
  }, [q, subject, max]);
  useEffect(() => {
    if (!token) {
      setUser(null);
      return;
    }
    api("/auth/me")
      .then((d) => setUser(d.user))
      .catch(() => {
        setToken("");
        localStorage.removeItem("servicehub-token");
      });
  }, [token]);
  useEffect(() => {
    if (user) {
      loadSessions();
      if (user.role === "admin") loadAdmin();
      if (user.role === "provider") loadProfile();
    }
  }, [user]);
  useEffect(() => {
    if (!thread) return;
    let alive = true;
    const poll = () =>
      api(`/sessions/${thread.id}/messages`)
        .then((d) => {
          if (alive) setMessages(d.messages);
        })
        .catch((e) => {
          if (alive) setError(e.message);
        });
    poll();
    const timer = setInterval(poll, 5000);
    return () => {
      alive = false;
      clearInterval(timer);
    };
  }, [thread, token]);
  async function mutate(url, method, body, done) {
    setBusy(true);
    setError("");
    try {
      const d = await api(url, method, body);
      if (done) await done(d);
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }
  async function doAuth(event) {
    event.preventDefault();
    const form = Object.fromEntries(new FormData(event.currentTarget));
    await mutate(
      `/auth/${auth === "register" ? "register" : "login"}`,
      "POST",
      form,
      (d) => {
        localStorage.setItem("servicehub-token", d.token);
        setToken(d.token);
        setUser(d.user);
        setAuth("");
        showNotice(`Welcome, ${d.user.name.split(" ")[0]}!`);
      },
    );
  }
  async function demoLogin(role) {
    const email = {
      customer: "student@servicehub.demo",
      provider: "tutor@servicehub.demo",
      admin: "admin@servicehub.demo",
    }[role];
    await mutate(
      "/auth/login",
      "POST",
      { email, password: "DemoPass123!" },
      (d) => {
        localStorage.setItem("servicehub-token", d.token);
        setToken(d.token);
        setUser(d.user);
        setAuth("");
        setView(role === "admin" ? "admin" : "discover");
        showNotice(
          `Demo ${role === "customer" ? "student" : role} account opened.`,
        );
      },
    );
  }
  function signOut() {
    localStorage.removeItem("servicehub-token");
    setToken("");
    setUser(null);
    setView("discover");
    setSessions([]);
    setThread(null);
    setDetail(null);
    showNotice("You have signed out.");
  }
  async function action(session, choice) {
    await mutate(
      `/sessions/${session.id}/action`,
      "POST",
      { action: choice },
      async () => {
        await loadSessions();
        showNotice("Session updated.");
      },
    );
  }
  const sorted = [...tutors].sort((a, b) =>
    sort === "price"
      ? a.rate - b.rate
      : sort === "rating"
        ? (b.rating || 0) - (a.rating || 0)
        : 0,
  );
  const active = sessions.filter((s) =>
    ["requested", "accepted", "completion_requested"].includes(s.status),
  ).length;
  return (
    <>
      <div className="demo-bar">
        <span>
          <span className="tiny-dot" /> MERN portfolio demo
        </span>
        <span>
          Find your people. Grow your potential. <Icon name="spark" size={13} />
        </span>
        <button onClick={() => setAbout(true)}>
          About this project <span>↗</span>
        </button>
      </div>
      <header className="header">
        <button
          className="brand"
          onClick={() => setView("discover")}
          aria-label="ServiceHub home"
        >
          <span className="brand-symbol">
            <Icon name="spark" size={25} />
          </span>
          servicehub<span className="brand-dot">.</span>
        </button>
        <nav aria-label="Main navigation">
          <button
            className={view === "discover" ? "active" : ""}
            onClick={() => setView("discover")}
          >
            Find a tutor
          </button>
          <button
            className={view === "sessions" ? "active" : ""}
            onClick={() =>
              user ? (setView("sessions"), loadSessions()) : setAuth("login")
            }
          >
            My sessions{active > 0 && <span className="count">{active}</span>}
          </button>
          {user?.role === "provider" && (
            <button
              className={view === "profile" ? "active" : ""}
              onClick={() => setView("profile")}
            >
              My profile
            </button>
          )}
          {user?.role === "admin" && (
            <button
              className={view === "admin" ? "active" : ""}
              onClick={() => {
                setView("admin");
                loadAdmin();
              }}
            >
              Moderation
            </button>
          )}
          <button
            onClick={() =>
              document
                .getElementById("how-it-works")
                ?.scrollIntoView({ behavior: "smooth" })
            }
          >
            How it works
          </button>
        </nav>
        <div className="header-right">
          {user ? (
            <>
              <span className="user-name">
                <span>{user.name.charAt(0)}</span>
                {user.name.split(" ")[0]}
                <small>
                  {user.role === "customer" ? "Student" : user.role}
                </small>
              </span>
              <button className="btn subtle small" onClick={signOut}>
                Sign out
              </button>
            </>
          ) : (
            <>
              <button className="plain-btn" onClick={() => setAuth("login")}>
                Log in
              </button>
              <button
                className="btn dark small"
                onClick={() => setAuth("register")}
              >
                Get started <Icon name="arrow" size={16} />
              </button>
            </>
          )}
        </div>
      </header>
      {error && (
        <div className="global-error" role="alert">
          {error}
          <button onClick={() => setError("")} aria-label="Dismiss error">
            ×
          </button>
        </div>
      )}
      {notice && (
        <div className="toast" role="status">
          <Icon name="check" size={18} />
          {notice}
        </div>
      )}
      <main>
        {view === "discover" && (
          <>
            <section className="hero">
              <div className="hero-copy">
                <div className="eyebrow">
                  <span className="tiny-dot" /> A LITTLE GUIDANCE. A BIG
                  DIFFERENCE.
                </div>
                <h1>
                  Your next
                  <br />
                  <span>breakthrough</span>
                  <br />
                  starts here<span className="coral">.</span>
                </h1>
                <p>
                  Good tutors do more than teach. They help you see
                  <br className="desktop-break" /> what you are capable of. Find
                  yours today.
                </p>
                <form
                  className="hero-search"
                  onSubmit={(e) => {
                    e.preventDefault();
                    document
                      .getElementById("tutors")
                      .scrollIntoView({ behavior: "smooth" });
                  }}
                >
                  <Icon name="search" size={21} />
                  <input
                    aria-label="Search tutor or subject"
                    placeholder="What would you love to learn?"
                    value={q}
                    onChange={(e) => setQ(e.target.value)}
                  />
                  <button className="btn coral-btn" type="submit">
                    Find a tutor <Icon name="arrow" size={18} />
                  </button>
                </form>
                <div className="hero-meta">
                  <span>
                    <Icon name="check" size={15} /> Personal, 1:1 learning
                  </span>
                  <span>
                    <Icon name="globe" size={15} /> Learn from anywhere
                  </span>
                </div>
              </div>
              <div className="hero-art" aria-label="Learn at your own pace">
                <div className="orbit orbit-one" />
                <div className="orbit orbit-two" />
                <span className="art-spark one">✳</span>
                <span className="art-spark two">✦</span>
                <div className="math-note">
                  <span>little steps,</span>
                  <strong>big ideas.</strong>
                  <svg viewBox="0 0 120 35">
                    <path
                      d="M5 25Q35 5 62 20T112 10"
                      fill="none"
                      stroke="#f3694e"
                      strokeWidth="3"
                    />
                  </svg>
                </div>
                <div className="mentor-card">
                  <div className="mentor-tag">
                    <span className="tiny-dot" /> YOUR NEXT CHAPTER
                  </div>
                  <div className="mentor-portrait">
                    <Avatar tutor={{ color: "#e4eddf" }} large />
                    <div className="portrait-blob" />
                  </div>
                  <div className="mentor-info">
                    <div>
                      <strong>That “I get it!” feeling.</strong>
                      <span>One great tutor away.</span>
                    </div>
                    <span className="mentor-arrow">
                      <Icon name="arrow" size={20} />
                    </span>
                  </div>
                </div>
                <div className="floating-note">
                  <span className="note-icon">
                    <Icon name="spark" size={22} />
                  </span>
                  <div>
                    <strong>Made for your pace.</strong>
                    <span>And your kind of curious.</span>
                  </div>
                </div>
                <div className="art-label">STAY CURIOUS ↗</div>
              </div>
            </section>
            <section className="subject-strip" aria-label="Popular subjects">
              <span>FOLLOW YOUR CURIOSITY</span>
              {SUBJECTS.map((s, i) => (
                <button
                  key={s}
                  className={subject === s ? "chosen" : ""}
                  onClick={() => {
                    setSubject(subject === s ? "" : s);
                    document
                      .getElementById("tutors")
                      .scrollIntoView({ behavior: "smooth" });
                  }}
                >
                  <span>{["∑", "⌘", "Aa", "⚛", "✎", "〈/〉"][i]}</span>
                  {s}
                </button>
              ))}
            </section>
            <section className="tutor-section" id="tutors">
              <div className="section-heading">
                <div>
                  <div className="eyebrow">REAL PEOPLE. REAL PROGRESS.</div>
                  <h2>A good match makes all the difference.</h2>
                  <p>
                    Find someone who makes learning feel like a conversation.
                  </p>
                </div>
                <span className="outline-tag">
                  <Icon name="book" size={16} /> 60-minute sessions
                </span>
              </div>
              <div className="catalog-layout">
                <aside className="filters">
                  <div className="filter-title">
                    Make it your own <span>⌁</span>
                  </div>
                  <label>
                    Subject
                    <select
                      value={subject}
                      onChange={(e) => setSubject(e.target.value)}
                    >
                      <option value="">All subjects</option>
                      {SUBJECTS.map((s) => (
                        <option key={s}>{s}</option>
                      ))}
                    </select>
                  </label>
                  <label>
                    Hourly budget{" "}
                    <span className="budget">Up to {money(max)}</span>
                    <input
                      type="range"
                      min="5"
                      max="100"
                      step="5"
                      value={max}
                      onChange={(e) => setMax(Number(e.target.value))}
                    />
                  </label>
                  <div className="range-label">
                    <span>$5</span>
                    <span>$100</span>
                  </div>
                  <button
                    className="reset-btn"
                    onClick={() => {
                      setSubject("");
                      setMax(100);
                      setQ("");
                    }}
                  >
                    Reset filters
                  </button>
                  <div className="filter-help">
                    <Icon name="spark" size={28} />
                    <h3>
                      A little curiosity
                      <br />
                      goes a long way.
                    </h3>
                    <p>
                      Tell your tutor what you want to achieve. Your first step
                      is a conversation.
                    </p>
                  </div>
                </aside>
                <div className="catalog">
                  <div className="result-bar">
                    <span>
                      {loading
                        ? "Finding your match…"
                        : `${sorted.length} tutor${sorted.length === 1 ? "" : "s"} to meet`}
                    </span>
                    <label>
                      Sort by{" "}
                      <select
                        value={sort}
                        onChange={(e) => setSort(e.target.value)}
                      >
                        <option value="recommended">Recommended</option>
                        <option value="price">Price: low to high</option>
                        <option value="rating">Highest rated</option>
                      </select>
                    </label>
                  </div>
                  {loading ? (
                    <div className="empty">Finding your next teacher…</div>
                  ) : sorted.length === 0 ? (
                    <div className="empty">
                      <Icon name="search" size={32} />
                      <h3>No tutors found just yet.</h3>
                      <p>Try another subject or a higher budget.</p>
                      <button
                        className="btn coral-btn"
                        onClick={() => {
                          setQ("");
                          setSubject("");
                          setMax(100);
                        }}
                      >
                        Clear filters
                      </button>
                    </div>
                  ) : (
                    <div className="tutor-grid">
                      {sorted.map((t) => (
                        <article className="tutor-card" key={t.id}>
                          <div className="card-top">
                            <Avatar tutor={t} />
                            <span className="rating">
                              <Icon name="star" size={14} />
                              {t.rating ? t.rating.toFixed(1) : "New"}
                              <small>
                                {t.reviewCount ? `(${t.reviewCount})` : ""}
                              </small>
                            </span>
                          </div>
                          <div className="tutor-subject">
                            {t.subject.toUpperCase()}
                          </div>
                          <h3>
                            {t.name}
                            <span
                              className="online-icon"
                              title="Accepting requests"
                            >
                              ↗
                            </span>
                          </h3>
                          <p className="headline">{t.headline}</p>
                          <div className="tutor-details">
                            <span>
                              <Icon name="location" size={14} />
                              {t.location}
                            </span>
                            <span>{t.experience} years teaching</span>
                          </div>
                          <div className="card-bottom">
                            <div>
                              <strong>{money(t.rate)}</strong>
                              <span> / hour</span>
                            </div>
                            <button
                              className="btn card-button"
                              onClick={() => setDetail(t)}
                            >
                              Meet {t.name.split(" ")[0]}{" "}
                              <Icon name="arrow" size={16} />
                            </button>
                          </div>
                        </article>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </section>
          </>
        )}
        {view === "sessions" && (
          <section className="workspace">
            <div className="section-heading">
              <div>
                <div className="eyebrow">YOUR LEARNING, IN ONE PLACE</div>
                <h1 className="page-title">
                  My sessions<span className="coral">.</span>
                </h1>
                <p>
                  Coordinate in messages. Share your meeting link with your
                  tutor.
                </p>
              </div>
              <button
                className="btn coral-btn"
                onClick={() => setView("discover")}
              >
                Find a tutor <Icon name="arrow" size={17} />
              </button>
            </div>
            <div className="session-summary">
              <div>
                <strong>{active}</strong>
                <span>Active sessions</span>
              </div>
              <div>
                <strong>
                  {sessions.filter((s) => s.status === "completed").length}
                </strong>
                <span>Completed sessions</span>
              </div>
              <div>
                <strong>60 min</strong>
                <span>Each lesson</span>
              </div>
            </div>
            {sessions.length === 0 ? (
              <div className="empty">
                <Icon name="calendar" size={38} />
                <h3>Your next chapter is waiting.</h3>
                <p>Request a session to start learning.</p>
              </div>
            ) : (
              <div className="session-list">
                {sessions.map((s) => (
                  <article className="session-card" key={s.id}>
                    <div className="session-icon">
                      <Icon name="book" size={26} />
                    </div>
                    <div className="session-content">
                      <div className="session-title">
                        <h3>
                          {s.subject} with{" "}
                          {user.role === "provider"
                            ? s.customerName
                            : s.tutorName}
                        </h3>
                        <span className={`status ${s.status}`}>
                          {s.status.replaceAll("_", " ")}
                        </span>
                      </div>
                      <div className="session-date">
                        <Icon name="calendar" size={15} />
                        {date(s.startAt)} <span>·</span> {money(s.price)} / 60
                        min
                      </div>
                      <p>{s.message}</p>
                      <div className="session-actions">
                        {!["cancelled", "declined"].includes(s.status) && (
                          <button
                            className="btn subtle small"
                            onClick={() => {
                              setThread(s);
                              setMessages([]);
                            }}
                          >
                            <Icon name="chat" size={16} /> Messages
                          </button>
                        )}
                        {user.role === "provider" &&
                          s.status === "requested" && (
                            <>
                              <button
                                className="btn coral-btn small"
                                disabled={busy}
                                onClick={() => action(s, "accept")}
                              >
                                Accept request
                              </button>
                              <button
                                className="plain-btn danger"
                                disabled={busy}
                                onClick={() => action(s, "decline")}
                              >
                                Decline
                              </button>
                            </>
                          )}
                        {user.role === "provider" &&
                          s.status === "accepted" && (
                            <button
                              className="btn coral-btn small"
                              disabled={busy}
                              onClick={() => action(s, "complete")}
                            >
                              Request completion
                            </button>
                          )}
                        {user.role === "customer" &&
                          ["requested", "accepted"].includes(s.status) && (
                            <button
                              className="plain-btn danger"
                              disabled={busy}
                              onClick={() => action(s, "cancel")}
                            >
                              Cancel session
                            </button>
                          )}
                        {user.role === "customer" &&
                          s.status === "completion_requested" && (
                            <button
                              className="btn coral-btn small"
                              disabled={busy}
                              onClick={() => action(s, "confirm")}
                            >
                              Confirm completed
                            </button>
                          )}
                        {user.role === "customer" &&
                          s.status === "completed" &&
                          !s.review && (
                            <button
                              className="btn coral-btn small"
                              onClick={() => setReview(s)}
                            >
                              <Icon name="star" size={15} /> Leave a review
                            </button>
                          )}
                        {s.review && (
                          <span className="review-label">
                            ★ {s.review.rating}/5 · Review submitted
                          </span>
                        )}
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>
        )}
        {view === "profile" && profile && (
          <section className="workspace">
            <div className="eyebrow">TEACH WHAT YOU LOVE</div>
            <h1 className="page-title">
              Your tutor profile<span className="coral">.</span>
            </h1>
            <p className="muted">
              Changes appear in the directory immediately. Admins can unpublish
              listings.
            </p>
            <form
              className="profile-form panel"
              onSubmit={async (e) => {
                e.preventDefault();
                const f = Object.fromEntries(new FormData(e.currentTarget));
                f.subjects = profile.subjects;
                await mutate("/profile", "PUT", f, async (d) => {
                  setProfile(d.tutor);
                  await loadTutors();
                  showNotice("Your profile is live.");
                });
              }}
            >
              <label>
                Headline
                <input
                  name="headline"
                  value={profile.headline}
                  onChange={(e) =>
                    setProfile({ ...profile, headline: e.target.value })
                  }
                  required
                  maxLength={100}
                />
              </label>
              <label>
                About your teaching
                <textarea
                  name="bio"
                  value={profile.bio}
                  onChange={(e) =>
                    setProfile({ ...profile, bio: e.target.value })
                  }
                  required
                  maxLength={1500}
                  rows="5"
                />
              </label>
              <div className="form-row">
                <label>
                  Hourly rate (USD)
                  <input
                    name="rate"
                    type="number"
                    min="5"
                    max="500"
                    step="1"
                    value={profile.rate}
                    onChange={(e) =>
                      setProfile({ ...profile, rate: e.target.value })
                    }
                    required
                  />
                </label>
                <label>
                  Years of teaching
                  <input
                    name="experience"
                    type="number"
                    min="0"
                    max="60"
                    value={profile.experience}
                    onChange={(e) =>
                      setProfile({ ...profile, experience: e.target.value })
                    }
                  />
                </label>
              </div>
              <label>
                Location
                <input
                  name="location"
                  value={profile.location}
                  onChange={(e) =>
                    setProfile({ ...profile, location: e.target.value })
                  }
                  required
                  maxLength={70}
                />
              </label>
              <fieldset>
                <legend>Subjects you teach</legend>
                <div className="checkbox-list">
                  {SUBJECTS.map((s) => (
                    <label key={s}>
                      <input
                        type="checkbox"
                        checked={profile.subjects.includes(s)}
                        onChange={(e) =>
                          setProfile({
                            ...profile,
                            subjects: e.target.checked
                              ? [...profile.subjects, s]
                              : profile.subjects.filter((x) => x !== s),
                          })
                        }
                      />
                      {s}
                    </label>
                  ))}
                </div>
              </fieldset>
              <button className="btn coral-btn" disabled={busy}>
                {busy ? "Saving…" : "Save profile"}
                <Icon name="check" size={16} />
              </button>
            </form>
          </section>
        )}
        {view === "admin" && admin && (
          <section className="workspace">
            <div className="section-heading">
              <div>
                <div className="eyebrow">KEEP THE COMMUNITY WELCOMING</div>
                <h1 className="page-title">
                  Moderation<span className="coral">.</span>
                </h1>
              </div>
              <button className="btn subtle" onClick={loadAdmin}>
                Refresh
              </button>
            </div>
            <div className="session-summary">
              {Object.entries(admin.stats).map(([k, v]) => (
                <div key={k}>
                  <strong>{v}</strong>
                  <span>{k}</span>
                </div>
              ))}
            </div>
            <div className="panel">
              <h2>Community accounts</h2>
              <div className="table-scroll">
                <table>
                  <thead>
                    <tr>
                      <th>Member</th>
                      <th>Role</th>
                      <th>Status</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {admin.users.map((u) => (
                      <tr key={u.id}>
                        <td>
                          <strong>{u.name}</strong>
                          <small>{u.email}</small>
                        </td>
                        <td>{u.role}</td>
                        <td>
                          <span
                            className={`status ${u.suspended ? "declined" : "completed"}`}
                          >
                            {u.suspended ? "Suspended" : "Active"}
                          </span>
                        </td>
                        <td>
                          {u.role !== "admin" && (
                            <button
                              className="btn subtle small"
                              disabled={busy}
                              onClick={() =>
                                mutate(
                                  `/admin/users/${u.id}`,
                                  "PATCH",
                                  { suspended: !u.suspended },
                                  async () => {
                                    await loadAdmin();
                                    await loadTutors();
                                    showNotice("Account status updated.");
                                  },
                                )
                              }
                            >
                              {u.suspended ? "Restore" : "Suspend"}
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
            <div className="panel">
              <h2>Directory listings</h2>
              {admin.tutors.map((t) => (
                <div className="moderation-row" key={t.id}>
                  <div>
                    <strong>{t.name}</strong>
                    <small>{t.headline}</small>
                  </div>
                  <button
                    className="btn subtle small"
                    disabled={busy}
                    onClick={() =>
                      mutate(
                        `/admin/tutors/${t.id}`,
                        "PATCH",
                        { published: !t.published },
                        async () => {
                          await loadAdmin();
                          await loadTutors();
                        },
                      )
                    }
                  >
                    {t.published ? "Unpublish" : "Publish"}
                  </button>
                </div>
              ))}
            </div>
            <div className="panel">
              <h2>Community reports</h2>
              {admin.reports.length === 0 ? (
                <p className="muted">
                  No reports. A good day in the community.
                </p>
              ) : (
                admin.reports.map((r) => (
                  <div className="moderation-row" key={r.id}>
                    <div>
                      <strong>
                        {admin.tutors.find((t) => t.id === r.tutorId)?.name ||
                          "Tutor"}{" "}
                        · {r.status}
                      </strong>
                      <p>{r.reason}</p>
                    </div>
                    <button
                      className="btn subtle small"
                      onClick={() =>
                        mutate(
                          `/admin/reports/${r.id}`,
                          "PATCH",
                          { status: r.status === "open" ? "resolved" : "open" },
                          loadAdmin,
                        )
                      }
                    >
                      {r.status === "open" ? "Resolve" : "Reopen"}
                    </button>
                  </div>
                ))
              )}
            </div>
          </section>
        )}
        <section className="how-section" id="how-it-works">
          <div>
            <div className="eyebrow">A SIMPLE WAY FORWARD</div>
            <h2>
              Less friction.
              <br />
              More lightbulb moments.
            </h2>
          </div>
          <div className="how-step">
            <span>01</span>
            <h3>Find your person.</h3>
            <p>
              Explore subjects, teaching styles and rates. Choose someone who
              feels right.
            </p>
          </div>
          <div className="how-step">
            <span>02</span>
            <h3>Start a conversation.</h3>
            <p>
              Request a time and share your goals. Your tutor accepts and
              coordinates in messages.
            </p>
          </div>
          <div className="how-step">
            <span>03</span>
            <h3>Keep growing.</h3>
            <p>
              Meet using your preferred video tool. Confirm completion and share
              your feedback.
            </p>
          </div>
        </section>
      </main>
      <footer>
        <button
          className="brand"
          onClick={() => {
            setView("discover");
            window.scrollTo({ top: 0, behavior: "smooth" });
          }}
        >
          <span className="brand-symbol">
            <Icon name="spark" size={21} />
          </span>
          servicehub<span className="brand-dot">.</span>
        </button>
        <span>A little guidance can change everything.</span>
        <button onClick={() => setAbout(true)}>
          Portfolio demo · Built with MERN ↗
        </button>
      </footer>
      {auth && (
        <Dialog
          title={
            auth === "register" ? "A good place to start." : "Welcome back."
          }
          onClose={() => setAuth("")}
        >
          <p className="muted">
            {auth === "register"
              ? "Create an account to learn or teach."
              : "Sign in to your ServiceHub account."}
          </p>
          <form onSubmit={doAuth} className="stack-form">
            {auth === "register" && (
              <>
                <label>
                  Your name
                  <input
                    name="name"
                    autoComplete="name"
                    required
                    maxLength="60"
                  />
                </label>
                <label>
                  I want to
                  <select name="role">
                    <option value="customer">Find a tutor</option>
                    <option value="provider">Become a tutor</option>
                  </select>
                </label>
              </>
            )}
            <label>
              Email
              <input type="email" name="email" autoComplete="email" required />
            </label>
            <label>
              Password
              <input
                type="password"
                name="password"
                autoComplete={
                  auth === "register" ? "new-password" : "current-password"
                }
                minLength={auth === "register" ? 10 : 1}
                required
              />
            </label>
            <button className="btn coral-btn" disabled={busy}>
              {busy
                ? "One moment…"
                : auth === "register"
                  ? "Create account"
                  : "Sign in"}{" "}
              <Icon name="arrow" size={17} />
            </button>
          </form>
          <button
            className="switch-auth"
            onClick={() => setAuth(auth === "register" ? "login" : "register")}
          >
            {auth === "register"
              ? "Already a member? Sign in"
              : "New here? Create an account"}
          </button>
          <div className="demo-logins">
            <span>EXPLORE THE SEEDED DEMO</span>
            <div>
              <button disabled={busy} onClick={() => demoLogin("customer")}>
                Student ↗
              </button>
              <button disabled={busy} onClick={() => demoLogin("provider")}>
                Tutor ↗
              </button>
              <button disabled={busy} onClick={() => demoLogin("admin")}>
                Admin ↗
              </button>
            </div>
            <small>
              Demo accounts are shared. Use sample information only.
            </small>
          </div>
        </Dialog>
      )}
      {detail && (
        <Dialog
          title={`Meet ${detail.name.split(" ")[0]}.`}
          onClose={() => setDetail(null)}
          wide
        >
          <div className="detail-head">
            <Avatar tutor={detail} large />
            <div>
              <span className="tutor-subject">{detail.subject}</span>
              <h3>{detail.name}</h3>
              <p>{detail.headline}</p>
              <span className="rating">
                <Icon name="star" size={15} />
                {detail.rating
                  ? `${detail.rating.toFixed(1)} · ${detail.reviewCount} review${detail.reviewCount === 1 ? "" : "s"}`
                  : "New to ServiceHub"}
              </span>
            </div>
          </div>
          <p className="bio">{detail.bio}</p>
          <div className="tags">
            {detail.subjects.map((s) => (
              <span key={s}>{s}</span>
            ))}
            <span>{detail.experience} years experience</span>
          </div>
          <div className="booking-box">
            <h3>Your next step starts here.</h3>
            <p>
              One 60-minute session · <strong>{money(detail.rate)}</strong> ·
              Demo quote, no payment collected.
            </p>
            {user?.role === "customer" ? (
              <form
                className="stack-form"
                onSubmit={async (e) => {
                  e.preventDefault();
                  const f = Object.fromEntries(new FormData(e.currentTarget));
                  f.tutorId = detail.id;
                  f.startAt = new Date(f.startAt).toISOString();
                  await mutate("/sessions", "POST", f, async () => {
                    setDetail(null);
                    await loadSessions();
                    setView("sessions");
                    showNotice(
                      "Session requested. Your tutor will respond soon.",
                    );
                  });
                }}
              >
                <div className="form-row">
                  <label>
                    Subject
                    <select name="subject">
                      {detail.subjects.map((s) => (
                        <option key={s}>{s}</option>
                      ))}
                    </select>
                  </label>
                  <label>
                    Date & time (your local time)
                    <input
                      type="datetime-local"
                      name="startAt"
                      defaultValue={localTomorrow()}
                      min={new Date(
                        Date.now() -
                          new Date().getTimezoneOffset() * 60000 +
                          15 * 60000,
                      )
                        .toISOString()
                        .slice(0, 16)}
                      required
                    />
                  </label>
                </div>
                <label>
                  What would you like to work on?
                  <textarea
                    name="message"
                    placeholder="Tell your tutor a little about your goals…"
                    required
                    maxLength="1000"
                    rows="3"
                  />
                </label>
                <button className="btn coral-btn" disabled={busy}>
                  {busy ? "Sending request…" : "Request this session"}
                  <Icon name="arrow" size={17} />
                </button>
              </form>
            ) : user ? (
              <p className="muted">
                Use a student account to request a session.
              </p>
            ) : (
              <button
                className="btn coral-btn"
                onClick={() => {
                  setDetail(null);
                  setAuth("login");
                }}
              >
                Sign in to request <Icon name="arrow" size={17} />
              </button>
            )}
          </div>
          {detail.reviews.length > 0 && (
            <div className="reviews">
              <h3>Words from a learner.</h3>
              {detail.reviews.map((r) => (
                <blockquote key={r.id}>
                  <div>
                    {"★".repeat(r.rating)}
                    <span>{r.customerName}</span>
                  </div>
                  <p>“{r.text}”</p>
                </blockquote>
              ))}
            </div>
          )}
          {user && (
            <button
              className="report-btn"
              onClick={() => {
                setReport(detail);
                setDetail(null);
              }}
            >
              Report this listing
            </button>
          )}
        </Dialog>
      )}
      {thread && (
        <Dialog
          title={`${thread.subject} · Messages`}
          onClose={() => setThread(null)}
        >
          <p className="muted small-text">
            Private to the student and tutor. Refreshes every 5 seconds. Share
            your meeting link here.
          </p>
          <div className="messages" aria-live="polite">
            {messages.length === 0 ? (
              <p className="muted">Say hello and plan your session.</p>
            ) : (
              messages.map((m) => (
                <div
                  key={m.id}
                  className={`message ${m.senderId === user.id ? "mine" : ""}`}
                >
                  <strong>{m.senderName}</strong>
                  <p>{m.text}</p>
                  <time>{date(m.createdAt)}</time>
                </div>
              ))
            )}
          </div>
          <form
            className="message-form"
            onSubmit={async (e) => {
              e.preventDefault();
              const form = e.currentTarget;
              const text = form.elements.text.value;
              await mutate(
                `/sessions/${thread.id}/messages`,
                "POST",
                { text },
                (d) => {
                  setMessages((old) => [...old, d.message]);
                  form.reset();
                },
              );
            }}
          >
            <input
              aria-label="Write a message"
              name="text"
              required
              maxLength="2000"
              placeholder="Write a thoughtful hello…"
            />
            <button className="btn coral-btn" disabled={busy}>
              Send <Icon name="arrow" size={15} />
            </button>
          </form>
        </Dialog>
      )}
      {review && (
        <Dialog
          title="How was your lightbulb moment?"
          onClose={() => setReview(null)}
        >
          <form
            className="stack-form"
            onSubmit={async (e) => {
              e.preventDefault();
              const f = Object.fromEntries(new FormData(e.currentTarget));
              await mutate(
                `/sessions/${review.id}/review`,
                "POST",
                f,
                async () => {
                  setReview(null);
                  await loadSessions();
                  await loadTutors();
                  showNotice("Thank you for sharing your experience.");
                },
              );
            }}
          >
            <label>
              Your rating
              <select name="rating">
                <option value="5">★★★★★ · Loved it</option>
                <option value="4">★★★★ · Great</option>
                <option value="3">★★★ · Good</option>
                <option value="2">★★ · Could be better</option>
                <option value="1">★ · Not for me</option>
              </select>
            </label>
            <label>
              Your experience
              <textarea name="text" rows="4" maxLength="1000" required />
            </label>
            <button className="btn coral-btn" disabled={busy}>
              Publish review
            </button>
          </form>
        </Dialog>
      )}
      {report && (
        <Dialog
          title="Help keep the community safe."
          onClose={() => setReport(null)}
        >
          <form
            className="stack-form"
            onSubmit={async (e) => {
              e.preventDefault();
              const f = Object.fromEntries(new FormData(e.currentTarget));
              f.tutorId = report.id;
              await mutate("/reports", "POST", f, () => {
                setReport(null);
                showNotice("Report submitted for admin review.");
              });
            }}
          >
            <p className="muted">
              Tell our demo moderation team about {report.name}'s listing.
            </p>
            <label>
              What happened?
              <textarea rows="4" name="reason" maxLength="1000" required />
            </label>
            <button className="btn coral-btn" disabled={busy}>
              Submit report
            </button>
          </form>
        </Dialog>
      )}
      {about && (
        <Dialog
          title="Built to show the whole journey."
          onClose={() => setAbout(false)}
        >
          <div className="about-copy">
            <p>
              ServiceHub is a personal portfolio demo of a tutoring marketplace
              built with React, Node.js, Express and MongoDB, with a file-backed
              local mode.
            </p>
            <p>
              Try student, tutor and admin accounts to explore requests,
              acceptance, messages, completion, reviews and moderation.
            </p>
            <p>
              <strong>
                No payments, built-in video calls, email delivery or identity
                checks are provided.
              </strong>{" "}
              Tutors and reviews are sample data. Teaching experience and
              profile details are self-reported. Messages poll every five
              seconds.
            </p>
            <p>
              Local dates use your browser's timezone. Quotes are in USD. Keep
              real personal information out of the shared demo accounts.
            </p>
            <button
              className="btn coral-btn"
              onClick={() => {
                setAbout(false);
                setAuth("login");
              }}
            >
              Explore demo accounts <Icon name="arrow" size={16} />
            </button>
          </div>
        </Dialog>
      )}
    </>
  );
}

createRoot(document.getElementById("root")).render(<App />);
