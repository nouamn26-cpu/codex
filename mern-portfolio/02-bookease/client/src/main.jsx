import React, { useState, useEffect, useRef } from "react";
import { createRoot } from "react-dom/client";
import "./styles.css";

const Icons = {
  arrow: (
    <>
      <path d="M5 12h14m-6-6 6 6-6 6" />
    </>
  ),
  calendar: (
    <>
      <rect x="4" y="5" width="16" height="16" rx="3" />
      <path d="M8 3v4m8-4v4M4 11h16m-10 4h4" />
    </>
  ),
  clock: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 2" />
    </>
  ),
  scissors: (
    <>
      <circle cx="6" cy="6" r="3" />
      <circle cx="6" cy="18" r="3" />
      <path d="m8.2 8.2 11 11m-11-3.4L20 4m-7 9 7 7" />
    </>
  ),
  wind: (
    <>
      <path d="M3 8h12a3 3 0 1 0-3-3M3 12h15a3 3 0 1 1-3 3M3 16h5a3 3 0 1 1-3 3" />
    </>
  ),
  razor: (
    <>
      <path d="m8 3 11 5-3 6-11-5zM7 11l-3 8 3 2 5-9m4-6 2-4" />
    </>
  ),
  sparkles: (
    <>
      <path d="m12 3 3 6 6 3-6 3-3 6-3-6-6-3 6-3zM20 2v4m-2-2h4" />
    </>
  ),
  palette: (
    <>
      <path d="M12 3a9 9 0 1 0 0 18h2a2 2 0 0 0 0-4h-1a2 2 0 0 1 0-4h4a4 4 0 0 0 4-4c0-3-4-6-9-6Z" />
      <path d="M7 8h.01M12 6h.01M6 13h.01M16 7h.01" />
    </>
  ),
  leaf: (
    <>
      <path d="M20 3C9 3 3 7 5 15c7 4 15-2 15-12Z" />
      <path d="M4 21 15 10" />
    </>
  ),
  user: (
    <>
      <circle cx="12" cy="8" r="4" />
      <path d="M4 21a8 8 0 0 1 16 0" />
    </>
  ),
  check: <path d="m5 12 4 4L19 6" />,
  close: <path d="m6 6 12 12M6 18 18 6" />,
  mail: (
    <>
      <rect x="3" y="5" width="18" height="14" rx="3" />
      <path d="m4 7 8 6 8-6" />
    </>
  ),
  star: (
    <path d="m12 3 2.8 5.7 6.2.9-4.5 4.4 1.1 6.2-5.6-3-5.6 3 1.1-6.2L3 9.6l6.2-.9Z" />
  ),
  shield: (
    <>
      <path d="m12 3 8 3v6c0 5-8 9-8 9s-8-4-8-9V6Z" />
      <path d="m8 12 3 3 5-6" />
    </>
  ),
  chevron: <path d="m9 5 7 7-7 7" />,
  settings: (
    <>
      <path d="M4 6h16M4 12h16M4 18h16" />
      <circle cx="9" cy="6" r="2" fill="currentColor" />
      <circle cx="15" cy="12" r="2" fill="currentColor" />
      <circle cx="8" cy="18" r="2" fill="currentColor" />
    </>
  ),
};
function Icon({ name, size = 20, ...props }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.65"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    >
      {Icons[name] || Icons.sparkles}
    </svg>
  );
}
const money = (n) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(n);
const localDate = () =>
  new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Karachi" }).format(
    new Date(),
  );
function addDays(n) {
  const d = new Date(`${localDate()}T12:00:00+05:00`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}
const prettyDate = (d) =>
  new Date(`${d}T12:00:00+05:00`).toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    timeZone: "Asia/Karachi",
  });
