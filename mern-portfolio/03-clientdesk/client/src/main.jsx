import React, { useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import "./styles.css";

const STAGES = ["New", "Contacted", "Proposal", "Won", "Lost"];
const money = (amount) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(amount || 0);
const initials = (name) =>
  name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0])
    .join("")
    .toUpperCase();
const today = () => new Date().toISOString().slice(0, 10);
const dateLabel = (day) =>
  new Date(`${day}T12:00:00`).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
const classStage = (stage) => stage.toLowerCase().replaceAll(" ", "-");
const icons = {
  dashboard: (
    <>
      <rect x="3" y="3" width="7" height="7" rx="1.5" />
      <rect x="14" y="3" width="7" height="7" rx="1.5" />
      <rect x="3" y="14" width="7" height="7" rx="1.5" />
      <rect x="14" y="14" width="7" height="7" rx="1.5" />
    </>
  ),
  pipeline: (
    <>
      <path d="M4 4v16M12 4v16M20 4v16" />
      <path d="M2 8h4M10 14h4M18 11h4" />
    </>
  ),
  clients: (
    <>
      <circle cx="9" cy="8" r="3" />
      <path d="M3 21v-3a6 6 0 0112 0v3M16 5a3 3 0 010 6M18 15a5 5 0 013 5" />
    </>
  ),
  tasks: (
    <>
      <rect x="4" y="3" width="16" height="18" rx="3" />
      <path d="m8 9 2 2 5-5M8 16h8" />
    </>
  ),
  notes: (
    <>
      <path d="M14 3H6a2 2 0 00-2 2v14a2 2 0 002 2h12a2 2 0 002-2V9zM14 3v6h6M8 13h8M8 17h5" />
    </>
  ),
  team: (
    <>
      <circle cx="12" cy="8" r="3" />
      <path d="M6 21v-3a6 6 0 0112 0v3M5 5a3 3 0 000 6M19 5a3 3 0 010 6" />
    </>
  ),
  settings: (
    <>
      <path d="m9 3-1 3-3 1 1 3-2 2 2 2-1 3 3 1 1 3h6l1-3 3-1-1-3 2-2-2-2 1-3-3-1-1-3z" />
      <circle cx="12" cy="12" r="3" />
    </>
  ),
  search: (
    <>
      <circle cx="10.5" cy="10.5" r="6.5" />
      <path d="m16 16 5 5" />
    </>
  ),
  plus: <path d="M12 5v14M5 12h14" />,
  arrow: <path d="M5 12h14m-5-5 5 5-5 5" />,
  logout: (
    <>
      <path d="M9 4H4v16h5M9 12h12m-5-5 5 5-5 5" />
    </>
  ),
  download: (
    <>
      <path d="M12 3v12m-5-5 5 5 5-5M4 16v5h16v-5" />
    </>
  ),
  close: <path d="m6 6 12 12M18 6 6 18" />,
  edit: (
    <>
      <path d="m15 4 5 5M4 20l5-1L21 7a2 2 0 00-4-4L5 15z" />
    </>
  ),
  trash: (
    <>
      <path d="M3 6h18M9 6V3h6v3M5 6l1 15h12l1-15M10 10v7M14 10v7" />
    </>
  ),
  check: <path d="m5 12 4 4L19 6" />,
  menu: <path d="M4 6h16M4 12h16M4 18h16" />,
  spark: (
    <>
      <path d="m12 3 2.5 6.5L21 12l-6.5 2.5L12 21l-2.5-6.5L3 12l6.5-2.5z" />
    </>
  ),
};
function Icon({ name, size = 20 }) {
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
    >
      {icons[name] || icons.dashboard}
    </svg>
  );
}
function Logo() {
  return (
    <div className="logo">
      <span className="logo-symbol">
        <svg width="25" height="25" viewBox="0 0 28 28" fill="none">
          <path
            d="M21 7H12a7 7 0 000 14h9M21 14H10"
            stroke="currentColor"
            strokeWidth="3.5"
            strokeLinecap="round"
          />
        </svg>
      </span>
      <span>
        Client<span className="logo-light">Desk</span>
        <span className="logo-dot">.</span>
      </span>
    </div>
  );
}
function Avatar({ name, small = false, color = 0 }) {
  return (
    <span className={`avatar color-${color % 5} ${small ? "small" : ""}`}>
      {initials(name || "?")}
    </span>
  );
}
function Empty({ title, detail }) {
  return (
    <div className="empty">
      <span className="empty-icon">
        <Icon name="spark" size={28} />
      </span>
      <h3>{title}</h3>
      <p>{detail}</p>
    </div>
  );
}
function Field({ label, children, wide }) {
  return (
    <label className={`field ${wide ? "wide" : ""}`}>
      <span>{label}</span>
      {children}
    </label>
  );
}

