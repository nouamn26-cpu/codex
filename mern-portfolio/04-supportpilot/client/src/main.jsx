import React, { useEffect, useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import "./styles.css";

const KEY = "supportpilot-session";
async function api(route, options = {}) {
  const token = localStorage.getItem(KEY);
  const form = options.body instanceof FormData;
  const response = await fetch(`/api${route}`, {
    ...options,
    headers: {
      ...(form ? {} : { "Content-Type": "application/json" }),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
    body: options.body && !form ? JSON.stringify(options.body) : options.body,
  });
  const payload = await response
    .json()
    .catch(() => ({ error: "The server could not be reached." }));
  if (!response.ok) throw new Error(payload.error || "Please try again.");
  return payload;
}
const paths = {
  star: "m12 2 3 7 7 3-7 3-3 7-3-7-7-3 7-3Z",
  dashboard: "M3 3h7v7H3zM14 3h7v7h-7zM3 14h7v7H3zM14 14h7v7h-7z",
  book: "M12 5c-3-2-6-2-9-1v15c3-1 6-1 9 1m0-15c3-2 6-2 9-1v15c-3-1-6-1-9 1V5",
  inbox: "M4 4h16v16H4zM4 14h5l1 3h4l1-3h5",
  chat: "M21 11a8 8 0 0 1-8 8H7l-4 3V7a4 4 0 0 1 4-4h6a8 8 0 0 1 8 8ZM7 8h9M7 12h6",
  arrow: "M5 12h14m-6-6 6 6-6 6",
  plus: "M12 5v14M5 12h14",
  search: "m21 21-5-5M18 10a8 8 0 1 1-16 0 8 8 0 0 1 16 0",
  chevron: "m9 5 7 7-7 7",
  upload: "M12 16V3m-5 5 5-5 5 5M4 16v5h16v-5",
  check: "m5 12 4 4L19 6",
  close: "m6 6 12 12M6 18 18 6",
  send: "m22 2-7 20-4-9-9-4L22 2Zm0 0L11 13",
  logout: "M9 4H4v16h5m6-13 5 5-5 5M9 12h11",
  edit: "m16 3 5 5L9 20H3v-6L16 3Z",
  trash: "M3 6h18M9 6V3h6v3M5 6l1 15h12l1-15M10 10v7M14 10v7",
  clock: "M12 8v5l3 2M22 12a10 10 0 1 1-20 0 10 10 0 0 1 20 0",
  external: "M14 3h7v7m0-7L10 14M10 3H3v18h18v-7",
  shield: "m12 2 8 3v7c0 5-8 10-8 10S4 17 4 12V5l8-3Zm-4 10 3 3 5-6",
  copy: "M9 9h12v12H9zM4 15H3V3h12v1",
};
function Icon({ name = "star", size = 20, ...props }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    >
      <path d={paths[name] || paths.star} />
    </svg>
  );
}
function Brand() {
  return (
    <div className="brand">
      <span className="brand-mark">
        <Icon name="star" size={23} />
      </span>
      supportpilot<span className="brand-period">.</span>
    </div>
  );
}
function Tag({ children, status = "" }) {
  return <span className={`tag ${status}`}>{children}</span>;
}
function Button({ children, secondary = false, className = "", ...props }) {
  return (
    <button
      className={`button ${secondary ? "secondary" : ""} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
function Empty({ title, children }) {
  return (
    <div className="empty">
      <span className="empty-icon">
        <Icon name="chat" size={27} />
      </span>
      <h3>{title}</h3>
      <p>{children}</p>
    </div>
  );
}
const date = (value) =>
  new Date(value).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
const initials = (value) =>
  value
    .split(" ")
    .map((word) => word[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

function Auth({ onLogin }) {
  const [mode, setMode] = useState("login"),
    [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  async function submit(event, demoEmail) {
    event?.preventDefault();
    setError("");
    setBusy(true);
    try {
      const fields = event
        ? Object.fromEntries(new FormData(event.currentTarget))
        : { email: demoEmail, password: "Demo123!" };
      const result = await api(`/auth/${demoEmail ? "login" : mode}`, {
        method: "POST",
        body: fields,
      });
      localStorage.setItem(KEY, result.token);
      onLogin(result);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="auth-page">
      <section className="auth-story">
        <Brand />
        <div className="story-content">
          <span className="eyebrow">
            A LITTLE CLARITY. A LOT LESS BUSYWORK.
          </span>
          <h1>
            Good support.
            <br />
            Great conversations.
          </h1>
          <p>
            Bring your knowledge and your people together. Make every customer
            feel heard.
          </p>
          <div className="story-preview">
            <div className="preview-header">
              <span className="mini-orb">
                <Icon name="star" />
              </span>
              <div>
                <strong>Acme support</strong>
                <small>
                  <i /> Here to help
                </small>
              </div>
              <Tag status="purple">Knowledge-powered</Tag>
            </div>
            <div className="preview-question">How long does shipping take?</div>
            <div className="preview-answer">
              Standard shipping takes 3–5 business days. You'll receive a
              tracking link as soon as your order ships.
              <span>
                <Icon name="book" size={14} /> Shipping & delivery
              </span>
            </div>
            <div className="preview-footer">
              <Icon name="check" size={15} /> Clear answers, backed by your
              knowledge.
            </div>
          </div>
        </div>
        <div className="story-bottom">
          <Icon name="shield" size={16} /> A personal MERN portfolio demo{" "}
          <span>Built for calmer work.</span>
        </div>
      </section>
      <section className="auth-form-side">
        <div className="auth-inner">
          <span className="mobile-brand">
            <Brand />
          </span>
          <div className="auth-tabs">
            <button
              className={mode === "login" ? "active" : ""}
              onClick={() => {
                setMode("login");
                setError("");
              }}
            >
              Sign in
            </button>
            <button
              className={mode === "register" ? "active" : ""}
              onClick={() => {
                setMode("register");
                setError("");
              }}
            >
              Create workspace
            </button>
            <button
              className={mode === "join" ? "active" : ""}
              onClick={() => {
                setMode("join");
                setError("");
              }}
            >
              Join support
            </button>
          </div>
          <h2>
            {mode === "login"
              ? "Welcome back."
              : mode === "register"
                ? "Make room for better support."
                : "Your questions, answered."}
          </h2>
          <p className="muted">
            {mode === "login"
              ? "Your next great customer conversation starts here."
              : mode === "register"
                ? "Start a private workspace for your business."
                : "Join a business workspace as a customer."}
          </p>
          <form onSubmit={submit} key={mode}>
            {mode !== "login" && (
              <label>
                Your name
                <input
                  name="name"
                  required
                  minLength={2}
                  maxLength={80}
                  autoComplete="name"
                  placeholder="Alex Morgan"
                />
              </label>
            )}
            {mode === "register" && (
              <label>
                Workspace name
                <input
                  name="workspaceName"
                  required
                  minLength={2}
                  maxLength={80}
                  placeholder="Your company"
                />
              </label>
            )}
            {mode === "join" && (
              <label>
                Workspace code
                <input
                  name="workspaceSlug"
                  required
                  placeholder="acme-studio"
                />
                <small>Get this code from the business.</small>
              </label>
            )}
            <label>
              Email address
              <input
                type="email"
                name="email"
                autoComplete="email"
                required
                placeholder="you@company.com"
                maxLength={160}
              />
            </label>
            <label>
              Password
              <input
                type="password"
                name="password"
                autoComplete={
                  mode === "login" ? "current-password" : "new-password"
                }
                required
                minLength={mode === "login" ? 1 : 8}
                maxLength={128}
                placeholder={
                  mode === "login"
                    ? "Enter your password"
                    : "At least 8 characters"
                }
              />
            </label>
            {error && (
              <div className="form-error" role="alert">
                {error}
              </div>
            )}
            <Button disabled={busy} className="full">
              {busy
                ? "One moment…"
                : mode === "login"
                  ? "Sign in to your workspace"
                  : mode === "register"
                    ? "Create workspace"
                    : "Join workspace"}
              <Icon name="arrow" size={18} />
            </Button>
          </form>
          <div className="demo-divider">
            <span>or explore the seeded demo</span>
          </div>
          <div className="demo-buttons">
            <button
              disabled={busy}
              onClick={() => submit(null, "owner@supportpilot.demo")}
            >
              <span className="avatar lavender">AM</span>
              <div>
                <strong>Workspace admin</strong>
                <small>Knowledge & helpdesk</small>
              </div>
              <Icon name="arrow" size={17} />
            </button>
            <button
              disabled={busy}
              onClick={() => submit(null, "customer@supportpilot.demo")}
            >
              <span className="avatar mint">JC</span>
              <div>
                <strong>Customer</strong>
                <small>Chat & support requests</small>
              </div>
              <Icon name="arrow" size={17} />
            </button>
          </div>
          <p className="auth-note">
            Shared demo accounts · Password: <code>Demo123!</code>
            <br />
            Use sample information when exploring.
          </p>
        </div>
      </section>
    </div>
  );
}

function App() {
  const [session, setSession] = useState(null),
    [booting, setBooting] = useState(Boolean(localStorage.getItem(KEY))),
    [tab, setTab] = useState("overview");
  const [articles, setArticles] = useState([]),
    [tickets, setTickets] = useState([]),
    [conversations, setConversations] = useState([]),
    [dashboard, setDashboard] = useState(null);
  const [notice, setNotice] = useState(""),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false),
    [loading, setLoading] = useState(false);
  const [editor, setEditor] = useState(null),
    [readArticle, setReadArticle] = useState(null),
    [activeChat, setActiveChat] = useState(null),
    [ticketId, setTicketId] = useState(null),
    [query, setQuery] = useState("");
  const uploadRef = useRef(),
    chatEnd = useRef();
  const admin = session?.user.role === "admin";
  async function load(current = session) {
    if (!current) return;
    setLoading(true);
    try {
      const [a, t, c, d] = await Promise.all([
        api("/articles"),
        api("/tickets"),
        api("/conversations"),
        current.user.role === "admin"
          ? api("/dashboard")
          : Promise.resolve(null),
      ]);
      setArticles(a);
      setTickets(t);
      setConversations(c);
      setDashboard(d);
    } finally {
      setLoading(false);
    }
  }
  async function signedIn(value) {
    setSession(value);
    setTab(value.user.role === "admin" ? "overview" : "assistant");
    try {
      await load(value);
      const meta = await api("/me");
      setSession((current) => ({ ...current, ...meta }));
    } catch (err) {
      setError(err.message);
    }
  }
  useEffect(() => {
    if (!localStorage.getItem(KEY)) return;
    api("/me")
      .then(signedIn)
      .catch(() => localStorage.removeItem(KEY))
      .finally(() => setBooting(false));
  }, []);
  useEffect(() => {
    chatEnd.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }, [activeChat?.messages?.length]);
  useEffect(() => {
    if (!notice) return;
    const timeout = setTimeout(() => setNotice(""), 5500);
    return () => clearTimeout(timeout);
  }, [notice]);
  async function run(action, success = "") {
    setError("");
    setBusy(true);
    try {
      await action();
      if (success) setNotice(success);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }
  const navigate = (value) => {
    setTab(value);
    setError("");
    setQuery("");
  };
  const logout = () => {
    localStorage.removeItem(KEY);
    setSession(null);
    setActiveChat(null);
    setEditor(null);
    setTickets([]);
    setArticles([]);
    setDashboard(null);
    setError("");
    setNotice("");
  };
  const saveArticle = async (event) => {
    event.preventDefault();
    const fields = Object.fromEntries(new FormData(event.currentTarget));
    await run(async () => {
      await api(editor.id ? `/articles/${editor.id}` : "/articles", {
        method: editor.id ? "PATCH" : "POST",
        body: fields,
      });
      setEditor(null);
      await load();
    }, "Knowledge saved. Your assistant can use it right away.");
  };
  async function uploadFile(event) {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!/\.(md|txt)$/i.test(file.name) || file.size > 65536) {
      setError("Choose a .txt or .md file up to 64 KB.");
      event.target.value = "";
      return;
    }
    await run(async () => {
      const form = new FormData();
      form.append("file", file);
      await api("/articles/upload", { method: "POST", body: form });
      await load();
    }, "File imported into your knowledge base.");
    event.target.value = "";
  }
  async function sendMessage(event, suggestion) {
    event?.preventDefault();
    const content =
      suggestion || new FormData(event.currentTarget).get("content");
    const form = event?.currentTarget;
    await run(async () => {
      let chat = activeChat;
      if (!chat) {
        chat = await api("/conversations", { method: "POST", body: {} });
        setActiveChat(chat);
      }
      const updated = await api(`/conversations/${chat.id}/messages`, {
        method: "POST",
        body: { content },
      });
      setActiveChat(updated);
      form?.reset();
      await load();
    });
  }
  const openChat = async (item) =>
    run(async () => {
      setActiveChat(await api(`/conversations/${item.id}`));
      navigate("assistant");
    });
  async function handoff() {
    await run(async () => {
      let chat = activeChat;
      if (!chat) {
        chat = await api("/conversations", { method: "POST", body: {} });
        setActiveChat(chat);
      }
      const ticket = await api(`/conversations/${chat.id}/handoff`, {
        method: "POST",
        body: {},
      });
      setTicketId(ticket.id);
      await load();
      navigate("inbox");
    }, "Your request is in the support inbox. Replies appear here.");
  }
  const activeTicket =
    tickets.find((ticket) => ticket.id === ticketId) || tickets[0];
  const filteredArticles = articles.filter((article) =>
    `${article.title} ${article.category} ${article.content}`
      .toLowerCase()
      .includes(query.toLowerCase()),
  );
  const ownChat = !activeChat || activeChat.userId === session?.user.id;
  if (booting)
    return (
      <div className="boot">
        <Brand />
        <p>Opening your workspace…</p>
      </div>
    );
  if (!session) return <Auth onLogin={signedIn} />;
  const stats = dashboard?.stats;
  const navItems = admin
    ? [
        ["overview", "dashboard", "Overview"],
        ["knowledge", "book", "Knowledge base"],
        ["inbox", "inbox", "Support inbox"],
        ["conversations", "chat", "Conversations"],
        ["assistant", "star", "Test assistant"],
      ]
    : [
        ["assistant", "star", "Your assistant"],
        ["inbox", "inbox", "My requests"],
        ["knowledge", "book", "Help articles"],
      ];
  return (
    <div className="app">
      <aside className="sidebar">
        <Brand />
        <div className="workspace">
          <span className="workspace-avatar">
            {session.workspace.name.slice(0, 1)}
          </span>
          <div>
            <strong>{session.workspace.name}</strong>
            <small>{admin ? "Admin workspace" : "Customer support"}</small>
          </div>
          <Icon name="chevron" size={15} />
        </div>
        <p className="nav-label">WORKSPACE</p>
        <nav>
          {navItems.map(([key, icon, label]) => (
            <button
              key={key}
              className={tab === key ? "active" : ""}
              onClick={() => navigate(key)}
            >
              <Icon name={icon} size={19} />
              <span>{label}</span>
              {key === "inbox" &&
                tickets.filter((t) => t.status !== "closed").length > 0 && (
                  <b>{tickets.filter((t) => t.status !== "closed").length}</b>
                )}
            </button>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <div className="engine-status">
            <i />
            <div>
              <strong>
                {session.assistant?.startsWith("OpenAI")
                  ? "AI connected"
                  : "Local knowledge search"}
              </strong>
              <small>
                {session.assistant?.startsWith("OpenAI")
                  ? "Grounded in your knowledge"
                  : "Free · No external API calls"}
              </small>
            </div>
          </div>
          <div className="sidebar-user">
            <span className="avatar lavender">
              {initials(session.user.name)}
            </span>
            <div>
              <strong>{session.user.name}</strong>
              <small>
                {session.user.role === "admin" ? "Workspace admin" : "Customer"}
              </small>
            </div>
            <button
              className="icon-button"
              title="Sign out"
              aria-label="Sign out"
              onClick={logout}
            >
              <Icon name="logout" size={18} />
            </button>
          </div>
        </div>
      </aside>
      <div className="main-shell">
        <header className="topbar">
          <div className="breadcrumb">
            Workspace <Icon name="chevron" size={13} />{" "}
            <strong>{navItems.find(([key]) => key === tab)?.[2]}</strong>
          </div>
          <div className="topbar-right">
            <span className="demo-pill">
              <span />
              Portfolio demo
            </span>
            <span className="top-date">
              {new Date().toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
                year: "numeric",
              })}
            </span>
            <span className="avatar lavender small">
              {initials(session.user.name)}
            </span>
          </div>
        </header>
        <main>
          <div className="mobile-section-name">
            {navItems.find(([key]) => key === tab)?.[2]}
          </div>
          {error && (
            <div className="alert error" role="alert">
              <span>{error}</span>
              <button aria-label="Dismiss error" onClick={() => setError("")}>
                <Icon name="close" size={16} />
              </button>
            </div>
          )}
          {notice && (
            <div className="alert success" role="status">
              <Icon name="check" size={17} />
              <span>{notice}</span>
              <button
                aria-label="Dismiss message"
                onClick={() => setNotice("")}
              >
                <Icon name="close" size={16} />
              </button>
            </div>
          )}
          {loading && !busy && (
            <div className="loading-line" aria-label="Loading workspace" />
          )}
          {tab === "overview" && (
            <>
              <div className="page-heading">
                <div>
                  <span className="eyebrow">WORKSPACE OVERVIEW</span>
                  <h1>
                    Your support, in flow<span>.</span>
                  </h1>
                  <p>
                    Less back and forth. More happy customers. Here's where
                    things stand.
                  </p>
                </div>
                <Button secondary onClick={() => navigate("assistant")}>
                  <Icon name="star" size={17} />
                  Test assistant
                </Button>
              </div>
              <div className="invite-strip">
                <div>
                  <Icon name="chat" size={16} />
                  <span>
                    Invite customers with your workspace code:{" "}
                    <code>{session.workspace.slug}</code>
                  </span>
                </div>
                <button
                  className="text-button"
                  onClick={() =>
                    run(async () => {
                      await navigator.clipboard.writeText(
                        session.workspace.slug,
                      );
                    }, "Workspace code copied. Customers can use Join support on the sign-in page.")
                  }
                >
                  <Icon name="copy" size={13} />
                  Copy code
                </button>
              </div>
              <div className="stats-row">
                {[
                  [
                    "Conversations",
                    stats?.conversations ?? 0,
                    "chat",
                    "Every conversation matters",
                    "purple",
                  ],
                  [
                    "Grounded answers",
                    stats?.groundedAnswers ?? 0,
                    "star",
                    "Backed by your knowledge",
                    "mint",
                  ],
                  [
                    "Open requests",
                    stats?.openTickets ?? 0,
                    "inbox",
                    "A little human help needed",
                    "peach",
                  ],
                  [
                    "Knowledge articles",
                    stats?.articles ?? 0,
                    "book",
                    "Your source of good answers",
                    "blue",
                  ],
                ].map(([label, value, icon, note, color]) => (
                  <div className="stat" key={label}>
                    <div className="stat-top">
                      <span>{label}</span>
                      <span className={`stat-icon ${color}`}>
                        <Icon name={icon} size={19} />
                      </span>
                    </div>
                    <strong>{value}</strong>
                    <small>{note}</small>
                  </div>
                ))}
              </div>
              <div className="overview-columns">
                <section className="panel recent-panel">
                  <div className="panel-heading">
                    <div>
                      <h2>Needs a human touch</h2>
                      <p>Recent requests from your customers.</p>
                    </div>
                    <button
                      className="text-button"
                      onClick={() => navigate("inbox")}
                    >
                      View inbox <Icon name="arrow" size={15} />
                    </button>
                  </div>
                  {dashboard?.recentTickets.length ? (
                    <div className="ticket-table">
                      <div className="table-head">
                        <span>CONVERSATION</span>
                        <span>STATUS</span>
                        <span>UPDATED</span>
                      </div>
                      {dashboard.recentTickets.map((ticket) => (
                        <button
                          className="table-row"
                          key={ticket.id}
                          onClick={() => {
                            setTicketId(ticket.id);
                            navigate("inbox");
                          }}
                        >
                          <div>
                            <span className="avatar mint">
                              {initials(
                                ticket.replies[0]?.author || "Customer",
                              )}
                            </span>
                            <span>
                              <strong>{ticket.subject}</strong>
                              <small>
                                {ticket.replies[0]?.author || "Customer"}
                              </small>
                            </span>
                          </div>
                          <Tag status={ticket.status}>
                            {ticket.status.replace("-", " ")}
                          </Tag>
                          <small>{date(ticket.updatedAt)}</small>
                          <Icon name="chevron" size={15} />
                        </button>
                      ))}
                    </div>
                  ) : (
                    <Empty title="You're all caught up">
                      Requests from your customers will appear here.
                    </Empty>
                  )}
                </section>
                <section className="panel answer-panel">
                  <div className="panel-heading">
                    <div>
                      <h2>Answers with a source</h2>
                      <p>Knowledge your customers can trust.</p>
                    </div>
                    <span className="dot-menu">•••</span>
                  </div>
                  <div className="answer-ring">
                    <Icon name="book" size={33} />
                    <strong>{stats?.articles ?? 0}</strong>
                    <span>articles ready to help</span>
                  </div>
                  <div className="source-note">
                    <Icon name="shield" size={17} />
                    Every local answer links back to your articles.
                  </div>
                </section>
              </div>
              <div className="overview-columns lower">
                <section className="panel">
                  <div className="panel-heading">
                    <div>
                      <h2>Your knowledge, growing</h2>
                      <p>Keep answers fresh and useful.</p>
                    </div>
                    <button
                      className="text-button"
                      onClick={() => navigate("knowledge")}
                    >
                      View all <Icon name="arrow" size={15} />
                    </button>
                  </div>
                  <div className="recent-articles">
                    {dashboard?.recentArticles.length ? (
                      dashboard.recentArticles.map((article) => (
                        <button
                          key={article.id}
                          onClick={() => setReadArticle(article)}
                        >
                          <span className="file-icon">
                            <Icon name="book" size={19} />
                          </span>
                          <span>
                            <strong>{article.title}</strong>
                            <small>
                              {article.category} <span>·</span> Updated{" "}
                              {date(article.updatedAt)}
                            </small>
                          </span>
                          <Tag status="ready">Ready</Tag>
                          <Icon name="chevron" size={15} />
                        </button>
                      ))
                    ) : (
                      <Empty title="A fresh start">
                        Add your first article to help your assistant.
                      </Empty>
                    )}
                  </div>
                </section>
                <section className="knowledge-promo">
                  <span className="promo-star">
                    <Icon name="star" size={33} />
                  </span>
                  <span className="eyebrow">A GOOD PLACE TO START</span>
                  <h2>
                    Better knowledge.
                    <br />
                    Better conversations.
                  </h2>
                  <p>
                    Add your FAQs, policies, and how-to guides. Give every
                    answer a little more confidence.
                  </p>
                  <Button onClick={() => setEditor({})}>
                    <Icon name="plus" size={17} />
                    Add knowledge
                  </Button>
                </section>
              </div>
            </>
          )}
          {tab === "knowledge" && (
            <>
              <div className="page-heading">
                <div>
                  <span className="eyebrow">YOUR SOURCE OF TRUTH</span>
                  <h1>
                    {admin ? "Knowledge base" : "Help articles"}
                    <span>.</span>
                  </h1>
                  <p>
                    {admin
                      ? "A home for the answers your customers need."
                      : "Browse helpful answers from this business."}
                  </p>
                </div>
                {admin && (
                  <div className="heading-actions">
                    <input
                      ref={uploadRef}
                      type="file"
                      accept=".txt,.md,text/plain,text/markdown"
                      hidden
                      onChange={uploadFile}
                    />
                    <Button
                      secondary
                      disabled={busy}
                      onClick={() => uploadRef.current.click()}
                    >
                      <Icon name="upload" size={17} />
                      Import text
                    </Button>
                    <Button disabled={busy} onClick={() => setEditor({})}>
                      <Icon name="plus" size={17} />
                      New article
                    </Button>
                  </div>
                )}
              </div>
              <div className="knowledge-toolbar">
                <label className="search-box">
                  <Icon name="search" size={18} />
                  <input
                    aria-label="Search knowledge"
                    value={query}
                    onChange={(event) => setQuery(event.target.value)}
                    placeholder="Search your knowledge…"
                  />
                </label>
                <span>
                  {filteredArticles.length} article
                  {filteredArticles.length === 1 ? "" : "s"}{" "}
                  <span className="muted">· Ready for your assistant</span>
                </span>
              </div>
              <div className="article-grid">
                {filteredArticles.map((article) => (
                  <article className="article-card" key={article.id}>
                    <div className="article-card-top">
                      <span className="file-icon">
                        <Icon name="book" size={22} />
                      </span>
                      <Tag status="ready">Ready</Tag>
                    </div>
                    <button
                      className="article-title"
                      onClick={() => setReadArticle(article)}
                    >
                      {article.title}
                    </button>
                    <p>
                      {article.content.slice(0, 125)}
                      {article.content.length > 125 && "…"}
                    </p>
                    <div className="article-meta">
                      <Tag>{article.category}</Tag>
                      <span>{date(article.updatedAt)}</span>
                    </div>
                    <div className="article-actions">
                      <button
                        className="text-button"
                        onClick={() => setReadArticle(article)}
                      >
                        Read article <Icon name="arrow" size={15} />
                      </button>
                      {admin && (
                        <div>
                          <button
                            className="icon-button"
                            title="Edit article"
                            aria-label={`Edit ${article.title}`}
                            onClick={() => setEditor(article)}
                          >
                            <Icon name="edit" size={16} />
                          </button>
                          <button
                            className="icon-button danger"
                            title="Delete article"
                            aria-label={`Delete ${article.title}`}
                            disabled={busy}
                            onClick={() => {
                              if (
                                window.confirm(
                                  `Delete “${article.title}”? This cannot be undone.`,
                                )
                              )
                                run(async () => {
                                  await api(`/articles/${article.id}`, {
                                    method: "DELETE",
                                  });
                                  await load();
                                }, "Article deleted.");
                            }}
                          >
                            <Icon name="trash" size={16} />
                          </button>
                        </div>
                      )}
                    </div>
                  </article>
                ))}
              </div>
              {!filteredArticles.length && (
                <section className="panel">
                  <Empty
                    title={
                      query
                        ? "No matching articles"
                        : "Give your assistant a starting point"
                    }
                  >
                    {query
                      ? "Try a different word or clear the search."
                      : admin
                        ? "Write an article or import a plain .txt or .md file up to 64 KB."
                        : "This workspace has not published any help articles yet."}
                  </Empty>
                </section>
              )}
              {admin && (
                <p className="quiet-note">
                  <Icon name="shield" size={15} />
                  Imports support UTF-8 .txt and .md files up to 64 KB. Articles
                  can contain up to 16,000 characters. PDF files are not
                  supported.
                </p>
              )}
            </>
          )}
          {tab === "conversations" && (
            <>
              <div className="page-heading">
                <div>
                  <span className="eyebrow">EVERY QUESTION HAS A STORY</span>
                  <h1>
                    Conversations<span>.</span>
                  </h1>
                  <p>A shared view of how your customers are getting help.</p>
                </div>
                <Button
                  onClick={() => {
                    setActiveChat(null);
                    navigate("assistant");
                  }}
                >
                  <Icon name="plus" size={17} />
                  Test a conversation
                </Button>
              </div>
              <section className="panel conversation-list">
                {conversations.length ? (
                  conversations.map((conversation) => (
                    <button
                      key={conversation.id}
                      onClick={() => openChat(conversation)}
                    >
                      <span className="avatar lavender">
                        <Icon name="chat" size={20} />
                      </span>
                      <div>
                        <strong>{conversation.title}</strong>
                        <small>
                          {conversation.messageCount} messages · Updated{" "}
                          {date(conversation.updatedAt)}
                        </small>
                      </div>
                      <Tag>
                        {conversation.userId === session.user.id
                          ? "Your test"
                          : "Customer"}
                      </Tag>
                      <Icon name="chevron" size={17} />
                    </button>
                  ))
                ) : (
                  <Empty title="The conversation starts here">
                    Test your assistant or invite customers to your workspace.
                  </Empty>
                )}
              </section>
            </>
          )}
          {tab === "assistant" && (
            <>
              <div className="page-heading compact">
                <div>
                  <span className="eyebrow">
                    A HELPFUL ANSWER IS A GOOD START
                  </span>
                  <h1>
                    {admin ? "Meet your assistant" : "How can we help?"}
                    {admin && <span>.</span>}
                  </h1>
                  <p>
                    {admin
                      ? "Try a question. See your knowledge at work."
                      : `Get answers from ${session.workspace.name}, or ask for a person.`}
                  </p>
                </div>
                <Tag status="purple">
                  <Icon name="star" size={13} />
                  {session.assistant?.startsWith("OpenAI")
                    ? "AI + grounded knowledge"
                    : "Local knowledge search"}
                </Tag>
              </div>
              <section className="chat-layout panel">
                <aside className="chat-history">
                  <Button
                    secondary
                    disabled={busy}
                    onClick={() => setActiveChat(null)}
                  >
                    <Icon name="plus" size={16} />
                    New conversation
                  </Button>
                  <span className="nav-label">RECENT CONVERSATIONS</span>
                  {conversations
                    .filter((item) => !admin || item.userId === session.user.id)
                    .slice(0, 20)
                    .map((item) => (
                      <button
                        className={activeChat?.id === item.id ? "selected" : ""}
                        key={item.id}
                        disabled={busy}
                        onClick={() => openChat(item)}
                      >
                        <Icon name="chat" size={15} />
                        <span>{item.title}</span>
                      </button>
                    ))}
                  {!conversations.filter(
                    (item) => !admin || item.userId === session.user.id,
                  ).length && (
                    <p className="history-empty">
                      Your conversations will be saved here.
                    </p>
                  )}
                  <div className="chat-history-footer">
                    <Icon name="shield" size={16} />
                    <p>Answers stay grounded in this workspace's knowledge.</p>
                  </div>
                </aside>
                <div className="chat-main">
                  <div className="chat-top">
                    <span className="assistant-avatar">
                      <Icon name="star" size={21} />
                    </span>
                    <div>
                      <strong>{session.workspace.name} assistant</strong>
                      <small>
                        <i />
                        {ownChat
                          ? "Ready when you are"
                          : "Viewing customer conversation"}
                      </small>
                    </div>
                    <Tag>SupportPilot</Tag>
                  </div>
                  <div className="messages" aria-live="polite">
                    {!activeChat?.messages.length && (
                      <div className="chat-welcome">
                        <span className="welcome-orb">
                          <Icon name="star" size={37} />
                        </span>
                        <h2>A little help, right here.</h2>
                        <p>
                          Ask a question and we'll find an answer in
                          <br />
                          this business's knowledge base.
                        </p>
                        <div className="suggestions">
                          {[
                            "What is your return policy?",
                            "How long does shipping take?",
                            "How do I cancel my subscription?",
                            "I need help with a damaged order",
                          ].map((question) => (
                            <button
                              key={question}
                              disabled={busy}
                              onClick={() => sendMessage(null, question)}
                            >
                              {question}
                              <Icon name="arrow" size={15} />
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                    {activeChat?.messages.map((message) => (
                      <div
                        className={`message ${message.role}`}
                        key={message.id}
                      >
                        {message.role === "assistant" && (
                          <span className="assistant-avatar">
                            <Icon name="star" size={17} />
                          </span>
                        )}
                        <div className="message-content">
                          <span className="message-label">
                            {message.role === "assistant" ? "Assistant" : "You"}{" "}
                            <small>
                              {new Date(message.createdAt).toLocaleTimeString(
                                [],
                                { hour: "2-digit", minute: "2-digit" },
                              )}
                            </small>
                          </span>
                          <div className="bubble">{message.content}</div>
                          {message.sources?.length > 0 && (
                            <div className="message-sources">
                              <span>Sources</span>
                              {message.sources.map((source) => (
                                <button
                                  key={source.id}
                                  onClick={() => {
                                    const article = articles.find(
                                      (item) => item.id === source.id,
                                    );
                                    if (article) setReadArticle(article);
                                    else
                                      setNotice(
                                        "This source has since been removed from the knowledge base.",
                                      );
                                  }}
                                >
                                  <Icon name="book" size={12} />
                                  {source.title}
                                </button>
                              ))}
                            </div>
                          )}
                          {message.role === "assistant" && (
                            <small className="message-mode">
                              {message.mode === "openai"
                                ? "AI answer · Check source policies for details"
                                : message.providerFallback
                                  ? "Local knowledge search · AI unavailable"
                                  : "Local knowledge search"}
                              {message.needsHuman &&
                                " · Human help recommended"}
                            </small>
                          )}
                        </div>
                      </div>
                    ))}
                    {busy && (
                      <div className="thinking">
                        <span />
                        <span />
                        <span /> Finding a helpful answer…
                      </div>
                    )}
                    <div ref={chatEnd} />
                  </div>
                  {ownChat ? (
                    <div className="composer-wrap">
                      <form className="composer" onSubmit={sendMessage}>
                        <input
                          name="content"
                          aria-label="Your message"
                          autoComplete="off"
                          placeholder="Ask a question…"
                          required
                          minLength={3}
                          maxLength={1200}
                          disabled={busy}
                        />
                        <button aria-label="Send message" disabled={busy}>
                          <Icon name="send" size={19} />
                        </button>
                      </form>
                      <div className="composer-foot">
                        <span>
                          Knowledge-based answers. For anything else, we're
                          here.
                        </span>
                        <button
                          className="text-button"
                          disabled={busy}
                          onClick={handoff}
                        >
                          Talk to a person <Icon name="arrow" size={13} />
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="read-only-note">
                      This customer conversation is read-only. Reply to the
                      customer through their support request.
                    </div>
                  )}
                </div>
              </section>
            </>
          )}
          {tab === "inbox" && (
            <>
              <div className="page-heading">
                <div>
                  <span className="eyebrow">A LITTLE HUMAN CONNECTION</span>
                  <h1>
                    {admin ? "Support inbox" : "Your support requests"}
                    <span>.</span>
                  </h1>
                  <p>
                    {admin
                      ? "Pick up where the assistant left off."
                      : "Your conversation with the support team, all in one place."}
                  </p>
                </div>
                {!admin && (
                  <Button secondary onClick={() => navigate("assistant")}>
                    <Icon name="chat" size={17} />
                    Ask a question
                  </Button>
                )}
              </div>
              {tickets.length ? (
                <section className="inbox-layout panel">
                  <aside className="ticket-list">
                    <div className="ticket-list-heading">
                      <strong>All requests</strong>
                      <Tag>{tickets.length}</Tag>
                    </div>
                    {tickets.map((ticket) => (
                      <button
                        className={
                          activeTicket?.id === ticket.id ? "selected" : ""
                        }
                        onClick={() => setTicketId(ticket.id)}
                        key={ticket.id}
                      >
                        <div>
                          <Tag status={ticket.status}>
                            {ticket.status.replace("-", " ")}
                          </Tag>
                          <small>{date(ticket.updatedAt)}</small>
                        </div>
                        <strong>{ticket.subject}</strong>
                        <p>{ticket.replies.at(-1)?.content.slice(0, 80)}</p>
                        <small>{ticket.replies[0]?.author}</small>
                      </button>
                    ))}
                  </aside>
                  <div className="ticket-detail">
                    <div className="ticket-detail-head">
                      <span className="eyebrow">
                        REQUEST #{activeTicket.id.slice(0, 6).toUpperCase()}
                      </span>
                      <h2>{activeTicket.subject}</h2>
                      <div>
                        <span>Opened {date(activeTicket.createdAt)}</span>
                        {admin ? (
                          <label className="status-select">
                            Status
                            <select
                              aria-label="Ticket status"
                              value={activeTicket.status}
                              disabled={busy}
                              onChange={(event) =>
                                run(async () => {
                                  await api(`/tickets/${activeTicket.id}`, {
                                    method: "PATCH",
                                    body: { status: event.target.value },
                                  });
                                  await load();
                                }, "Request status updated.")
                              }
                            >
                              <option value="open">Open</option>
                              <option value="in-progress">In progress</option>
                              <option value="closed">Closed</option>
                            </select>
                          </label>
                        ) : (
                          <Tag status={activeTicket.status}>
                            {activeTicket.status.replace("-", " ")}
                          </Tag>
                        )}
                      </div>
                    </div>
                    <div className="ticket-replies">
                      {activeTicket.replies.map((reply) => (
                        <div
                          className={`reply ${reply.role === "admin" ? "staff" : ""}`}
                          key={reply.id}
                        >
                          <span
                            className={`avatar ${reply.role === "admin" ? "lavender" : "mint"}`}
                          >
                            {initials(reply.author)}
                          </span>
                          <div>
                            <div className="reply-meta">
                              <strong>{reply.author}</strong>
                              <Tag>
                                {reply.role === "admin"
                                  ? "Support team"
                                  : "Customer"}
                              </Tag>
                              <small>{date(reply.createdAt)}</small>
                            </div>
                            <p>{reply.content}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                    {activeTicket.status === "closed" ? (
                      <div className="read-only-note">
                        <Icon name="check" size={16} />
                        This request is closed.{" "}
                        {admin
                          ? "Reopen it above to continue the conversation."
                          : "Start a new chat if you need more help."}
                      </div>
                    ) : (
                      <form
                        className="ticket-reply-form"
                        onSubmit={(event) => {
                          event.preventDefault();
                          const content = new FormData(event.currentTarget).get(
                              "content",
                            ),
                            form = event.currentTarget;
                          run(async () => {
                            await api(`/tickets/${activeTicket.id}/replies`, {
                              method: "POST",
                              body: { content },
                            });
                            form.reset();
                            await load();
                          }, "Reply posted.");
                        }}
                      >
                        <label htmlFor="ticketReply">
                          {admin ? "Reply to your customer" : "Add a reply"}
                        </label>
                        <textarea
                          id="ticketReply"
                          name="content"
                          required
                          minLength={2}
                          maxLength={3000}
                          placeholder="A thoughtful reply goes a long way…"
                        />
                        <div>
                          <small>
                            Replies appear in this workspace. No email is sent.
                          </small>
                          <Button disabled={busy}>
                            Send reply
                            <Icon name="send" size={15} />
                          </Button>
                        </div>
                      </form>
                    )}
                  </div>
                </section>
              ) : (
                <section className="panel">
                  <Empty title="Nothing waiting here">
                    {admin
                      ? "Customer requests will arrive here when they ask for a person."
                      : "Ask the assistant a question, then select “Talk to a person” if you need more help."}
                  </Empty>
                </section>
              )}
            </>
          )}
          <footer className="page-footer">
            <span>Made for good conversations.</span>
            <span>
              SupportPilot <Icon name="star" size={12} />
            </span>
          </footer>
        </main>
      </div>
      {editor && (
        <div
          className="modal-backdrop"
          onClick={(event) => {
            if (event.target === event.currentTarget && !busy) setEditor(null);
          }}
        >
          <section
            className="modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="editor-title"
          >
            <div className="modal-header">
              <div>
                <span className="eyebrow">KNOWLEDGE BASE</span>
                <h2 id="editor-title">
                  {editor.id ? "Edit your article" : "A new helpful answer"}
                </h2>
              </div>
              <button
                className="icon-button"
                aria-label="Close editor"
                disabled={busy}
                onClick={() => setEditor(null)}
              >
                <Icon name="close" />
              </button>
            </div>
            <form onSubmit={saveArticle}>
              {error && (
                <div className="form-error" role="alert">
                  {error}
                </div>
              )}
              <label>
                Article title
                <input
                  name="title"
                  required
                  minLength={3}
                  maxLength={120}
                  defaultValue={editor.title}
                  placeholder="e.g. Our returns policy"
                  autoFocus
                />
              </label>
              <label>
                Category
                <input
                  name="category"
                  required
                  minLength={2}
                  maxLength={40}
                  defaultValue={editor.category || "General"}
                />
              </label>
              <label>
                Content
                <textarea
                  name="content"
                  required
                  minLength={20}
                  maxLength={16000}
                  defaultValue={editor.content}
                  rows={9}
                  placeholder="Write a clear, complete answer. The assistant uses this text to help customers."
                />
              </label>
              <p className="quiet-note">
                Articles are visible to customers in this workspace. Avoid
                private or sensitive information.
              </p>
              <div className="modal-footer">
                <Button
                  type="button"
                  secondary
                  disabled={busy}
                  onClick={() => setEditor(null)}
                >
                  Cancel
                </Button>
                <Button disabled={busy}>
                  {busy ? "Saving…" : "Save article"}
                  <Icon name="check" size={17} />
                </Button>
              </div>
            </form>
          </section>
        </div>
      )}
      {readArticle && (
        <div
          className="modal-backdrop"
          onClick={(event) => {
            if (event.target === event.currentTarget) setReadArticle(null);
          }}
        >
          <article
            className="modal read-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="read-title"
          >
            <div className="modal-header">
              <Tag>{readArticle.category}</Tag>
              <button
                className="icon-button"
                aria-label="Close article"
                onClick={() => setReadArticle(null)}
              >
                <Icon name="close" />
              </button>
            </div>
            <h2 id="read-title">{readArticle.title}</h2>
            <p className="muted">
              Updated {date(readArticle.updatedAt)} · {readArticle.source}
            </p>
            <div className="article-body">{readArticle.content}</div>
            <div className="source-note">
              <Icon name="shield" size={17} />
              Published by {session.workspace.name}
            </div>
          </article>
        </div>
      )}
    </div>
  );
}
createRoot(document.getElementById("root")).render(<App />);