const prettyTime = (t) => {
  const [h, m] = t.split(":");
  return `${Number(h) > 12 ? Number(h) - 12 : Number(h)}:${m} ${Number(h) >= 12 ? "PM" : "AM"}`;
};
function initialSession() {
  try {
    return JSON.parse(sessionStorage.getItem("bookease-session") || "null");
  } catch {
    return null;
  }
}
function Illustration() {
  return (
    <svg
      className="salon-art"
      viewBox="0 0 520 420"
      role="img"
      aria-label="An original illustration of a calm salon with a styling chair, arch mirror and plants"
    >
      <defs>
        <linearGradient id="wall" x2="0" y2="1">
          <stop stopColor="#e6e3d4" />
          <stop offset="1" stopColor="#d5d9c6" />
        </linearGradient>
        <linearGradient id="mirror" x2="1" y2="1">
          <stop stopColor="#b8c9bc" />
          <stop offset="1" stopColor="#edf0e5" />
        </linearGradient>
      </defs>
      <rect width="520" height="420" rx="12" fill="url(#wall)" />
      <path d="M0 341h520v79H0z" fill="#c1b09a" />
      <path
        d="M0 341h520M65 341 0 420m142-79-30 79m112-79 8 79m77-79 40 79m46-79 85 79"
        stroke="#aa9b87"
        opacity=".5"
      />
      <path d="M176 236V94a75 75 0 0 1 150 0v142z" fill="#8f725d" />
      <path d="M185 229V95a66 66 0 0 1 132 0v134z" fill="url(#mirror)" />
      <path
        d="m201 121 45-71M207 167l82-123m-8 108 25-38"
        stroke="#fff"
        strokeWidth="9"
        opacity=".22"
      />
      <path d="M147 239h209v12H147z" fill="#a58a6e" />
      <path d="M158 252h12v83h-12zm175 0h12v83h-12z" fill="#8e715a" />
      <rect x="168" y="214" width="16" height="24" rx="3" fill="#f5f0df" />
      <path d="M173 208h7v7h-7" fill="#8d9c82" />
      <rect x="301" y="219" width="22" height="19" rx="3" fill="#b4a58c" />
      <path
        d="M312 219v-12m-4 12 1-17m7 17 3-15"
        stroke="#655e4e"
        strokeWidth="3"
      />
      <path d="M206 270v-23q0-10 10-10h65q10 0 10 10v50h-85z" fill="#315a4d" />
      <path d="M200 286h97v37q0 9-10 9h-77q-10 0-10-9z" fill="#315a4d" />
      <path d="M206 291h85" stroke="#638070" strokeWidth="3" />
      <rect x="195" y="263" width="13" height="46" rx="5" fill="#bda27e" />
      <rect x="289" y="263" width="13" height="46" rx="5" fill="#bda27e" />
      <path
        d="M248 332v34m-32 5h64m-61-1-18 9m76-9 18 9"
        stroke="#4c5350"
        strokeWidth="8"
        strokeLinecap="round"
      />
      <path d="M77 335h51l-7 40H84z" fill="#e4d6ba" />
      <path
        d="M103 336v-94m0 44q-38 0-42-28 30-8 42 28m0 27q29-6 35-37-26-4-35 37m0-47q27-9 26-36-25 1-26 36m0-17q-28-8-29-34 27 1 29 34"
        fill="#4f6e54"
        stroke="#65765b"
        strokeWidth="2"
      />
      <rect x="387" y="267" width="66" height="76" rx="4" fill="#a4896c" />
      <path d="M393 289h54m-54 24h54" stroke="#7c6956" />
      <circle cx="421" cy="278" r="2" fill="#f0e4cd" />
      <circle cx="421" cy="302" r="2" fill="#f0e4cd" />
      <path d="M405 267h34l-3-23h-28z" fill="#c5b295" />
      <path
        d="M421 245v-43m0 22q22-4 22-25-18 1-22 25m0-10q-19-4-21-24 18 1 21 24"
        fill="#536e57"
      />
      <path d="M35 78h66v82H35z" fill="#b39d7c" />
      <path d="M40 83h56v72H40z" fill="#ece6d4" />
      <path d="M59 130q-13-31 7-36 25 1 10 29-6 14-11 17" fill="#a3b49b" />
      <path d="m66 139 2-34" stroke="#6e8b72" />
      <path d="M414 0v54" stroke="#7d705e" strokeWidth="3" />
      <path d="M389 59q25-28 50 0v7h-50z" fill="#b69261" />
      <path d="M396 66h36" stroke="#f4db9c" strokeWidth="4" />
    </svg>
  );
}
function Modal({ title, subtitle, onClose, children, wide = false }) {
  const ref = useRef(null);
  useEffect(() => {
    const last = document.activeElement;
    ref.current?.querySelector("button,input")?.focus();
    const key = (e) => {
      if (e.key === "Escape") onClose();
      if (e.key === "Tab") {
        const els = ref.current?.querySelectorAll(
          "button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled])",
        );
        if (!els?.length) return;
        if (e.shiftKey && document.activeElement === els[0]) {
          e.preventDefault();
          els[els.length - 1].focus();
        } else if (
          !e.shiftKey &&
          document.activeElement === els[els.length - 1]
        ) {
          e.preventDefault();
          els[0].focus();
        }
      }
    };
    document.addEventListener("keydown", key);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", key);
      document.body.style.overflow = "";
      last?.focus();
    };
  }, []);
  return (
    <div
      className="modal-backdrop"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <section
        ref={ref}
        className={`modal ${wide ? "modal-wide" : ""}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
      >
        <button
          className="icon-btn modal-close"
          onClick={onClose}
          aria-label="Close dialog"
        >
          <Icon name="close" />
        </button>
        <p className="eyebrow">MAKE ROOM FOR YOU</p>
        <h2 id="modal-title">{title}</h2>
        {subtitle && <p className="muted modal-subtitle">{subtitle}</p>}
        {children}
      </section>
    </div>
  );
}
function App() {
  const [session, setSession] = useState(initialSession),
    [catalog, setCatalog] = useState({ services: [], staff: [] }),
    [health, setHealth] = useState(null),
    [loading, setLoading] = useState(true),
    [loadError, setLoadError] = useState("");
  const [view, setView] = useState("discover"),
    [category, setCategory] = useState("All services"),
    [bookings, setBookings] = useState([]),
    [messages, setMessages] = useState([]),
    [adminServices, setAdminServices] = useState([]);
  const [authOpen, setAuthOpen] = useState(false),
    [authRegister, setAuthRegister] = useState(false),
    [authData, setAuthData] = useState({ name: "", email: "", password: "" }),
    [authError, setAuthError] = useState(""),
    [authBusy, setAuthBusy] = useState(false);
  const [booking, setBooking] = useState(null),
    [pendingService, setPendingService] = useState(null),
    [toast, setToast] = useState(""),
    [actionBusy, setActionBusy] = useState(""),
    [serviceEdit, setServiceEdit] = useState(null),
    [dashboardLoading, setDashboardLoading] = useState(false);
  const user = session?.user;
  async function api(url, options = {}) {
    const res = await fetch(url, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...(session?.token ? { Authorization: `Bearer ${session.token}` } : {}),
        ...options.headers,
      },
    });
    let data;
    try {
      data = await res.json();
    } catch {
      throw new Error(
        "The server did not return a valid response. Please try again.",
      );
    }
    if (!res.ok) throw new Error(data.error || "Something went wrong.");
    return data;
  }
  function notify(message) {
    setToast(message);
  }
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(""), 5500);
    return () => clearTimeout(t);
  }, [toast]);
  async function refreshCatalog() {
    const [c, h] = await Promise.all([api("/api/catalog"), api("/api/health")]);
    setCatalog(c);
    setHealth(h);
  }
  useEffect(() => {
    refreshCatalog()
      .catch((e) => setLoadError(e.message))
      .finally(() => setLoading(false));
  }, []);
  useEffect(() => {
    if (session) {
      api("/api/auth/me").catch(() => {
        setSession(null);
        sessionStorage.removeItem("bookease-session");
        notify("Please sign in again. Your saved session has expired.");
      });
    }
  }, []);
  async function refreshDashboard() {
    if (!user) return;
    setDashboardLoading(true);
    try {
      const [b, o] = await Promise.all([
        api("/api/bookings"),
        api("/api/outbox"),
      ]);
      setBookings(b.bookings);
      setMessages(o.messages);
      if (user.role === "admin")
        setAdminServices((await api("/api/admin/services")).services);
    } catch (e) {
      notify(e.message);
    } finally {
      setDashboardLoading(false);
    }
  }
  useEffect(() => {
    if (user && view !== "discover") refreshDashboard();
  }, [view, user?.id]);
  function saveSession(data) {
    sessionStorage.setItem("bookease-session", JSON.stringify(data));
    setSession(data);
    setAuthOpen(false);
    setAuthError("");
    notify(`Welcome, ${data.user.name.split(" ")[0]}. Good to have you here.`);
    if (pendingService) {
      setBooking({ service: pendingService });
      setPendingService(null);
    }
  }
  async function signIn(e, demo) {
    e?.preventDefault();
    setAuthBusy(true);
    setAuthError("");
    try {
      const data = await api(
        `/api/auth/${authRegister && !demo ? "register" : "login"}`,
        {
          method: "POST",
          body: JSON.stringify(
            demo
              ? { email: `${demo}@bookease.demo`, password: "Demo123!" }
              : authData,
          ),
        },
      );
      saveSession(data);
    } catch (error) {
      setAuthError(error.message);
    } finally {
      setAuthBusy(false);
    }
  }
  function signOut() {
    setSession(null);
    sessionStorage.removeItem("bookease-session");
    setView("discover");
    setBookings([]);
    setMessages([]);
    notify("You have signed out.");
  }
  function chooseService(service) {
    if (!user) {
      setPendingService(service);
      setAuthOpen(true);
    } else setBooking({ service });
  }
  function navigate(next) {
    setView(next);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }
  function showServices() {
    setView("discover");
    setTimeout(
      () =>
        document
          .getElementById("services")
          ?.scrollIntoView({ behavior: "smooth", block: "start" }),
      50,
    );
  }
  async function cancelAppointment(b) {
    if (!window.confirm(`Cancel ${b.serviceName} on ${prettyDate(b.date)}?`))
      return;
    setActionBusy(b.id);
    try {
      await api(`/api/bookings/${b.id}`, {
        method: "PATCH",
        body: JSON.stringify({ action: "cancel" }),
      });
      notify("Appointment cancelled. The time is available again.");
      await refreshDashboard();
    } catch (e) {
      notify(e.message);
    } finally {
      setActionBusy("");
    }
  }
  async function completeAppointment(b) {
    setActionBusy(b.id);
    try {
      await api(`/api/bookings/${b.id}`, {
        method: "PATCH",
        body: JSON.stringify({ action: "complete" }),
      });
      notify("Appointment marked complete.");
      await refreshDashboard();
    } catch (e) {
      notify(e.message);
    } finally {
      setActionBusy("");
    }
  }
  async function runReminders() {
    setActionBusy("reminders");
    try {
      const result = await api("/api/reminders/run", {
        method: "POST",
        body: "{}",
      });
      notify(
        `${result.created} reminder${result.created === 1 ? "" : "s"} added${result.mode === "demo-outbox" ? " to the demo outbox" : ""}.`,
      );
      await refreshDashboard();
    } catch (e) {
      notify(e.message);
    } finally {
      setActionBusy("");
    }
  }
  const categories = [
    "All services",
    ...new Set(catalog.services.map((s) => s.category)),
  ];
  const upcoming = bookings.filter(
    (b) =>
      b.status === "confirmed" &&
      new Date(`${b.date}T${b.time}:00+05:00`) > new Date(),
  );
  const tabs = [
    ["discover", "Discover"],
    [
      "bookings",
      user?.role === "customer" ? "My appointments" : "Appointments",
    ],
    ...(user && user.role !== "customer" ? [["outbox", "Notifications"]] : []),
    ...(user?.role === "admin" ? [["manage", "Manage services"]] : []),
  ];
  return (
    <>
      <div className="announcement">
        <span className="tiny-dot" /> A little less rush. A little more you.{" "}
        <span className="announcement-right">
          A full-stack portfolio demo <span>↗</span>
        </span>
      </div>
      <header className="header">
        <a
          href="#"
          className="brand"
          onClick={(e) => {
            e.preventDefault();
            navigate("discover");
          }}
          aria-label="BookEase home"
        >
          <span className="brand-mark">
            b<span>✳</span>
          </span>
          <span>
            bookease<span className="brand-period">.</span>
          </span>
        </a>
        <nav aria-label="Main navigation">
          {tabs.map(([key, label]) => (
            <button
              key={key}
              className={view === key ? "nav-active" : ""}
              onClick={() => {
                if (!user && key !== "discover") setAuthOpen(true);
                else navigate(key);
              }}
            >
              {label}
              {key === "discover" && <span className="nav-dot" />}
            </button>
          ))}
          <button
            onClick={() => {
              setView("discover");
              setTimeout(
                () =>
                  document
                    .getElementById("our-space")
                    ?.scrollIntoView({ behavior: "smooth" }),
                50,
              );
            }}
          >
            Our space
          </button>
        </nav>
        <div className="header-account">
          {user ? (
            <>
              <button
                className="avatar-button"
                title={`Signed in as ${user.email}`}
                onClick={() => navigate("bookings")}
              >
                <span className="avatar small">
                  {user.name
                    .split(" ")
                    .map((x) => x[0])
                    .slice(0, 2)
                    .join("")}
                </span>
                <span className="account-name">
                  {user.name.split(" ")[0]}
                  <small>{user.role}</small>
                </span>
              </button>
              <button className="text-btn logout" onClick={signOut}>
                Sign out
              </button>
            </>
          ) : (
            <button className="text-btn" onClick={() => setAuthOpen(true)}>
              Sign in <Icon name="user" size={17} />
            </button>
          )}
          <button className="btn btn-dark header-book" onClick={showServices}>
            Book a visit <Icon name="arrow" size={17} />
          </button>
        </div>
      </header>
      {loading ? (
        <main className="loading-state">
          <span className="spinner" />
          <p>Making a little room for you…</p>
        </main>
      ) : loadError ? (
        <main className="loading-state">
          <Icon name="mail" size={32} />
          <h2>We couldn’t load our space.</h2>
          <p>{loadError}</p>
          <button
            className="btn btn-dark"
            onClick={() => window.location.reload()}
          >
            Try again
          </button>
        </main>
      ) : view === "discover" ? (
        <main>
          <section className="hero">
            <div className="hero-copy">
              <div className="hero-badge">
                <span className="tiny-dot" /> YOUR NEIGHBOURHOOD SELF-CARE
                STUDIO
              </div>
              <h1>
                A little time.
                <br />
                <em>All for you.</em>
                <span className="hero-asterisk">✳</span>
              </h1>
              <p>
                Good hair. Clear skin. A quieter mind.
                <br />
                Find your next feel-good moment, and make it yours.
              </p>
              <div className="hero-actions">
                <button
                  className="btn btn-dark btn-large"
                  onClick={showServices}
                >
                  Find your appointment <Icon name="arrow" />
                </button>
                <span className="hero-note">
                  <Icon name="check" size={16} /> No booking fee. Ever.
                </span>
              </div>
              <div className="hero-social">
                <div className="avatar-stack">
                  <span>JL</span>
                  <span>AS</span>
                  <span>RK</span>
                  <span>+</span>
                </div>
                <div>
                  <div className="stars">
                    ★★★★★ <strong>Made for your routine</strong>
                  </div>
                  <small>A thoughtful demo of a modern salon experience</small>
                </div>
              </div>
            </div>
            <div className="hero-visual">
              <div className="image-caption">
                <span>THE BOOKEASE STUDIO</span>
                <span>EST. 2026</span>
              </div>
              <Illustration />
              <div className="floating-note">
                <span className="floating-icon">
                  <Icon name="leaf" size={23} />
                </span>
                <div>
                  Your reset starts here.
                  <small>Come as you are. Leave feeling like you.</small>
                </div>
                <span className="note-star">✳</span>
              </div>
              <div className="hero-image-bottom">
                <span>
                  <span className="tiny-dot" /> A calm space, by appointment.
                </span>
                <span>LAHORE, PAKISTAN</span>
              </div>
            </div>
          </section>
          <div className="benefits">
            <span>
              <Icon name="calendar" /> Your time, your choice
            </span>
            <span>
              <Icon name="shield" /> Easy changes & cancellations
            </span>
            <span>
              <Icon name="sparkles" /> Thoughtful, personal care
            </span>
            <span>
              <Icon name="clock" /> Open daily · 10 AM–7 PM
            </span>
          </div>
          <section className="services-section" id="services">
            <div className="section-top">
              <div>
                <p className="eyebrow">THE GOOD STUFF</p>
                <h2>A little care goes a long way.</h2>
                <p className="muted">
                  Choose what feels right. We’ll take care of the rest.
                </p>
              </div>
              <span className="section-counter">
                <span>01</span> / OUR SERVICES
              </span>
            </div>
            <div
              className="category-tabs"
              role="group"
              aria-label="Filter services"
            >
              {categories.map((c) => (
                <button
                  key={c}
                  className={category === c ? "selected" : ""}
                  onClick={() => setCategory(c)}
                >
                  {c}
                  {c === "All services" && (
                    <span>{catalog.services.length}</span>
                  )}
                </button>
              ))}
            </div>
            <div className="service-cards">
              {catalog.services
                .filter(
                  (s) => category === "All services" || s.category === category,
                )
                .map((service, i) => (
                  <article
                    className={`service-card service-${service.icon}`}
                    key={service.id}
                  >
                    <div className="service-card-top">
                      <span className="service-icon">
                        <Icon name={service.icon} size={27} />
                      </span>
                      {service.id === "signature-cut" ? (
                        <span className="popular">A STUDIO FAVOURITE</span>
                      ) : (
                        <span className="service-index">0{i + 1}</span>
                      )}
                    </div>
                    <p className="service-category">{service.category}</p>
                    <h3>{service.name}</h3>
                    <p className="service-description">{service.description}</p>
                    <div className="service-card-bottom">
                      <div>
                        <strong>{money(service.price)}</strong>
                        <span>
                          <Icon name="clock" size={14} />
                          {service.duration} min
                        </span>
                      </div>
                      <button
                        className="circle-btn"
                        onClick={() => chooseService(service)}
                        aria-label={`Book ${service.name}`}
                      >
                        <Icon name="arrow" size={20} />
                      </button>
                    </div>
                  </article>
                ))}
            </div>
            <p className="service-footnote">
              <Icon name="clock" size={15} /> All appointment times are in
              Asia/Karachi (PKT). Prices are demo amounts in USD.
            </p>
          </section>
          <section className="studio-section" id="our-space">
            <div className="studio-label">
              <span className="big-asterisk">✳</span>
              <p className="eyebrow">GOOD PEOPLE. GOOD ENERGY.</p>
              <h2>
                You’re in
                <br />
                <em>thoughtful hands.</em>
              </h2>
              <p>
                Small details. A warm welcome. Professionals who make time to
                listen, and space to feel at ease.
              </p>
              <span className="studio-hours">
                <span className="tiny-dot" /> EVERY DAY, 10:00–19:00 PKT
              </span>
            </div>
            <div className="team-cards">
              {catalog.staff.map((person, i) => (
                <article className="team-card" key={person.id}>
                  <div
                    className={`portrait portrait-${i}`}
                    style={{ backgroundColor: person.color }}
                  >
                    <svg viewBox="0 0 200 180" aria-hidden="true">
                      <ellipse
                        cx="100"
                        cy="182"
                        rx="62"
                        ry="57"
                        fill={["#31564b", "#92775c", "#72617b"][i]}
                      />
                      <path d="M82 125h36v29H82z" fill="#cda17f" />
                      <ellipse
                        cx="100"
                        cy="85"
                        rx="34"
                        ry="44"
                        fill={["#d7ad8c", "#ba8c69", "#e1b793"][i]}
                      />
                      {i === 0 ? (
                        <>
                          <path
                            d="M64 91C38 20 150 13 139 83l-18-12-20-28-29 34-3 48-9-5Z"
                            fill="#665244"
                          />
                          <path d="M133 76q25 62-7 72l-2-49" fill="#665244" />
                        </>
                      ) : i === 1 ? (
                        <>
                          <path
                            d="M65 79q-8-52 41-46 40-3 28 48l-13-27-49 9Z"
                            fill="#57473a"
                          />
                          <path
                            d="M76 103q24 39 48-2l-9 36H88z"
                            fill="#57473a"
                          />
                        </>
                      ) : (
                        <>
                          <path
                            d="M66 96Q47 29 99 26q54 0 37 94l-11-25-13-44-40 24v53l-10-5Z"
                            fill="#343934"
                          />
                          <path d="M125 72q24 70 1 84l-1-47" fill="#343934" />
                        </>
                      )}
                      <path
                        d="M86 88h4m21 0h4"
                        stroke="#51473e"
                        strokeWidth="3"
                        strokeLinecap="round"
                      />
                      <path
                        d="M93 107q7 5 14-1"
                        fill="none"
                        stroke="#a7705a"
                        strokeWidth="2"
                      />
                    </svg>
                    <span className="portrait-badge">
                      <Icon name="sparkles" size={15} /> A little expertise
                    </span>
                  </div>
                  <h3>{person.name}</h3>
                  <p>{person.title}</p>
                  <button
                    className="text-btn"
                    onClick={() => {
                      setCategory("All services");
                      showServices();
                    }}
                  >
                    Find your service <Icon name="arrow" size={15} />
                  </button>
                </article>
              ))}
            </div>
          </section>
          <section className="bottom-cta">
            <div>
              <p className="eyebrow">PUT YOURSELF ON THE CALENDAR</p>
              <h2>Your next good day starts here.</h2>
            </div>
            <button className="btn btn-cream btn-large" onClick={showServices}>
              Let’s make time <Icon name="arrow" />
            </button>
          </section>
        </main>
      ) : (
        <main className="dashboard">
          <div className="dashboard-heading">
            <div>
              <p className="eyebrow">
                YOUR BOOKEASE SPACE · {user?.role?.toUpperCase()}
              </p>
              <h1>
                {view === "bookings"
                  ? user?.role === "customer"
                    ? "Your time, taken care of."
                    : "A thoughtful day, planned."
                  : view === "outbox"
                    ? "A little heads-up."
                    : "The care on your menu."}
              </h1>
              <p className="muted">
                {view === "bookings"
                  ? "Appointments, little changes, and your next feel-good moment."
                  : view === "outbox"
                    ? "A clear record of confirmations, changes and appointment reminders."
                    : "Add, refine or pause the services your guests can book."}
              </p>
            </div>
            {view === "manage" ? (
              <button
                className="btn btn-dark"
                onClick={() =>
                  setServiceEdit({
                    name: "",
                    category: "Hair & styling",
                    duration: 30,
                    price: 30,
                    description: "",
                    active: true,
                  })
                }
              >
                + Add a service
              </button>
            ) : view === "outbox" ? (
              <button
                className="btn btn-dark"
                disabled={actionBusy === "reminders"}
                onClick={runReminders}
              >
                <Icon name="mail" size={18} />
                {actionBusy === "reminders"
                  ? "Checking…"
                  : "Create next-24h reminders"}
              </button>
            ) : (
              <button className="btn btn-dark" onClick={showServices}>
                Book a little time <Icon name="arrow" size={18} />
              </button>
            )}
          </div>
          {view === "bookings" && (
            <>
              <div className="stats-row">
                <div>
                  <span className="stats-icon">
                    <Icon name="calendar" />
                  </span>
                  <p>
                    Upcoming appointments
                    <strong>
                      {upcoming.length.toString().padStart(2, "0")}
                    </strong>
                  </p>
                  <span className="stats-note">
                    Something to look forward to
                  </span>
                </div>
                <div>
                  <span className="stats-icon warm">
                    <Icon name="check" />
                  </span>
                  <p>
                    Completed visits
                    <strong>
                      {bookings
                        .filter((b) => b.status === "completed")
                        .length.toString()
                        .padStart(2, "0")}
                    </strong>
                  </p>
                  <span className="stats-note">A little care, well spent</span>
                </div>
                <div>
                  <span className="stats-icon lilac">
                    <Icon name="clock" />
                  </span>
                  <p>
                    Your timezone
                    <strong className="zone-value">
                      PKT <small>UTC +05:00</small>
                    </strong>
                  </p>
                  <span className="stats-note">Asia/Karachi</span>
                </div>
              </div>
              <div className="appointments-top">
                <h2>
                  {user?.role === "customer"
                    ? "Your appointments"
                    : "Appointment schedule"}
                </h2>
                <button
                  className="text-btn"
                  onClick={refreshDashboard}
                  disabled={dashboardLoading}
                >
                  {dashboardLoading ? "Refreshing…" : "Refresh schedule"}{" "}
                  <Icon name="calendar" size={16} />
                </button>
              </div>
              {dashboardLoading && bookings.length === 0 ? (
                <p className="empty-state">Loading your appointments…</p>
              ) : bookings.length === 0 ? (
                <div className="empty-state">
                  <span className="empty-icon">
                    <Icon name="calendar" size={32} />
                  </span>
                  <h3>A little space for something good.</h3>
                  <p>
                    Your appointments will appear here once you make a booking.
                  </p>
                  <button className="btn btn-dark" onClick={showServices}>
                    Explore our services <Icon name="arrow" size={17} />
                  </button>
                </div>
              ) : (
                <div className="appointment-list">
                  {bookings.map((b) => (
                    <article
                      key={b.id}
                      className={`appointment-card ${b.status}`}
                    >
                      <div className="appointment-date">
                        <span>
                          {new Date(
                            `${b.date}T12:00:00+05:00`,
                          ).toLocaleDateString("en-US", {
                            month: "short",
                            timeZone: "Asia/Karachi",
                          })}
                        </span>
                        <strong>{b.date.slice(-2)}</strong>
                        <small>
                          {new Date(
                            `${b.date}T12:00:00+05:00`,
                          ).toLocaleDateString("en-US", {
                            weekday: "short",
                            timeZone: "Asia/Karachi",
                          })}
                        </small>
                      </div>
                      <div className="appointment-info">
                        <div className="appointment-title">
                          <h3>{b.serviceName}</h3>
                          <span className={`status status-${b.status}`}>
                            {b.status}
                          </span>
                        </div>
                        <p>
                          <Icon name="user" size={15} /> {b.staffName}{" "}
                          <span>·</span> <Icon name="clock" size={15} />{" "}
                          {prettyTime(b.time)} · {b.duration} min
                        </p>
                        {user?.role !== "customer" && (
                          <p className="customer-name">
                            Guest: {b.customerName}
                          </p>
                        )}
                        {b.notes && <p className="booking-note">“{b.notes}”</p>}
                      </div>
                      <div className="appointment-actions">
                        <strong>{money(b.price)}</strong>
                        {b.status === "confirmed" &&
                          new Date(`${b.date}T${b.time}:00+05:00`) >
                            new Date() && (
                            <>
                              <button
                                className="text-btn"
                                disabled={actionBusy === b.id}
                                onClick={() =>
                                  setBooking({
                                    service: catalog.services.find(
                                      (s) => s.id === b.serviceId,
                                    ) || {
                                      id: b.serviceId,
                                      name: b.serviceName,
                                      price: b.price,
                                      duration: b.duration,
                                    },
                                    existing: b,
                                  })
                                }
                              >
                                Reschedule
                              </button>
                              <button
                                className="text-btn cancel-btn"
                                disabled={actionBusy === b.id}
                                onClick={() => cancelAppointment(b)}
                              >
                                Cancel
                              </button>
                            </>
                          )}
                        {b.status === "confirmed" &&
                          user?.role !== "customer" &&
                          new Date(`${b.date}T${b.time}:00+05:00`).getTime() +
                            b.duration * 60000 <=
                            Date.now() && (
                            <button
                              className="text-btn"
                              disabled={actionBusy === b.id}
                              onClick={() => completeAppointment(b)}
                            >
                              Mark complete
                            </button>
                          )}
                      </div>
                    </article>
                  ))}
                </div>
              )}
              <div className="dashboard-notice">
                <Icon name="mail" />
                <div>
                  <strong>
                    {health?.notifications === "demo-outbox"
                      ? "Notifications are in demo mode."
                      : "Email notifications are configured."}
                  </strong>
                  <p>
                    {health?.notifications === "demo-outbox"
                      ? "Your confirmation is saved to the in-app outbox. No external email is sent."
                      : "Delivery status is recorded in the outbox; check for failed messages."}
                  </p>
                </div>
                <button className="text-btn" onClick={() => navigate("outbox")}>
                  View outbox <Icon name="arrow" size={16} />
                </button>
              </div>
            </>
          )}
          {view === "outbox" && (
            <>
              <div className="notification-banner">
                <Icon name="mail" size={26} />
                <div>
                  <strong>
                    {health?.notifications === "demo-outbox"
                      ? "Demo outbox — no real email is sent"
                      : "SMTP delivery log"}
                  </strong>
                  <p>
                    Reminders are created on demand for the next 24 hours. An
                    external scheduler is needed for automatic reminders.
                  </p>
                </div>
              </div>
              {dashboardLoading ? (
                <p className="empty-state">Loading messages…</p>
              ) : messages.length === 0 ? (
                <div className="empty-state">
                  <Icon name="mail" size={36} />
                  <h3>No messages just yet.</h3>
                  <p>
                    Book, change or cancel an appointment to see the
                    notification record.
                  </p>
                </div>
              ) : (
                <div className="message-list">
                  {messages.map((m) => (
                    <article className="message-card" key={m.id}>
                      <span className="message-icon">
                        <Icon name="mail" />
                      </span>
                      <div>
                        <div className="message-heading">
                          <h3>{m.subject}</h3>
                          <span className={`status status-${m.status}`}>
                            {m.status === "demo" ? "demo · not sent" : m.status}
                          </span>
                        </div>
                        <p className="muted">
                          To: {m.to} ·{" "}
                          {new Date(m.createdAt).toLocaleString("en-US", {
                            timeZone: "Asia/Karachi",
                          })}{" "}
                          PKT
                        </p>
                        <pre>{m.text}</pre>
                        {m.error && <p className="form-error">{m.error}</p>}
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </>
          )}
          {view === "manage" && (
            <div className="manage-list">
              {adminServices.map((s) => (
                <article className="manage-card" key={s.id}>
                  <span className="service-icon">
                    <Icon name={s.icon} />
                  </span>
                  <div>
                    <h3>{s.name}</h3>
                    <p>
                      {s.category} · {s.duration} min · {money(s.price)}
                    </p>
                  </div>
                  <span
                    className={`status ${s.active ? "status-confirmed" : "status-cancelled"}`}
                  >
                    {s.active ? "Bookable" : "Paused"}
                  </span>
                  <button
                    className="btn btn-outline"
                    onClick={() => setServiceEdit(s)}
                  >
                    Edit service <Icon name="settings" size={16} />
                  </button>
                </article>
              ))}
            </div>
          )}
        </main>
      )}
      <footer>
        <div className="footer-brand">
          <a
            href="#"
            className="brand"
            onClick={(e) => {
              e.preventDefault();
              navigate("discover");
            }}
          >
            <span className="brand-mark">
              b<span>✳</span>
            </span>
            <span>bookease.</span>
          </a>
          <p>Make a little time for you.</p>
        </div>
        <div className="footer-meta">
          <span>Personal portfolio demo · MERN stack</span>
          <span>
            File/MongoDB storage ·{" "}
            {health?.storage === "mongodb"
              ? "MongoDB connected"
              : "Local demo storage"}{" "}
            · No booking fee
          </span>
        </div>
        <span className="footer-sign">A little care, by design. © 2026</span>
      </footer>
      {toast && (
        <div className="toast" role="status">
          <span className="toast-icon">
            <Icon name="check" size={17} />
          </span>
          <span>{toast}</span>
          <button
            onClick={() => setToast("")}
            aria-label="Dismiss notification"
          >
            <Icon name="close" size={16} />
          </button>
        </div>
      )}
      {authOpen && (
        <Modal
          title={authRegister ? "Make yourself at home." : "Welcome back."}
          subtitle={
            authRegister
              ? "A little space of your own. Create an account to book a visit."
              : "Sign in to book, reschedule and keep track of your visits."
          }
          onClose={() => {
            if (!authBusy) {
              setAuthOpen(false);
              setPendingService(null);
            }
          }}
        >
          <form onSubmit={signIn} className="form">
            {authRegister && (
              <label>
                Your name
                <input
                  required
                  minLength="2"
                  maxLength="80"
                  value={authData.name}
                  onChange={(e) =>
                    setAuthData({ ...authData, name: e.target.value })
                  }
                  placeholder="Alex Morgan"
                  autoComplete="name"
                />
              </label>
            )}
            <label>
              Email address
              <input
                type="email"
                required
                value={authData.email}
                onChange={(e) =>
                  setAuthData({ ...authData, email: e.target.value })
                }
                placeholder="you@example.com"
                autoComplete="email"
              />
            </label>
            <label>
              Password
              <input
                type="password"
                required
                minLength={authRegister ? 8 : 1}
                maxLength="100"
                value={authData.password}
                onChange={(e) =>
                  setAuthData({ ...authData, password: e.target.value })
                }
                placeholder={
                  authRegister ? "At least 8 characters" : "Your password"
                }
                autoComplete={
                  authRegister ? "new-password" : "current-password"
                }
              />
            </label>
            {authError && (
              <p className="form-error" role="alert">
                {authError}
              </p>
            )}
            <button className="btn btn-dark btn-full" disabled={authBusy}>
              {authBusy
                ? "One moment…"
                : authRegister
                  ? "Create your account"
                  : "Sign in"}
              <Icon name="arrow" size={18} />
            </button>
          </form>
          <p className="auth-toggle">
            {authRegister ? "Already part of the studio?" : "New around here?"}{" "}
            <button
              onClick={() => {
                setAuthRegister(!authRegister);
                setAuthError("");
              }}
            >
              {authRegister ? "Sign in" : "Create an account"}
            </button>
          </p>
          {health?.demoAccounts && (
            <div className="demo-signin">
              <p>JUST EXPLORING? TRY A DEMO ACCOUNT</p>
              <div>
                {["customer", "staff", "admin"].map((role) => (
                  <button
                    key={role}
                    disabled={authBusy}
                    onClick={() => signIn(null, role)}
                  >
                    {role === "customer"
                      ? "Guest"
                      : role === "staff"
                        ? "Team member"
                        : "Admin"}
                    <Icon name="arrow" size={14} />
                  </button>
                ))}
              </div>
              <small>Seeded demo accounts · Password: Demo123!</small>
            </div>
          )}
        </Modal>
      )}
      {booking && (
        <BookingModal
          booking={booking}
          staff={catalog.staff}
          user={user}
          api={api}
          onClose={() => setBooking(null)}
          onSaved={async () => {
            setBooking(null);
            notify(
              booking.existing
                ? "A little change, all sorted. Your appointment is rescheduled."
                : "You’re on the calendar. Your appointment is confirmed.",
            );
            navigate("bookings");
            await refreshDashboard();
          }}
        />
      )}
      {serviceEdit && (
        <ServiceModal
          service={serviceEdit}
          api={api}
          onClose={() => setServiceEdit(null)}
          onSaved={async () => {
            setServiceEdit(null);
            await refreshCatalog();
            await refreshDashboard();
            notify("Service saved. Your menu is up to date.");
          }}
        />
      )}
    </>
  );
}
function BookingModal({ booking, staff, user, api, onClose, onSaved }) {
  const { service, existing } = booking;
  const staffChoices =
    user.role === "staff" && existing
      ? staff.filter((s) => s.id === existing.staffId)
      : staff;
  const [form, setForm] = useState({
      staffId: existing?.staffId || staffChoices[0]?.id || "",
      date: existing?.date || addDays(1),
      time: "",
      notes: "",
    }),
    [available, setAvailable] = useState([]),
    [loading, setLoading] = useState(false),
    [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  useEffect(() => {
    let active = true;
    setLoading(true);
    setForm((f) => ({ ...f, time: "" }));
    setError("");
    api(
      `/api/availability?serviceId=${encodeURIComponent(service.id)}&staffId=${encodeURIComponent(form.staffId)}&date=${encodeURIComponent(form.date)}`,
    )
      .then((d) => {
        if (active) setAvailable(d.slots);
      })
      .catch((e) => {
        if (active) {
          setError(e.message);
          setAvailable([]);
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [form.staffId, form.date, service.id]);
  async function submit(e) {
    e.preventDefault();
    if (!form.time) {
      setError("Choose a time that works for you.");
      return;
    }
    setBusy(true);
    setError("");
    try {
      await api(existing ? `/api/bookings/${existing.id}` : "/api/bookings", {
        method: existing ? "PATCH" : "POST",
        body: JSON.stringify({
          ...form,
          serviceId: service.id,
          ...(existing ? { action: "reschedule" } : {}),
        }),
      });
      await onSaved();
    } catch (e) {
      setError(e.message);
      try {
        const d = await api(
          `/api/availability?serviceId=${service.id}&staffId=${form.staffId}&date=${form.date}`,
        );
        setAvailable(d.slots);
        setForm((f) => ({ ...f, time: "" }));
      } catch {}
    } finally {
      setBusy(false);
    }
  }
  return (
    <Modal
      wide
      title={
        existing ? "A little change of plans." : "Let’s make time for you."
      }
      subtitle="Choose your professional, pick a moment, and leave the rest to us."
      onClose={() => !busy && onClose()}
    >
      <form onSubmit={submit}>
        <div className="booking-layout">
          <aside className="booking-summary">
            <span className="service-icon">
              <Icon name={service.icon} size={30} />
            </span>
            <span className="eyebrow">YOUR MOMENT</span>
            <h3>{service.name}</h3>
            <p>{service.description || "A little care, tailored to you."}</p>
            <div className="summary-line">
              <span>Time for you</span>
              <strong>{service.duration} minutes</strong>
            </div>
            <div className="summary-line">
              <span>Service price</span>
              <strong>{money(service.price)}</strong>
            </div>
            <div className="summary-line">
              <span>Booking fee</span>
              <strong>On us</strong>
            </div>
            <div className="summary-total">
              <span>Total</span>
              <strong>{money(service.price)}</strong>
            </div>
            <p className="summary-note">
              <Icon name="shield" size={17} /> Pay at the studio. This demo does
              not collect payment.
            </p>
          </aside>
          <div className="booking-fields">
            <label className="step-label">
              <span>01</span> Who’s taking care of you?
            </label>
            <div className="staff-options">
              {staffChoices.map((s) => (
                <button
                  type="button"
                  className={form.staffId === s.id ? "selected" : ""}
                  key={s.id}
                  onClick={() => setForm({ ...form, staffId: s.id })}
                >
                  <span className="avatar" style={{ background: s.color }}>
                    {s.initials}
                  </span>
                  <span>{s.name.split(" ")[0]}</span>
                  {form.staffId === s.id && (
                    <span className="staff-check">
                      <Icon name="check" size={11} />
                    </span>
                  )}
                </button>
              ))}
            </div>
            <label className="step-label" htmlFor="booking-date">
              <span>02</span> A day that works for you
            </label>
            <input
              id="booking-date"
              type="date"
              required
              min={localDate()}
              max={addDays(180)}
              value={form.date}
              onChange={(e) => setForm({ ...form, date: e.target.value })}
            />
            <label className="step-label">
              <span>03</span> Your little window of time <small>PKT</small>
            </label>
            {loading ? (
              <div className="slot-loading">
                <span className="spinner" /> Finding a little space…
              </div>
            ) : available.length ? (
              <div
                className="time-slots"
                role="group"
                aria-label="Available appointment times"
              >
                {available.map((t) => (
                  <button
                    type="button"
                    key={t}
                    className={form.time === t ? "selected" : ""}
                    onClick={() => setForm({ ...form, time: t })}
                  >
                    {prettyTime(t)}
                  </button>
                ))}
              </div>
            ) : (
              <div className="no-slots">
                <Icon name="calendar" size={24} />
                <span>
                  No spaces left on this day. Try another day or professional.
                </span>
              </div>
            )}
            {!existing && (
              <label className="notes-label">
                Anything we should know? <span>(optional)</span>
                <textarea
                  maxLength="500"
                  rows="2"
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  placeholder="A preference, a question, a little detail…"
                />
              </label>
            )}
          </div>
        </div>
        {error && (
          <p className="form-error" role="alert">
            {error}
          </p>
        )}
        <div className="booking-modal-footer">
          <p>
            <Icon name="clock" size={16} />{" "}
            {form.time
              ? `${prettyDate(form.date)} · ${prettyTime(form.time)} PKT`
              : "All times are in Asia/Karachi (PKT)"}
          </p>
          <button
            className="btn btn-dark"
            disabled={busy || loading || !form.time}
          >
            {busy
              ? "Saving your moment…"
              : existing
                ? "Confirm new time"
                : "Confirm appointment"}
            <Icon name="arrow" size={18} />
          </button>
        </div>
      </form>
    </Modal>
  );
}
function ServiceModal({ service, api, onClose, onSaved }) {
  const [form, setForm] = useState({ ...service }),
    [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      await api(
        service.id
          ? `/api/admin/services/${service.id}`
          : "/api/admin/services",
        { method: service.id ? "PATCH" : "POST", body: JSON.stringify(form) },
      );
      await onSaved();
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <Modal
      title={
        service.id ? "Refine a little detail." : "Something new for the menu."
      }
      onClose={() => !busy && onClose()}
    >
      <form className="form" onSubmit={submit}>
        <label>
          Service name
          <input
            required
            minLength="3"
            maxLength="80"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
          />
        </label>
        <label>
          Category
          <input
            required
            minLength="2"
            maxLength="50"
            value={form.category}
            onChange={(e) => setForm({ ...form, category: e.target.value })}
          />
        </label>
        <div className="form-row">
          <label>
            Duration (minutes)
            <input
              type="number"
              required
              min="15"
              max="180"
              step="15"
              value={form.duration}
              onChange={(e) => setForm({ ...form, duration: e.target.value })}
            />
          </label>
          <label>
            Price (USD)
            <input
              type="number"
              required
              min="0"
              max="10000"
              step="0.01"
              value={form.price}
              onChange={(e) => setForm({ ...form, price: e.target.value })}
            />
          </label>
        </div>
        <label>
          Description
          <textarea
            required
            minLength="10"
            maxLength="300"
            rows="3"
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
          />
        </label>
        <label className="checkbox-label">
          <input
            type="checkbox"
            checked={form.active}
            onChange={(e) => setForm({ ...form, active: e.target.checked })}
          />{" "}
          Available for new bookings
        </label>
        {error && (
          <p className="form-error" role="alert">
            {error}
          </p>
        )}
        <button className="btn btn-dark btn-full" disabled={busy}>
          {busy ? "Saving…" : "Save service"}
          <Icon name="check" size={18} />
        </button>
      </form>
    </Modal>
  );
}
createRoot(document.getElementById("root")).render(<App />);