function Auth({ onLogin }) {
  const [mode, setMode] = useState("login");
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    workspace: "",
    code: "",
  });
  const [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  const update = (key) => (event) =>
    setForm({ ...form, [key]: event.target.value });
  async function submit(event, demo) {
    event?.preventDefault();
    setBusy(true);
    setError("");
    try {
      const body = demo ? { email: demo, password: "DemoPass123!" } : form;
      const result = await fetch(`/api/auth/${demo ? "login" : mode}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await result.json();
      if (!result.ok) throw new Error(data.error || "Please try again.");
      onLogin(data.token);
    } catch (issue) {
      setError(issue.message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="auth-layout">
      <section className="auth-story">
        <Logo />
        <div className="auth-copy">
          <span className="eyebrow light">
            A LITTLE CLARITY GOES A LONG WAY
          </span>
          <h1>
            Your clients.
            <br />
            Your pipeline.
            <br />
            <em>One clear view.</em>
          </h1>
          <p>
            Turn promising conversations into lasting relationships. Your
            agency’s next chapter starts here.
          </p>
        </div>
        <div className="story-card">
          <div className="story-card-top">
            <span className="live-dot" />
            YOUR PIPELINE, IN FOCUS
            <span className="story-card-tag">Live data</span>
          </div>
          <div className="story-bars">
            {[45, 72, 58, 92, 76, 100, 88].map((height, index) => (
              <span key={index} style={{ height: `${height}%` }} />
            ))}
          </div>
          <div className="story-bottom">
            <span>Less busywork. More momentum.</span>
            <Icon name="arrow" />
          </div>
        </div>
        <p className="auth-foot">MERN portfolio project · Personal demo</p>
      </section>
      <section className="auth-form-panel">
        <div className="auth-mobile-logo">
          <Logo />
        </div>
        <div className="auth-form-wrap">
          <span className="eyebrow">WELCOME TO CLIENTDESK</span>
          <h2>
            {mode === "login"
              ? "Good to see you again."
              : mode === "join"
                ? "Join your team."
                : "Make room for growth."}
          </h2>
          <p className="muted">
            {mode === "login"
              ? "Sign in and pick up where you left off."
              : mode === "join"
                ? "Use the single-use code shared by your workspace admin."
                : "Create your workspace. Bring your best ideas."}
          </p>
          <div className="auth-tabs">
            {[
              ["login", "Sign in"],
              ["register", "Create workspace"],
              ["join", "Join team"],
            ].map(([value, label]) => (
              <button
                key={value}
                className={mode === value ? "active" : ""}
                onClick={() => {
                  setMode(value);
                  setError("");
                }}
              >
                {label}
              </button>
            ))}
          </div>
          <form onSubmit={submit} className="auth-form">
            {mode !== "login" && (
              <Field label="Your name">
                <input
                  value={form.name}
                  onChange={update("name")}
                  autoComplete="name"
                  maxLength={120}
                  required
                />
              </Field>
            )}
            {mode === "register" && (
              <Field label="Workspace name">
                <input
                  value={form.workspace}
                  onChange={update("workspace")}
                  placeholder="e.g. Studio North"
                  maxLength={80}
                  required
                />
              </Field>
            )}
            {mode === "join" && (
              <Field label="Invite code">
                <input
                  value={form.code}
                  onChange={update("code")}
                  placeholder="Paste the code your admin shared"
                  required
                />
              </Field>
            )}
            <Field label="Email address">
              <input
                type="email"
                value={form.email}
                onChange={update("email")}
                placeholder="you@youragency.com"
                autoComplete="email"
                required
              />
            </Field>
            <Field label="Password">
              <input
                type="password"
                value={form.password}
                onChange={update("password")}
                placeholder={
                  mode === "login"
                    ? "Enter your password"
                    : "At least 10 characters"
                }
                minLength={mode === "login" ? undefined : 10}
                maxLength={72}
                autoComplete={
                  mode === "login" ? "current-password" : "new-password"
                }
                required
              />
            </Field>
            {error && (
              <div className="alert error" role="alert">
                {error}
              </div>
            )}
            <button className="button primary auth-submit" disabled={busy}>
              {busy
                ? "Working…"
                : mode === "login"
                  ? "Sign in to your workspace"
                  : mode === "join"
                    ? "Join workspace"
                    : "Create your workspace"}
              <Icon name="arrow" />
            </button>
          </form>
          <div className="demo-entry">
            <div className="divider">
              <span>JUST EXPLORING?</span>
            </div>
            <button
              className="button demo"
              disabled={busy}
              onClick={(event) => submit(event, "owner@clientdesk.demo")}
            >
              <Icon name="spark" />
              Explore the demo workspace
              <Icon name="arrow" />
            </button>
            <p>
              Demo login: owner@clientdesk.demo · DemoPass123!
              <br />
              Available when demo seeding is enabled.
            </p>
          </div>
        </div>
        <footer className="auth-bottom">
          Built for thoughtful teams, and their next big thing.
        </footer>
      </section>
    </div>
  );
}

function App() {
  const [token, setToken] = useState(
    () => sessionStorage.getItem("clientdesk-token") || "",
  );
  const [data, setData] = useState(null),
    [page, setPage] = useState("dashboard"),
    [query, setQuery] = useState("");
  const [modal, setModal] = useState(null),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [toast, setToast] = useState("");
  const [sidebar, setSidebar] = useState(false),
    [taskFilter, setTaskFilter] = useState("all"),
    [clientFilter, setClientFilter] = useState("All");
  const [invites, setInvites] = useState([]),
    [inviteCode, setInviteCode] = useState(""),
    [noteDraft, setNoteDraft] = useState("");
  function logout() {
    sessionStorage.removeItem("clientdesk-token");
    setToken("");
    setData(null);
    setError("");
    setModal(null);
  }
  async function api(url, method = "GET", body) {
    const response = await fetch(`/api${url}`, {
      method,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      ...(body ? { body: JSON.stringify(body) } : {}),
    });
    if (response.status === 401) {
      logout();
      throw new Error("Your session expired. Please sign in again.");
    }
    if (response.status === 204) return null;
    const value = await response.json();
    if (!response.ok) throw new Error(value.error || "Please try again.");
    return value;
  }
  async function refresh() {
    const result = await api("/bootstrap");
    setData(result);
    return result;
  }
  useEffect(() => {
    if (token) refresh().catch((issue) => setError(issue.message));
  }, [token]);
  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(""), 4500);
    return () => clearTimeout(timer);
  }, [toast]);
  useEffect(() => {
    if (token && data?.user.role === "admin" && page === "team")
      api("/invites")
        .then(setInvites)
        .catch((issue) => setError(issue.message));
  }, [page, data?.user.role, token]);
  async function run(action, message = "Changes saved.") {
    setBusy(true);
    setError("");
    try {
      await action();
      await refresh();
      setModal(null);
      setToast(message);
    } catch (issue) {
      setError(issue.message);
    } finally {
      setBusy(false);
    }
  }
  const login = (value) => {
    sessionStorage.setItem("clientdesk-token", value);
    setToken(value);
    setPage("dashboard");
  };
  if (!token) return <Auth onLogin={login} />;
  if (!data)
    return (
      <div className="loading">
        <Logo />
        <p>{error || "Opening your workspace…"}</p>
        {error && (
          <button className="button secondary" onClick={logout}>
            Back to sign in
          </button>
        )}
      </div>
    );
  const { user, workspace, leads, clients, tasks, notes, team } = data;
  const isAdmin = user.role === "admin";
  const sum = (rows) => rows.reduce((value, row) => value + row.value, 0);
  const openLeads = leads.filter(
    (lead) => !["Won", "Lost"].includes(lead.stage),
  );
  const revenue = sum(leads.filter((lead) => lead.stage === "Won"));
  const todo = tasks
    .filter((task) => task.status === "todo")
    .sort((a, b) => a.due.localeCompare(b.due));
  const search = (record) =>
    Object.values(record).some(
      (value) =>
        typeof value === "string" &&
        value.toLowerCase().includes(query.toLowerCase()),
    );
  const selectedLeads = leads.filter(search);
  const selectedClients = clients
    .filter(search)
    .filter(
      (client) => clientFilter === "All" || client.status === clientFilter,
    );
  const selectedTasks = tasks
    .filter(search)
    .filter((task) =>
      taskFilter === "all" || taskFilter === "mine"
        ? taskFilter !== "mine" || task.assignedTo === user.id
        : task.status === taskFilter,
    )
    .sort((a, b) => a.due.localeCompare(b.due));
  function navigate(target) {
    setPage(target);
    setQuery("");
    setSidebar(false);
    setError("");
  }
  const newLead = () => {
    setError("");
    setModal({
      type: "lead",
      values: {
        name: "",
        company: "",
        email: "",
        value: "",
        stage: "New",
        source: "Website",
      },
    });
  };
  const edit = (type, row) => {
    setError("");
    setModal({ type, values: { ...row } });
  };
  const updateModal = (key) => (event) =>
    setModal({
      ...modal,
      values: { ...modal.values, [key]: event.target.value },
    });
  async function saveModal(event) {
    event.preventDefault();
    const collection = { lead: "leads", client: "clients", task: "tasks" }[
      modal.type
    ];
    await run(
      () =>
        api(
          `/${collection}${modal.values.id ? `/${modal.values.id}` : ""}`,
          modal.values.id ? "PUT" : "POST",
          modal.values,
        ),
      `${modal.type[0].toUpperCase() + modal.type.slice(1)} ${modal.values.id ? "updated" : "created"}.`,
    );
  }
  async function remove(collection, row) {
    if (
      window.confirm(
        `Delete ${row.name || row.title || "this note"}? This cannot be undone.`,
      )
    )
      run(() => api(`/${collection}/${row.id}`, "DELETE"), "Record deleted.");
  }
  async function downloadReport() {
    try {
      const response = await fetch("/api/reports/leads.csv", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) throw new Error("Export failed. Please try again.");
      const url = URL.createObjectURL(await response.blob());
      const link = document.createElement("a");
      link.href = url;
      link.download = "clientdesk-leads.csv";
      link.click();
      URL.revokeObjectURL(url);
      setToast("Pipeline report downloaded.");
    } catch (issue) {
      setError(issue.message);
    }
  }
  async function createInvite() {
    setBusy(true);
    setError("");
    try {
      const result = await api("/invites", "POST", {});
      setInviteCode(result.code);
      setInvites(await api("/invites"));
    } catch (issue) {
      setError(issue.message);
    } finally {
      setBusy(false);
    }
  }
  const taskCheck = (task) =>
    run(
      () =>
        api(`/tasks/${task.id}/status`, "PATCH", {
          status: task.status === "done" ? "todo" : "done",
        }),
      task.status === "done" ? "Task reopened." : "Nice work. Task completed.",
    );
  const titles = {
    dashboard: "Overview",
    pipeline: "Sales pipeline",
    clients: "Clients",
    tasks: "Tasks",
    notes: "Workspace notes",
    team: "Your team",
    settings: "Workspace settings",
  };
  const navItems = [
    ["dashboard", "Overview"],
    ["pipeline", "Sales pipeline"],
    ["clients", "Clients"],
    ["tasks", "Tasks"],
    ["notes", "Notes"],
  ];
  const actionButton =
    page === "clients" ? (
      isAdmin && (
        <button
          className="button primary"
          onClick={() =>
            edit("client", {
              name: "",
              contact: "",
              email: "",
              industry: "",
              status: "Active",
            })
          }
        >
          <Icon name="plus" />
          Add client
        </button>
      )
    ) : page === "tasks" ? (
      <button
        className="button primary"
        onClick={() =>
          edit("task", {
            title: "",
            due: today(),
            priority: "Medium",
            assignedTo: user.id,
            status: "todo",
          })
        }
      >
        <Icon name="plus" />
        New task
      </button>
    ) : ["dashboard", "pipeline"].includes(page) ? (
      <button className="button primary" onClick={newLead}>
        <Icon name="plus" />
        New lead
      </button>
    ) : null;
  return (
    <div className="app-shell">
      {sidebar && (
        <button
          className="sidebar-overlay"
          aria-label="Close navigation"
          onClick={() => setSidebar(false)}
        />
      )}
      <aside className={`sidebar ${sidebar ? "open" : ""}`}>
        <Logo />
        <div className="workspace-switch">
          <span className="workspace-mark">{initials(workspace.name)}</span>
          <div>
            <strong>{workspace.name}</strong>
            <span>Agency workspace</span>
          </div>
          <span className="workspace-pill">CRM</span>
        </div>
        <span className="nav-label">WORKSPACE</span>
        <nav>
          {navItems.map(([name, label]) => (
            <button
              key={name}
              className={`nav-item ${page === name ? "active" : ""}`}
              onClick={() => navigate(name)}
            >
              <Icon name={name} />
              <span>{label}</span>
              {name === "tasks" && todo.length > 0 && (
                <span className="nav-count">{todo.length}</span>
              )}
            </button>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <span className="nav-label">MANAGE</span>
          <button
            className={`nav-item ${page === "team" ? "active" : ""}`}
            onClick={() => navigate("team")}
          >
            <Icon name="team" />
            <span>Team members</span>
          </button>
          <button
            className={`nav-item ${page === "settings" ? "active" : ""}`}
            onClick={() => navigate("settings")}
          >
            <Icon name="settings" />
            <span>Settings</span>
          </button>
          <div className="sidebar-tip">
            <span className="tip-icon">
              <Icon name="spark" />
            </span>
            <strong>A clear day starts here.</strong>
            <p>
              Keep your pipeline moving,
              <br />
              one conversation at a time.
            </p>
            <button onClick={() => navigate("tasks")}>
              View your tasks <Icon name="arrow" size={15} />
            </button>
          </div>
          <div className="sidebar-user">
            <Avatar name={user.name} />
            <div>
              <strong>{user.name}</strong>
              <span>
                {user.role === "admin" ? "Workspace admin" : "Team member"}
              </span>
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
          <button
            className="icon-button mobile-menu"
            onClick={() => setSidebar(true)}
            aria-label="Open navigation"
          >
            <Icon name="menu" />
          </button>
          <div className="breadcrumbs">
            Workspace<span>/</span>
            <strong>{titles[page]}</strong>
          </div>
          <div className="topbar-right">
            <label className="global-search">
              <Icon name="search" size={18} />
              <input
                aria-label="Search workspace"
                placeholder="Search your workspace…"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
              />
            </label>
            <span className="demo-badge">Portfolio demo</span>
            <Avatar name={user.name} small />
          </div>
        </header>
        <main className="main-content">
          <div className="page-heading">
            <div>
              <span className="eyebrow">
                {page === "dashboard"
                  ? new Date().toLocaleDateString("en-US", {
                      weekday: "long",
                      month: "long",
                      day: "numeric",
                    })
                  : workspace.name}
              </span>
              <h1>
                {page === "dashboard"
                  ? `Let’s make progress, ${user.name.split(" ")[0]}.`
                  : titles[page]}
              </h1>
              <p>
                {
                  {
                    dashboard:
                      "A little perspective on your business. A clear path to what’s next.",
                    pipeline:
                      "From first hello to a lasting partnership. Keep every opportunity in view.",
                    clients: "Good work starts with great relationships.",
                    tasks:
                      "Small steps. Clear priorities. Meaningful progress.",
                    notes:
                      "Keep the context that makes your team’s work better.",
                    team: "Good things happen when the right people work together.",
                    settings: "The details that make this workspace yours.",
                  }[page]
                }
              </p>
            </div>
            <div className="heading-actions">
              {["dashboard", "pipeline"].includes(page) && (
                <button className="button secondary" onClick={downloadReport}>
                  <Icon name="download" size={17} />
                  <span>Export report</span>
                </button>
              )}
              {actionButton}
            </div>
          </div>
          {error && (
            <div className="alert error" role="alert">
              {error}
              <button onClick={() => setError("")} aria-label="Dismiss error">
                <Icon name="close" size={16} />
              </button>
            </div>
          )}
          {query && page === "dashboard" && (
            <section className="panel search-results">
              <h3>Search results for “{query}”</h3>
              <div className="search-links">
                <button onClick={() => setPage("pipeline")}>
                  {selectedLeads.length} leads <Icon name="arrow" size={16} />
                </button>
                <button onClick={() => setPage("clients")}>
                  {selectedClients.length} clients{" "}
                  <Icon name="arrow" size={16} />
                </button>
                <button onClick={() => setPage("tasks")}>
                  {selectedTasks.length} tasks <Icon name="arrow" size={16} />
                </button>
              </div>
            </section>
          )}
          {page === "dashboard" && (
            <>
              <div className="stats-row">
                {[
                  [
                    money(sum(openLeads)),
                    "Open pipeline",
                    `${openLeads.length} opportunities in progress`,
                    "pipeline",
                    "indigo",
                  ],
                  [
                    money(revenue),
                    "Won revenue",
                    `${leads.filter((lead) => lead.stage === "Won").length} successful conversations`,
                    "spark",
                    "green",
                  ],
                  [
                    clients.filter((client) => client.status === "Active")
                      .length,
                    "Active clients",
                    "Relationships worth looking after",
                    "clients",
                    "orange",
                  ],
                  [
                    todo.length,
                    "Open tasks",
                    `${todo.filter((task) => task.due <= today()).length} due today or overdue`,
                    "tasks",
                    "blue",
                  ],
                ].map(([value, label, detail, icon, color]) => (
                  <div className="stat-card" key={label}>
                    <div className="stat-top">
                      <span>{label}</span>
                      <span className={`stat-icon ${color}`}>
                        <Icon name={icon} size={18} />
                      </span>
                    </div>
                    <strong>{value}</strong>
                    <p>{detail}</p>
                  </div>
                ))}
              </div>
              <div className="dashboard-row">
                <section className="panel pipeline-overview">
                  <div className="panel-heading">
                    <div>
                      <h2>Your pipeline, at a glance</h2>
                      <p>All opportunities by stage · USD</p>
                    </div>
                    <button
                      className="text-button"
                      onClick={() => navigate("pipeline")}
                    >
                      View pipeline
                      <Icon name="arrow" size={16} />
                    </button>
                  </div>
                  <div className="pipeline-total">
                    <strong>{money(sum(leads))}</strong>
                    <span>total opportunity value</span>
                  </div>
                  <div className="stage-bars">
                    {STAGES.map((stage) => {
                      const amount = sum(
                        leads.filter((lead) => lead.stage === stage),
                      );
                      return (
                        <div className="stage-bar-group" key={stage}>
                          <div className="bar-value">{money(amount)}</div>
                          <div className="bar-track">
                            <div
                              className={`bar-fill ${classStage(stage)}`}
                              style={{
                                height: `${Math.max(amount ? 4 : 0, (amount / Math.max(1, ...STAGES.map((value) => sum(leads.filter((lead) => lead.stage === value))))) * 130)}px`,
                              }}
                            />
                          </div>
                          <span>
                            <i className={`dot ${classStage(stage)}`} />
                            {stage}
                          </span>
                          <small>
                            {
                              leads.filter((lead) => lead.stage === stage)
                                .length
                            }{" "}
                            leads
                          </small>
                        </div>
                      );
                    })}
                  </div>
                </section>
                <section className="panel tasks-preview">
                  <div className="panel-heading">
                    <div>
                      <h2>Up next</h2>
                      <p>Your next small steps</p>
                    </div>
                    <span className="count-pill">{todo.length} open</span>
                  </div>
                  {todo.length ? (
                    <div className="up-next-list">
                      {todo.slice(0, 4).map((task) => (
                        <div className="up-next" key={task.id}>
                          <button
                            className="task-checkbox"
                            aria-label={`Complete ${task.title}`}
                            disabled={
                              busy || (!isAdmin && task.assignedTo !== user.id)
                            }
                            onClick={() => taskCheck(task)}
                          />
                          <div>
                            <strong>{task.title}</strong>
                            <span
                              className={task.due < today() ? "overdue" : ""}
                            >
                              {task.due === today()
                                ? "Today"
                                : dateLabel(task.due)}
                              <i />{" "}
                              {
                                team
                                  .find(
                                    (member) => member.id === task.assignedTo,
                                  )
                                  ?.name.split(" ")[0]
                              }
                            </span>
                          </div>
                          <span
                            className={`priority ${task.priority.toLowerCase()}`}
                          >
                            {task.priority}
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <Empty
                      title="A little breathing room."
                      detail="Your tasks are all caught up."
                    />
                  )}
                  <button
                    className="panel-footer-button"
                    onClick={() => navigate("tasks")}
                  >
                    View all tasks
                    <Icon name="arrow" size={16} />
                  </button>
                </section>
              </div>
              <section className="panel recent-panel">
                <div className="panel-heading">
                  <div>
                    <h2>Recent opportunities</h2>
                    <p>The conversations shaping what comes next</p>
                  </div>
                  <button
                    className="text-button"
                    onClick={() => navigate("pipeline")}
                  >
                    View all leads
                    <Icon name="arrow" size={16} />
                  </button>
                </div>
                {leads.length ? (
                  <LeadTable
                    leads={leads.slice(-6).reverse()}
                    edit={(lead) => edit("lead", lead)}
                  />
                ) : (
                  <Empty
                    title="Your first hello starts here."
                    detail="Add a lead to start building your pipeline."
                  />
                )}
              </section>
              <div className="bottom-note">
                <span className="live-dot" />
                <span>Workspace data is up to date.</span>
                <span>
                  {data.storage === "mongodb"
                    ? "MongoDB connected"
                    : "Local file demo · MongoDB-ready"}
                </span>
              </div>
            </>
          )}
          {page === "pipeline" && (
            <>
              <div className="pipeline-summary">
                <span>
                  <strong>{leads.length}</strong> total leads
                </span>
                <span>
                  <strong>{money(sum(openLeads))}</strong> open pipeline
                </span>
                <span>
                  <strong>
                    {leads.length
                      ? Math.round(
                          (leads.filter((lead) => lead.stage === "Won").length /
                            leads.length) *
                            100,
                        )
                      : 0}
                    %
                  </strong>{" "}
                  won / all leads
                </span>
                <small>
                  Drag cards or use their stage menu to move opportunities.
                </small>
              </div>
              <div className="kanban">
                {STAGES.map((stage) => (
                  <section
                    className={`kanban-column ${classStage(stage)}`}
                    key={stage}
                    onDragOver={(event) => event.preventDefault()}
                    onDrop={(event) => {
                      event.preventDefault();
                      const id = event.dataTransfer.getData("text/plain");
                      if (leads.some((lead) => lead.id === id))
                        run(
                          () => api(`/leads/${id}/stage`, "PATCH", { stage }),
                          `Lead moved to ${stage}.`,
                        );
                    }}
                  >
                    <header>
                      <span>
                        <i className={`dot ${classStage(stage)}`} />
                        {stage}
                        <b>
                          {
                            selectedLeads.filter((lead) => lead.stage === stage)
                              .length
                          }
                        </b>
                      </span>
                      <strong>
                        {money(
                          sum(
                            selectedLeads.filter(
                              (lead) => lead.stage === stage,
                            ),
                          ),
                        )}
                      </strong>
                    </header>
                    <div className="kanban-cards">
                      {selectedLeads
                        .filter((lead) => lead.stage === stage)
                        .map((lead, index) => (
                          <article
                            className="lead-card"
                            draggable={!busy}
                            onDragStart={(event) =>
                              event.dataTransfer.setData("text/plain", lead.id)
                            }
                            key={lead.id}
                          >
                            <div className="lead-card-top">
                              <span className="source-pill">{lead.source}</span>
                              <button
                                className="icon-button"
                                aria-label={`Edit ${lead.company}`}
                                onClick={() => edit("lead", lead)}
                              >
                                <Icon name="edit" size={15} />
                              </button>
                            </div>
                            <h3>{lead.company}</h3>
                            <p>{lead.name}</p>
                            <strong className="lead-value">
                              {money(lead.value)}
                            </strong>
                            <div className="lead-card-bottom">
                              <Avatar name={lead.name} small color={index} />
                              <select
                                aria-label={`Stage for ${lead.company}`}
                                value={lead.stage}
                                disabled={busy}
                                onChange={(event) =>
                                  run(
                                    () =>
                                      api(`/leads/${lead.id}/stage`, "PATCH", {
                                        stage: event.target.value,
                                      }),
                                    "Pipeline updated.",
                                  )
                                }
                              >
                                {STAGES.map((value) => (
                                  <option key={value}>{value}</option>
                                ))}
                              </select>
                            </div>
                          </article>
                        ))}
                      {!selectedLeads.some((lead) => lead.stage === stage) && (
                        <p className="empty-column">
                          No opportunities here yet
                        </p>
                      )}
                    </div>
                    <button
                      className="add-card"
                      onClick={() => {
                        setError("");
                        setModal({
                          type: "lead",
                          values: {
                            name: "",
                            company: "",
                            email: "",
                            value: "",
                            stage,
                            source: "Website",
                          },
                        });
                      }}
                    >
                      <Icon name="plus" size={16} />
                      Add opportunity
                    </button>
                  </section>
                ))}
              </div>
            </>
          )}
          {page === "clients" && (
            <section className="panel">
              <div className="panel-heading">
                <div className="filter-tabs">
                  {["All", "Active", "Paused", "Archived"].map((value) => (
                    <button
                      key={value}
                      className={clientFilter === value ? "active" : ""}
                      onClick={() => setClientFilter(value)}
                    >
                      {value}
                      {value === "All" && <span>{clients.length}</span>}
                    </button>
                  ))}
                </div>
                <span className="muted small-text">
                  {selectedClients.length} clients
                </span>
              </div>
              {selectedClients.length ? (
                <div className="table-scroll">
                  <table>
                    <thead>
                      <tr>
                        <th>COMPANY</th>
                        <th>CONTACT</th>
                        <th>INDUSTRY</th>
                        <th>STATUS</th>
                        <th>{isAdmin ? "ACTIONS" : "ROLE"}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedClients.map((client, index) => (
                        <tr key={client.id}>
                          <td>
                            <div className="name-cell">
                              <Avatar name={client.name} color={index} />
                              <strong>{client.name}</strong>
                            </div>
                          </td>
                          <td>
                            <div className="contact-cell">
                              <strong>{client.contact}</strong>
                              <a href={`mailto:${client.email}`}>
                                {client.email}
                              </a>
                            </div>
                          </td>
                          <td>{client.industry}</td>
                          <td>
                            <span
                              className={`status-pill ${client.status.toLowerCase()}`}
                            >
                              {client.status}
                            </span>
                          </td>
                          <td>
                            {isAdmin ? (
                              <div className="row-actions">
                                <button
                                  className="icon-button"
                                  aria-label={`Edit ${client.name}`}
                                  onClick={() => edit("client", client)}
                                >
                                  <Icon name="edit" size={17} />
                                </button>
                                <button
                                  className="icon-button danger"
                                  aria-label={`Delete ${client.name}`}
                                  disabled={busy}
                                  onClick={() => remove("clients", client)}
                                >
                                  <Icon name="trash" size={17} />
                                </button>
                              </div>
                            ) : (
                              <span className="muted small-text">
                                View only
                              </span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <Empty
                  title="Room for new relationships."
                  detail={
                    query
                      ? "No clients match your search."
                      : isAdmin
                        ? "Add a client to keep their details close."
                        : "Your admin can add clients to this workspace."
                  }
                />
              )}
            </section>
          )}
          {page === "tasks" && (
            <section className="panel">
              <div className="panel-heading">
                <div className="filter-tabs">
                  {[
                    ["all", "All tasks"],
                    ["mine", "Assigned to me"],
                    ["todo", "To do"],
                    ["done", "Completed"],
                  ].map(([value, label]) => (
                    <button
                      key={value}
                      className={taskFilter === value ? "active" : ""}
                      onClick={() => setTaskFilter(value)}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>
              {selectedTasks.length ? (
                <div className="table-scroll">
                  <table>
                    <thead>
                      <tr>
                        <th>TASK</th>
                        <th>ASSIGNEE</th>
                        <th>DUE DATE</th>
                        <th>PRIORITY</th>
                        <th>ACTIONS</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedTasks.map((task) => {
                        const assignee = team.find(
                          (member) => member.id === task.assignedTo,
                        );
                        const editable = isAdmin || task.assignedTo === user.id;
                        return (
                          <tr key={task.id}>
                            <td>
                              <div className="task-title">
                                <button
                                  className={`task-checkbox ${task.status === "done" ? "checked" : ""}`}
                                  aria-label={`${task.status === "done" ? "Reopen" : "Complete"} ${task.title}`}
                                  disabled={busy || !editable}
                                  onClick={() => taskCheck(task)}
                                >
                                  {task.status === "done" && (
                                    <Icon name="check" size={14} />
                                  )}
                                </button>
                                <strong
                                  className={
                                    task.status === "done" ? "completed" : ""
                                  }
                                >
                                  {task.title}
                                </strong>
                              </div>
                            </td>
                            <td>
                              <div className="name-cell">
                                <Avatar name={assignee?.name} small />
                                {assignee?.name || "Unknown"}
                              </div>
                            </td>
                            <td
                              className={
                                task.due < today() && task.status !== "done"
                                  ? "overdue"
                                  : ""
                              }
                            >
                              {dateLabel(task.due)}
                              {task.due < today() && task.status !== "done" && (
                                <span className="due-tag">Overdue</span>
                              )}
                            </td>
                            <td>
                              <span
                                className={`priority ${task.priority.toLowerCase()}`}
                              >
                                {task.priority}
                              </span>
                            </td>
                            <td>
                              {editable && (
                                <div className="row-actions">
                                  <button
                                    className="icon-button"
                                    aria-label={`Edit ${task.title}`}
                                    onClick={() => edit("task", task)}
                                  >
                                    <Icon name="edit" size={17} />
                                  </button>
                                  <button
                                    className="icon-button danger"
                                    aria-label={`Delete ${task.title}`}
                                    disabled={busy}
                                    onClick={() => remove("tasks", task)}
                                  >
                                    <Icon name="trash" size={17} />
                                  </button>
                                </div>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              ) : (
                <Empty
                  title="A clear list. A fresh start."
                  detail="Create a task or try a different filter."
                />
              )}
            </section>
          )}
          {page === "notes" && (
            <div className="notes-layout">
              <section className="panel note-composer">
                <h2>Leave a little context.</h2>
                <p className="muted">
                  Meeting takeaways, useful ideas, and things worth remembering.
                </p>
                <form
                  onSubmit={(event) => {
                    event.preventDefault();
                    run(async () => {
                      await api("/notes", "POST", { body: noteDraft });
                      setNoteDraft("");
                    }, "Note added.");
                  }}
                >
                  <textarea
                    aria-label="New workspace note"
                    value={noteDraft}
                    onChange={(event) => setNoteDraft(event.target.value)}
                    placeholder="What should your team know?"
                    maxLength={3000}
                    rows={6}
                    required
                  />
                  <div>
                    <span className="muted small-text">
                      {noteDraft.length}/3000
                    </span>
                    <button
                      className="button primary"
                      disabled={busy || !noteDraft.trim()}
                    >
                      <Icon name="plus" size={17} />
                      Add note
                    </button>
                  </div>
                </form>
              </section>
              <div className="notes-list">
                {notes.length ? (
                  [...notes]
                    .reverse()
                    .filter(search)
                    .map((note) => (
                      <article className="panel note" key={note.id}>
                        <div className="note-header">
                          <Avatar name={note.author} small />
                          <div>
                            <strong>{note.author}</strong>
                            <span>
                              {new Date(note.createdAt).toLocaleDateString(
                                "en-US",
                                {
                                  month: "short",
                                  day: "numeric",
                                  year: "numeric",
                                },
                              )}
                            </span>
                          </div>
                          {(isAdmin || note.authorId === user.id) && (
                            <button
                              className="icon-button danger"
                              aria-label="Delete note"
                              disabled={busy}
                              onClick={() => remove("notes", note)}
                            >
                              <Icon name="trash" size={17} />
                            </button>
                          )}
                        </div>
                        <p>{note.body}</p>
                      </article>
                    ))
                ) : (
                  <section className="panel">
                    <Empty
                      title="Keep the good ideas close."
                      detail="Your first workspace note will appear here."
                    />
                  </section>
                )}
              </div>
            </div>
          )}
          {page === "team" && (
            <>
              <section className="panel">
                <div className="panel-heading">
                  <div>
                    <h2>The people behind the progress</h2>
                    <p>{team.length} workspace members</p>
                  </div>
                  {isAdmin && (
                    <button
                      className="button primary"
                      disabled={busy}
                      onClick={createInvite}
                    >
                      <Icon name="plus" size={17} />
                      Create invite
                    </button>
                  )}
                </div>
                <div className="table-scroll">
                  <table>
                    <thead>
                      <tr>
                        <th>TEAM MEMBER</th>
                        <th>EMAIL</th>
                        <th>ACCESS</th>
                        <th>MEMBER SINCE</th>
                      </tr>
                    </thead>
                    <tbody>
                      {team.map((member, index) => (
                        <tr key={member.id}>
                          <td>
                            <div className="name-cell">
                              <Avatar name={member.name} color={index} />
                              <strong>
                                {member.name}
                                {member.id === user.id && (
                                  <span className="you-tag">You</span>
                                )}
                              </strong>
                            </div>
                          </td>
                          <td>{member.email}</td>
                          <td>
                            <span className={`role-pill ${member.role}`}>
                              {member.role === "admin" ? "Admin" : "Member"}
                            </span>
                          </td>
                          <td>
                            {new Date(
                              member.createdAt || Date.now(),
                            ).toLocaleDateString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>
              {isAdmin && (
                <section className="panel invites-panel">
                  <div className="panel-heading">
                    <div>
                      <h2>Workspace invites</h2>
                      <p>
                        Single-use member codes expire after 7 days. Share them
                        directly with your teammate.
                      </p>
                    </div>
                  </div>
                  {inviteCode && (
                    <div className="invite-code">
                      <strong>Your new invite code</strong>
                      <code>{inviteCode}</code>
                      <button
                        className="button secondary"
                        onClick={async () => {
                          try {
                            await navigator.clipboard.writeText(inviteCode);
                            setToast("Invite code copied.");
                          } catch {
                            setToast(
                              "Select and copy the invite code shown above.",
                            );
                          }
                        }}
                      >
                        Copy code
                      </button>
                      <small>
                        This code is shown only in this session. No email has
                        been sent.
                      </small>
                    </div>
                  )}
                  {invites.length ? (
                    <div className="invite-list">
                      {[...invites].reverse().map((invite) => (
                        <div key={invite.id}>
                          <span>
                            Created{" "}
                            {new Date(invite.createdAt).toLocaleDateString()}
                          </span>
                          <span>
                            {invite.revokedAt
                              ? "Revoked"
                              : invite.usedAt
                                ? "Used"
                                : new Date(invite.expiresAt) < new Date()
                                  ? "Expired"
                                  : `Expires ${new Date(invite.expiresAt).toLocaleDateString()}`}
                          </span>
                          {!invite.revokedAt && !invite.usedAt && (
                            <button
                              className="text-button danger"
                              disabled={busy}
                              onClick={async () => {
                                setBusy(true);
                                try {
                                  await api(`/invites/${invite.id}`, "DELETE");
                                  setInvites(await api("/invites"));
                                  setToast("Invite revoked.");
                                } catch (issue) {
                                  setError(issue.message);
                                } finally {
                                  setBusy(false);
                                }
                              }}
                            >
                              Revoke
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="muted invite-empty">
                      No invites yet. Create one when you’re ready to grow.
                    </p>
                  )}
                </section>
              )}
              <div className="role-explainer">
                <Icon name="team" />
                <p>
                  <strong>Clear roles, shared progress.</strong> Admins manage
                  clients, workspace settings and invites. Members can manage
                  leads, their own tasks and notes.
                </p>
              </div>
            </>
          )}
          {page === "settings" && (
            <div className="settings-layout">
              <section className="panel settings-card">
                <h2>Workspace details</h2>
                <p className="muted">
                  These details are shared with your team.
                </p>
                <form
                  key={workspace.name}
                  onSubmit={(event) => {
                    event.preventDefault();
                    const form = new FormData(event.currentTarget);
                    run(
                      () =>
                        api("/workspace", "PATCH", { name: form.get("name") }),
                      "Workspace updated.",
                    );
                  }}
                >
                  <Field label="Workspace name">
                    <input
                      name="name"
                      defaultValue={workspace.name}
                      maxLength={80}
                      disabled={!isAdmin}
                      required
                    />
                  </Field>
                  <Field label="Currency">
                    <input
                      value="USD — United States Dollar"
                      disabled
                      readOnly
                    />
                  </Field>
                  <p className="muted small-text">
                    This portfolio MVP uses a single reporting currency.
                  </p>
                  {isAdmin && (
                    <button className="button primary" disabled={busy}>
                      Save changes
                    </button>
                  )}
                </form>
              </section>
              <section className="panel settings-card">
                <h2>Your account</h2>
                <div className="account-details">
                  <Avatar name={user.name} />
                  <div>
                    <strong>{user.name}</strong>
                    <span>{user.email}</span>
                  </div>
                </div>
                <div className="settings-row">
                  <span>Workspace role</span>
                  <strong>{user.role === "admin" ? "Admin" : "Member"}</strong>
                </div>
                <div className="settings-row">
                  <span>Data storage</span>
                  <strong>
                    {data.storage === "mongodb" ? "MongoDB" : "Local file demo"}
                  </strong>
                </div>
                <div className="settings-notice">
                  <Icon name="spark" />
                  <p>
                    Personal portfolio demo. Invite codes are shared manually;
                    subscriptions and email delivery are outside this MVP.
                  </p>
                </div>
                <button className="button secondary" onClick={logout}>
                  <Icon name="logout" size={17} />
                  Sign out
                </button>
              </section>
            </div>
          )}
          <footer className="app-footer">
            <span>
              ClientDesk<span className="logo-dot">.</span> A clearer way
              forward.
            </span>
            <span>Personal demo · React / Express / MongoDB / Node</span>
          </footer>
        </main>
      </div>
      {toast && (
        <div className="toast" role="status">
          <span>
            <Icon name="check" size={16} />
          </span>
          {toast}
        </div>
      )}
      {modal && (
        <div
          className="modal-backdrop"
          onClick={(event) => {
            if (event.target === event.currentTarget && !busy) {
              setModal(null);
              setError("");
            }
          }}
        >
          <section
            className="modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="modal-title"
          >
            <div className="modal-heading">
              <div>
                <span className="eyebrow">KEEP THE MOMENTUM</span>
                <h2 id="modal-title">
                  {modal.values.id ? "Edit" : "Add"}{" "}
                  {modal.type === "lead" ? "opportunity" : modal.type}
                </h2>
              </div>
              <button
                className="icon-button"
                aria-label="Close dialog"
                disabled={busy}
                onClick={() => {
                  setModal(null);
                  setError("");
                }}
              >
                <Icon name="close" />
              </button>
            </div>
            <form onSubmit={saveModal}>
              <div className="form-fields">
                {modal.type === "lead" && (
                  <>
                    <Field label="Contact name">
                      <input
                        autoFocus
                        value={modal.values.name}
                        onChange={updateModal("name")}
                        maxLength={120}
                        required
                      />
                    </Field>
                    <Field label="Company">
                      <input
                        value={modal.values.company}
                        onChange={updateModal("company")}
                        maxLength={120}
                        required
                      />
                    </Field>
                    <Field label="Email address" wide>
                      <input
                        type="email"
                        value={modal.values.email}
                        onChange={updateModal("email")}
                        maxLength={200}
                        required
                      />
                    </Field>
                    <Field label="Opportunity value (USD)">
                      <input
                        type="number"
                        min="0"
                        max="100000000"
                        step="0.01"
                        value={modal.values.value}
                        onChange={updateModal("value")}
                        required
                      />
                    </Field>
                    <Field label="Pipeline stage">
                      <select
                        value={modal.values.stage}
                        onChange={updateModal("stage")}
                      >
                        {STAGES.map((stage) => (
                          <option key={stage}>{stage}</option>
                        ))}
                      </select>
                    </Field>
                    <Field label="Lead source" wide>
                      <select
                        value={modal.values.source}
                        onChange={updateModal("source")}
                      >
                        {[
                          "Website",
                          "Referral",
                          "LinkedIn",
                          "Email",
                          "Other",
                        ].map((source) => (
                          <option key={source}>{source}</option>
                        ))}
                      </select>
                    </Field>
                  </>
                )}
                {modal.type === "client" && (
                  <>
                    <Field label="Company name">
                      <input
                        autoFocus
                        value={modal.values.name}
                        onChange={updateModal("name")}
                        maxLength={120}
                        required
                      />
                    </Field>
                    <Field label="Contact name">
                      <input
                        value={modal.values.contact}
                        onChange={updateModal("contact")}
                        maxLength={120}
                        required
                      />
                    </Field>
                    <Field label="Email address" wide>
                      <input
                        type="email"
                        value={modal.values.email}
                        onChange={updateModal("email")}
                        maxLength={200}
                        required
                      />
                    </Field>
                    <Field label="Industry">
                      <input
                        value={modal.values.industry}
                        onChange={updateModal("industry")}
                        maxLength={80}
                        required
                      />
                    </Field>
                    <Field label="Status">
                      <select
                        value={modal.values.status}
                        onChange={updateModal("status")}
                      >
                        {["Active", "Paused", "Archived"].map((status) => (
                          <option key={status}>{status}</option>
                        ))}
                      </select>
                    </Field>
                  </>
                )}
                {modal.type === "task" && (
                  <>
                    <Field label="Task title" wide>
                      <input
                        autoFocus
                        value={modal.values.title}
                        onChange={updateModal("title")}
                        maxLength={160}
                        required
                      />
                    </Field>
                    <Field label="Due date">
                      <input
                        type="date"
                        value={modal.values.due}
                        onChange={updateModal("due")}
                        required
                      />
                    </Field>
                    <Field label="Priority">
                      <select
                        value={modal.values.priority}
                        onChange={updateModal("priority")}
                      >
                        {["High", "Medium", "Low"].map((priority) => (
                          <option key={priority}>{priority}</option>
                        ))}
                      </select>
                    </Field>
                    <Field label="Assigned to" wide>
                      <select
                        value={modal.values.assignedTo}
                        onChange={updateModal("assignedTo")}
                        disabled={!isAdmin}
                      >
                        {team.map((member) => (
                          <option key={member.id} value={member.id}>
                            {member.name}
                          </option>
                        ))}
                      </select>
                    </Field>
                    <Field label="Status" wide>
                      <select
                        value={modal.values.status}
                        onChange={updateModal("status")}
                      >
                        <option value="todo">To do</option>
                        <option value="done">Completed</option>
                      </select>
                    </Field>
                  </>
                )}
              </div>
              {error && (
                <div className="alert error" role="alert">
                  {error}
                </div>
              )}
              <div className="modal-actions">
                {modal.type === "lead" && modal.values.id && isAdmin && (
                  <button
                    type="button"
                    className="button text-danger"
                    disabled={busy}
                    onClick={() => remove("leads", modal.values)}
                  >
                    <Icon name="trash" size={17} />
                    Delete
                  </button>
                )}
                <button
                  type="button"
                  className="button secondary"
                  disabled={busy}
                  onClick={() => {
                    setModal(null);
                    setError("");
                  }}
                >
                  Cancel
                </button>
                <button className="button primary" disabled={busy}>
                  {busy
                    ? "Saving…"
                    : modal.values.id
                      ? "Save changes"
                      : `Create ${modal.type}`}
                </button>
              </div>
            </form>
          </section>
        </div>
      )}
    </div>
  );
}

function LeadTable({ leads, edit }) {
  return (
    <div className="table-scroll">
      <table>
        <thead>
          <tr>
            <th>CONTACT / COMPANY</th>
            <th>OPPORTUNITY</th>
            <th>STAGE</th>
            <th>SOURCE</th>
            <th />
          </tr>
        </thead>
        <tbody>
          {leads.map((lead, index) => (
            <tr key={lead.id}>
              <td>
                <div className="name-cell">
                  <Avatar name={lead.name} color={index} />
                  <div className="contact-cell">
                    <strong>{lead.name}</strong>
                    <span>{lead.company}</span>
                  </div>
                </div>
              </td>
              <td>
                <strong className="table-value">{money(lead.value)}</strong>
              </td>
              <td>
                <span className={`stage-pill ${classStage(lead.stage)}`}>
                  <i className={`dot ${classStage(lead.stage)}`} />
                  {lead.stage}
                </span>
              </td>
              <td>{lead.source}</td>
              <td>
                <button
                  className="icon-button"
                  aria-label={`Edit ${lead.company}`}
                  onClick={() => edit(lead)}
                >
                  <Icon name="arrow" size={17} />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

createRoot(document.getElementById("root")).render(<App />);
