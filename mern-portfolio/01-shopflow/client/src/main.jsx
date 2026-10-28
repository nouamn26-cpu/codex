import React, { useEffect, useMemo, useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import { Icon, ProductArt, HeroArt } from "./art.jsx";
import "./styles.css";

// Checkout IDs identify browser retries; they are not authentication secrets.
// randomUUID requires a secure origin, while getRandomValues also works on LAN HTTP.
function makeCheckoutKey() {
  if (globalThis.crypto?.randomUUID) return globalThis.crypto.randomUUID();
  if (globalThis.crypto?.getRandomValues) {
    const bytes = new Uint8Array(16);
    globalThis.crypto.getRandomValues(bytes);
    return `sf-${Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("")}`;
  }
  return `sf-${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}-${Math.random().toString(36).slice(2)}`;
}
const money = (cents) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: cents % 100 === 0 ? 0 : 2,
  }).format(cents / 100);
const getSaved = (key, fallback) => {
  try {
    return JSON.parse(localStorage.getItem(key)) ?? fallback;
  } catch {
    return fallback;
  }
};
async function api(path, { method = "GET", body, token } = {}) {
  const response = await fetch(`/api${path}`, {
    method,
    headers: {
      ...(body ? { "Content-Type": "application/json" } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
  const data = await response
    .json()
    .catch(() => ({ error: "The server did not return a valid response." }));
  if (!response.ok) throw new Error(data.error || "Request failed.");
  return data;
}
const categoryNames = [
  "All products",
  "Keyboards",
  "Desk essentials",
  "Audio",
  "Lighting",
];
const infoContent = {
  story: {
    title: "Good work starts with a little space.",
    body: "ShopFlow is a personal MERN portfolio project built around a simple idea: everyday tools should look good, feel good, and get out of your way. Browse our fictional collection of thoughtfully designed workspace essentials. The catalogue, inventory, accounts, and orders are backed by a working Express API.",
    sub: "This is a demo store. Products, shipping, and payments are simulated. No real purchases are made.",
  },
  shipping: {
    title: "A simpler kind of shipping.",
    body: "In this demo, standard shipping is $7.50, and orders of $150 or more ship free. Totals are calculated on the server. Place a simulated order to try the complete flow, then open My orders to track its status.",
    sub: "No packages are dispatched. Shipping status is updated manually in the admin dashboard.",
  },
  returns: {
    title: "Room to change your mind.",
    body: "A newly placed demo order can be cancelled from My orders, and its stock is automatically restored. After processing starts, only an administrator can cancel it. Shipped and delivered orders are final in this MVP.",
    sub: "No real refunds are processed because no real payments are taken.",
  },
  guide: {
    title: "A real app. A demo shop.",
    body: "Try a customer account to place an order, then switch to an admin account to manage inventory and fulfillment. Data persists in a local JSON file by default. Add a MongoDB Atlas connection string to use the full MERN database adapter.",
    sub: "Demo password: Demo12345! · Customer: customer@shopflow.demo · Admin: admin@shopflow.demo. Production requires a strong JWT secret and MongoDB.",
  },
};

function Modal({ title, onClose, children, wide = false, drawer = false }) {
  const element = useRef(null);
  useEffect(() => {
    const previous = document.activeElement;
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const focusable = () => [
      ...(element.current?.querySelectorAll(
        'button:not(:disabled), input, select, textarea, a[href], [tabindex="0"]',
      ) || []),
    ];
    focusable()[0]?.focus();
    function keydown(event) {
      if (event.key === "Escape") onClose();
      if (event.key !== "Tab") return;
      const nodes = focusable();
      if (!nodes.length) return;
      if (event.shiftKey && document.activeElement === nodes[0]) {
        event.preventDefault();
        nodes.at(-1).focus();
      } else if (!event.shiftKey && document.activeElement === nodes.at(-1)) {
        event.preventDefault();
        nodes[0].focus();
      }
    }
    document.addEventListener("keydown", keydown);
    return () => {
      document.body.style.overflow = overflow;
      document.removeEventListener("keydown", keydown);
      previous?.focus?.();
    };
  }, []);
  return (
    <div
      className={`overlay ${drawer ? "drawer-overlay" : ""}`}
      onMouseDown={(event) => event.target === event.currentTarget && onClose()}
    >
      <section
        ref={element}
        className={`modal ${wide ? "wide" : ""} ${drawer ? "drawer" : ""}`}
        role="dialog"
        aria-modal="true"
        aria-label={title}
      >
        <div className="modal-heading">
          <h2>{title}</h2>
          <button
            className="icon-button"
            onClick={onClose}
            aria-label="Close dialog"
          >
            <Icon name="close" />
          </button>
        </div>
        {children}
      </section>
    </div>
  );
}
function Field({ label, children }) {
  return (
    <label className="field">
      <span>{label}</span>
      {children}
    </label>
  );
}
function Empty({ icon = "box", title, body, children }) {
  return (
    <div className="empty">
      <span className="empty-icon">
        <Icon name={icon} size={28} />
      </span>
      <h3>{title}</h3>
      <p>{body}</p>
      {children}
    </div>
  );
}
function Quantity({ quantity, onChange, max = 10 }) {
  return (
    <div className="quantity">
      <button
        onClick={() => onChange(quantity - 1)}
        aria-label="Decrease quantity"
        disabled={quantity <= 1}
      >
        <Icon name="minus" size={14} />
      </button>
      <span>{quantity}</span>
      <button
        onClick={() => onChange(quantity + 1)}
        aria-label="Increase quantity"
        disabled={quantity >= max}
      >
        <Icon name="plus" size={14} />
      </button>
    </div>
  );
}

function App() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [token, setToken] = useState(() => getSaved("sf-token", ""));
  const [user, setUser] = useState(null);
  const [demoAccounts, setDemoAccounts] = useState(false);
  const [view, setView] = useState(() =>
    ["orders", "admin"].includes(location.hash.slice(1))
      ? location.hash.slice(1)
      : "shop",
  );
  const [category, setCategory] = useState("All products");
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState("featured");
  const [maxPrice, setMaxPrice] = useState(200);
  const [cart, setCart] = useState(() => getSaved("sf-cart", []));
  const [cartOpen, setCartOpen] = useState(false);
  const [dialog, setDialog] = useState(null);
  const [afterAuth, setAfterAuth] = useState(null);
  const [toast, setToast] = useState("");
  const [orders, setOrders] = useState([]);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [ordersError, setOrdersError] = useState("");
  const [adminProducts, setAdminProducts] = useState([]);
  const [adminOrders, setAdminOrders] = useState([]);
  const [adminTab, setAdminTab] = useState("products");
  const [adminError, setAdminError] = useState("");
  const [adminLoading, setAdminLoading] = useState(false);
  const count = cart.reduce((sum, item) => sum + item.quantity, 0);
  const subtotal = cart.reduce(
    (sum, item) => sum + item.priceCents * item.quantity,
    0,
  );
  const notify = (message) => setToast(message);
  const navigate = (next) => {
    location.hash = next === "shop" ? "" : next;
    setView(next);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };
  const refreshProducts = async () => {
    const data = await api("/products");
    setProducts(data.products);
  };
  const load = async () => {
    setLoading(true);
    setLoadError("");
    try {
      const [catalog, config] = await Promise.all([
        api("/products"),
        api("/config"),
      ]);
      setProducts(catalog.products);
      setDemoAccounts(config.demoAccounts);
    } catch (error) {
      setLoadError(error.message);
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    load();
    const handleHash = () =>
      setView(
        ["orders", "admin"].includes(location.hash.slice(1))
          ? location.hash.slice(1)
          : "shop",
      );
    window.addEventListener("hashchange", handleHash);
    return () => window.removeEventListener("hashchange", handleHash);
  }, []);
  useEffect(() => {
    localStorage.setItem("sf-cart", JSON.stringify(cart));
  }, [cart]);
  useEffect(() => {
    localStorage.setItem("sf-token", JSON.stringify(token));
    if (!token) {
      setUser(null);
      return;
    }
    api("/auth/me", { token })
      .then((data) => setUser(data.user))
      .catch(() => {
        setToken("");
        setUser(null);
      });
  }, [token]);
  useEffect(() => {
    if (toast) {
      const timeout = setTimeout(() => setToast(""), 4500);
      return () => clearTimeout(timeout);
    }
  }, [toast]);
  const loadOrders = async () => {
    setOrdersLoading(true);
    setOrdersError("");
    try {
      setOrders((await api("/orders", { token })).orders);
    } catch (error) {
      setOrdersError(error.message);
    } finally {
      setOrdersLoading(false);
    }
  };
  const loadAdmin = async () => {
    setAdminLoading(true);
    setAdminError("");
    try {
      const [catalog, history] = await Promise.all([
        api("/admin/products", { token }),
        api("/admin/orders", { token }),
      ]);
      setAdminProducts(catalog.products);
      setAdminOrders(history.orders);
    } catch (error) {
      setAdminError(error.message);
    } finally {
      setAdminLoading(false);
    }
  };
  useEffect(() => {
    if (view === "orders" && user) loadOrders();
    if (view === "admin" && user?.role === "admin") loadAdmin();
  }, [view, user?._id]);
  const shownProducts = useMemo(() => {
    const result = products.filter(
      (product) =>
        (category === "All products" || product.category === category) &&
        `${product.name} ${product.description}`
          .toLowerCase()
          .includes(search.toLowerCase()) &&
        product.priceCents <= maxPrice * 100,
    );
    if (sort === "low") result.sort((a, b) => a.priceCents - b.priceCents);
    if (sort === "high") result.sort((a, b) => b.priceCents - a.priceCents);
    if (sort === "name") result.sort((a, b) => a.name.localeCompare(b.name));
    return result;
  }, [products, category, search, sort, maxPrice]);
  const browse = (nextCategory = "All products") => {
    navigate("shop");
    setCategory(nextCategory);
    setSearch("");
    setMaxPrice(200);
    setTimeout(
      () =>
        document
          .getElementById("catalog")
          ?.scrollIntoView({ behavior: "smooth" }),
      70,
    );
  };
  const addToCart = (product, variant, quantity = 1) => {
    const key = `${product._id}:${variant.id}`;
    const existing = cart.find((item) => item.key === key);
    const nextQuantity = (existing?.quantity || 0) + quantity;
    if (nextQuantity > Math.min(variant.stock, 10)) {
      notify("You have reached the available quantity for this variant.");
      return false;
    }
    setCart((previous) =>
      existing
        ? previous.map((item) =>
            item.key === key ? { ...item, quantity: nextQuantity } : item,
          )
        : [
            ...previous,
            {
              key,
              productId: product._id,
              variantId: variant.id,
              variantLabel: variant.label,
              name: product.name,
              priceCents: product.priceCents,
              quantity,
              art: product.art,
              color: product.color,
              stock: variant.stock,
            },
          ],
    );
    notify(`${product.name} added to your bag.`);
    return true;
  };
  const checkout = () => {
    setCartOpen(false);
    if (!user) {
      setAfterAuth("checkout");
      setDialog({ type: "auth" });
    } else setDialog({ type: "checkout" });
  };
  const signedIn = ({ user: nextUser, token: nextToken }) => {
    setUser(nextUser);
    setToken(nextToken);
    if (afterAuth === "checkout") setDialog({ type: "checkout" });
    else setDialog(null);
    setAfterAuth(null);
    notify(
      `Welcome${nextUser.name ? `, ${nextUser.name.split(" ")[0]}` : ""}.`,
    );
  };
  const logout = () => {
    setToken("");
    setUser(null);
    setOrders([]);
    setAdminProducts([]);
    setAdminOrders([]);
    navigate("shop");
    notify("You have signed out.");
  };
  const closeDialog = () => {
    setDialog(null);
    setAfterAuth(null);
  };
  const cancelOrder = async (id) => {
    try {
      await api(`/orders/${id}/cancel`, { token, method: "POST" });
      await Promise.all([loadOrders(), refreshProducts()]);
      notify("Order cancelled. Stock has been restored.");
    } catch (error) {
      notify(error.message);
    }
  };
  const updateStatus = async (id, status) => {
    try {
      await api(`/admin/orders/${id}`, {
        token,
        method: "PATCH",
        body: { status },
      });
      await Promise.all([loadAdmin(), refreshProducts()]);
      notify("Order status updated.");
    } catch (error) {
      notify(error.message);
    }
  };
  const quickAdd = (product) => {
    const variant = product.variants.find((v) => v.stock > 0);
    if (variant) addToCart(product, variant);
  };
  return (
    <>
      <div className="announcement">
        <span>A little upgrade goes a long way.</span>
        <span>
          Free demo shipping on orders $150+ <Icon name="arrow" size={14} />
        </span>
        <span className="demo-label">Portfolio demo · No real purchases</span>
      </div>
      <header className="site-header">
        <div className="header-inner">
          <button
            className="brand"
            onClick={() => navigate("shop")}
            aria-label="ShopFlow home"
          >
            <span className="brand-mark">
              sf<span>✳</span>
            </span>
            <span>
              shopflow<span className="brand-dot">.</span>
            </span>
          </button>
          <nav aria-label="Main navigation">
            <button
              className={view === "shop" ? "nav-link active" : "nav-link"}
              onClick={() => browse()}
            >
              Shop all
            </button>
            <button
              className="nav-link"
              onClick={() => browse("Desk essentials")}
            >
              Desk essentials
            </button>
            <button
              className="nav-link"
              onClick={() => setDialog({ type: "info", key: "story" })}
            >
              Our story
            </button>
          </nav>
          <div className="header-actions">
            {user ? (
              <>
                <button
                  className={`icon-button account-button ${view === "orders" ? "selected" : ""}`}
                  onClick={() => navigate("orders")}
                  aria-label="My orders"
                >
                  <Icon name="user" />
                  <span>{user.name.split(" ")[0]}</span>
                </button>
                {user.role === "admin" && (
                  <button
                    className="admin-link"
                    onClick={() => navigate("admin")}
                  >
                    Admin
                  </button>
                )}
                <button
                  className="icon-button logout-button"
                  onClick={logout}
                  aria-label="Sign out"
                >
                  <Icon name="logout" size={18} />
                </button>
              </>
            ) : (
              <button
                className="icon-button account-button"
                onClick={() => setDialog({ type: "auth" })}
              >
                <Icon name="user" />
                <span>Sign in</span>
              </button>
            )}
            <button
              className="bag-button"
              onClick={() => setCartOpen(true)}
              aria-label={`Open shopping bag, ${count} items`}
            >
              <Icon name="bag" />
              <span className="bag-label">Bag</span>
              <span className="bag-count">{count}</span>
            </button>
          </div>
        </div>
      </header>
      <main>
        {view === "shop" && (
          <>
            <section className="hero page-width">
              <div className="hero-copy">
                <p className="eyebrow">
                  <span /> GOOD TOOLS. BETTER DAYS.
                </p>
                <h1>
                  Make room for
                  <br />
                  better <span>work.</span>
                </h1>
                <p className="hero-description">
                  Thoughtful essentials for the space
                  <br className="desktop-break" /> where your best ideas happen.
                </p>
                <button className="button dark" onClick={() => browse()}>
                  Explore the collection <Icon name="arrow" size={18} />
                </button>
                <div className="hero-note">
                  <span className="tiny-spark">✳</span> Designed for everyday.
                  Made to stay.
                </div>
              </div>
              <div className="hero-visual">
                <HeroArt />
                <div className="hero-tag">
                  <span className="tag-dot" />
                  <span>YOUR NEXT FAVORITE WORKSPACE</span>
                </div>
                <button
                  className="hero-product"
                  onClick={() =>
                    setDialog({
                      type: "product",
                      product:
                        products.find((p) => p._id === "keyboard") ||
                        products[0],
                    })
                  }
                  disabled={!products.length}
                >
                  <span>
                    <small>THE STUDIO COLLECTION</small>
                    <strong>Less clutter. More clarity.</strong>
                  </span>
                  <span className="circle-arrow">
                    <Icon name="arrow" size={20} />
                  </span>
                </button>
              </div>
            </section>
            <section className="benefits page-width" aria-label="Store values">
              <div>
                <Icon name="truck" size={24} />
                <span>
                  <strong>A little something, on us</strong>
                  <small>Free demo shipping over $150</small>
                </span>
              </div>
              <div>
                <Icon name="leaf" size={24} />
                <span>
                  <strong>Thoughtfully put together</strong>
                  <small>Useful things. Considered design.</small>
                </span>
              </div>
              <div>
                <Icon name="box" size={24} />
                <span>
                  <strong>Find your everyday favorite</strong>
                  <small>Workspace essentials, all in one place</small>
                </span>
              </div>
            </section>
            <section id="catalog" className="catalog page-width">
              <div className="section-top">
                <div>
                  <p className="eyebrow">THE EVERYDAY EDIT</p>
                  <h2>
                    Small upgrades.
                    <br className="mobile-break" /> Big difference.
                  </h2>
                </div>
                <p>
                  A good day starts with a good setup.
                  <br />
                  Find the pieces that feel like you.
                </p>
              </div>
              <div className="catalog-toolbar">
                <div
                  className="category-tabs"
                  role="group"
                  aria-label="Filter by category"
                >
                  {categoryNames.map((name) => (
                    <button
                      key={name}
                      onClick={() => setCategory(name)}
                      className={
                        category === name
                          ? "category-tab active"
                          : "category-tab"
                      }
                    >
                      {name}
                    </button>
                  ))}
                </div>
                <label className="search-field">
                  <Icon name="search" size={17} />
                  <input
                    placeholder="Find your next favorite"
                    aria-label="Search products"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                  />
                  {search && (
                    <button
                      aria-label="Clear search"
                      onClick={() => setSearch("")}
                    >
                      <Icon name="close" size={14} />
                    </button>
                  )}
                </label>
              </div>
              <div className="results-toolbar">
                <span>
                  {loading
                    ? "Loading collection…"
                    : `${shownProducts.length} considered essentials`}
                </span>
                <div className="sort-controls">
                  <label className="price-control">
                    Up to ${maxPrice}
                    <input
                      type="range"
                      min="30"
                      max="200"
                      step="10"
                      value={maxPrice}
                      aria-label="Maximum price in dollars"
                      onChange={(e) => setMaxPrice(Number(e.target.value))}
                    />
                  </label>
                  <label className="sort-label">
                    Sort by{" "}
                    <select
                      value={sort}
                      onChange={(e) => setSort(e.target.value)}
                      aria-label="Sort products"
                    >
                      <option value="featured">Featured</option>
                      <option value="low">Price: low to high</option>
                      <option value="high">Price: high to low</option>
                      <option value="name">Name: A to Z</option>
                    </select>
                  </label>
                </div>
              </div>
              {loadError ? (
                <Empty title="We couldn't load the collection" body={loadError}>
                  <button className="button dark" onClick={load}>
                    Try again
                  </button>
                </Empty>
              ) : loading ? (
                <div className="product-list">
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="product-card skeleton">
                      <div />
                      <span />
                      <span />
                    </div>
                  ))}
                </div>
              ) : shownProducts.length ? (
                <div className="product-list">
                  {shownProducts.map((product) => {
                    const inStock = product.variants.some(
                      (variant) => variant.stock > 0,
                    );
                    return (
                      <article key={product._id} className="product-card">
                        <div
                          className="product-visual"
                          style={{ backgroundColor: product.color }}
                        >
                          <button
                            className="art-button"
                            onClick={() =>
                              setDialog({ type: "product", product })
                            }
                            aria-label={`View ${product.name}`}
                          >
                            <ProductArt
                              art={product.art}
                              color={product.color}
                              name={product.name}
                            />
                          </button>
                          {product.badge && (
                            <span
                              className={`product-badge ${product.badge === "New arrival" ? "orange" : ""}`}
                            >
                              {product.badge}
                            </span>
                          )}
                          <button
                            className="quick-add"
                            onClick={() => quickAdd(product)}
                            disabled={!inStock}
                            aria-label={`Add ${product.name} to bag`}
                          >
                            <Icon name="plus" size={20} />
                          </button>
                        </div>
                        <div className="product-caption">
                          <div>
                            <p className="product-category">
                              {product.category}
                            </p>
                            <button
                              className="product-name"
                              onClick={() =>
                                setDialog({ type: "product", product })
                              }
                            >
                              {product.name}
                            </button>
                          </div>
                          <span className="product-price">
                            {money(product.priceCents)}
                          </span>
                        </div>
                        <div className="product-meta">
                          <span>
                            {inStock
                              ? `${product.variants.length} ${product.variants.length === 1 ? "finish" : "finishes"} available`
                              : "Currently sold out"}
                          </span>
                          <div className="swatches">
                            {product.variants.map((variant, i) => (
                              <span
                                title={variant.label}
                                key={variant.id}
                                style={{
                                  backgroundColor: [
                                    "#a5b19d",
                                    "#e8dfcf",
                                    "#565a53",
                                  ][i % 3],
                                }}
                              />
                            ))}
                          </div>
                        </div>
                      </article>
                    );
                  })}
                </div>
              ) : (
                <Empty
                  icon="search"
                  title="A little too specific?"
                  body="Try another search, category, or price range."
                >
                  <button
                    className="button outline"
                    onClick={() => {
                      setCategory("All products");
                      setSearch("");
                      setMaxPrice(200);
                    }}
                  >
                    Reset filters
                  </button>
                </Empty>
              )}
            </section>
            <section className="story-strip page-width">
              <span className="story-symbol">✳</span>
              <div>
                <p className="eyebrow">LESS, BUT BETTER.</p>
                <h2>A workspace that works for you.</h2>
                <p>Good design is in the details. So is a good day.</p>
              </div>
              <button
                className="button outline"
                onClick={() => setDialog({ type: "info", key: "story" })}
              >
                Meet ShopFlow <Icon name="arrow" size={18} />
              </button>
            </section>
          </>
        )}
        {view === "orders" && (
          <section className="page-width account-page">
            <p className="eyebrow">YOUR SHOPFLOW</p>
            <div className="page-heading">
              <div>
                <h1>
                  My orders<span>.</span>
                </h1>
                <p>A home for your everyday upgrades.</p>
              </div>
              <button className="button outline" onClick={() => browse()}>
                Keep exploring <Icon name="arrow" size={18} />
              </button>
            </div>
            {!user ? (
              <Empty
                icon="user"
                title="Your orders are waiting"
                body="Sign in to see your order history and track your latest upgrades."
              >
                <button
                  className="button dark"
                  onClick={() => setDialog({ type: "auth" })}
                >
                  Sign in
                </button>
              </Empty>
            ) : ordersLoading ? (
              <p className="loading-line">Finding your orders…</p>
            ) : ordersError ? (
              <Empty title="Couldn't load your orders" body={ordersError}>
                <button className="button outline" onClick={loadOrders}>
                  Try again
                </button>
              </Empty>
            ) : !orders.length ? (
              <Empty
                title="Your first favorite is out there"
                body="Your orders will appear here after you complete a simulated checkout."
              >
                <button className="button dark" onClick={() => browse()}>
                  Explore the collection
                </button>
              </Empty>
            ) : (
              <div className="order-list">
                {orders.map((order) => (
                  <OrderCard
                    key={order._id}
                    order={order}
                    onCancel={cancelOrder}
                  />
                ))}
              </div>
            )}
          </section>
        )}
        {view === "admin" && (
          <section className="page-width account-page">
            <p className="eyebrow">BEHIND THE COUNTER</p>
            <div className="page-heading">
              <div>
                <h1>
                  Store overview<span>.</span>
                </h1>
                <p>A little care keeps everything flowing.</p>
              </div>
              {user?.role === "admin" && (
                <button
                  className="button dark"
                  onClick={() => setDialog({ type: "editProduct" })}
                >
                  <Icon name="plus" size={17} /> Add product
                </button>
              )}
            </div>
            {user?.role !== "admin" ? (
              <Empty
                icon="lock"
                title="Admin space"
                body="Sign in with an admin account to manage the store."
              >
                <button
                  className="button dark"
                  onClick={() => setDialog({ type: "auth" })}
                >
                  Sign in
                </button>
              </Empty>
            ) : (
              <>
                <div className="stat-row">
                  <div>
                    <span>Active products</span>
                    <strong>
                      {adminProducts.filter((p) => p.active).length}
                    </strong>
                    <small>In your storefront</small>
                  </div>
                  <div>
                    <span>Open orders</span>
                    <strong>
                      {
                        adminOrders.filter((o) =>
                          ["placed", "processing", "shipped"].includes(
                            o.status,
                          ),
                        ).length
                      }
                    </strong>
                    <small>Ready for your attention</small>
                  </div>
                  <div>
                    <span>Demo order value</span>
                    <strong>
                      {money(
                        adminOrders
                          .filter((o) => o.status !== "cancelled")
                          .reduce((sum, o) => sum + o.totalCents, 0),
                      )}
                    </strong>
                    <small>Simulated · no real revenue</small>
                  </div>
                  <div>
                    <span>Low-stock variants</span>
                    <strong>
                      {
                        adminProducts
                          .flatMap((p) => p.variants)
                          .filter((v) => v.stock <= 5).length
                      }
                    </strong>
                    <small>5 units or fewer</small>
                  </div>
                </div>
                <div className="admin-tabs">
                  <button
                    className={adminTab === "products" ? "active" : ""}
                    onClick={() => setAdminTab("products")}
                  >
                    Products & inventory
                  </button>
                  <button
                    className={adminTab === "orders" ? "active" : ""}
                    onClick={() => setAdminTab("orders")}
                  >
                    Orders <span>{adminOrders.length}</span>
                  </button>
                  <button className="refresh-link" onClick={loadAdmin}>
                    Refresh
                  </button>
                </div>
                {adminLoading ? (
                  <p className="loading-line">Loading your store…</p>
                ) : adminError ? (
                  <Empty title="Couldn't load store data" body={adminError}>
                    <button className="button outline" onClick={loadAdmin}>
                      Try again
                    </button>
                  </Empty>
                ) : adminTab === "products" ? (
                  <div className="admin-table-wrap">
                    <table className="admin-table">
                      <thead>
                        <tr>
                          <th>Product</th>
                          <th>Price</th>
                          <th>Inventory</th>
                          <th>Visibility</th>
                          <th>
                            <span className="sr-only">Actions</span>
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {adminProducts.map((product) => (
                          <tr key={product._id}>
                            <td>
                              <div className="table-product">
                                <div style={{ background: product.color }}>
                                  <ProductArt art={product.art} />
                                </div>
                                <span>
                                  <strong>{product.name}</strong>
                                  <small>{product.category}</small>
                                </span>
                              </div>
                            </td>
                            <td>{money(product.priceCents)}</td>
                            <td>
                              <strong>
                                {product.variants.reduce(
                                  (sum, v) => sum + v.stock,
                                  0,
                                )}{" "}
                                units
                              </strong>
                              <small>
                                {product.variants
                                  .map((v) => `${v.label}: ${v.stock}`)
                                  .join(" · ")}
                              </small>
                            </td>
                            <td>
                              <span
                                className={`status ${product.active ? "delivered" : "cancelled"}`}
                              >
                                {product.active ? "Active" : "Archived"}
                              </span>
                            </td>
                            <td>
                              <button
                                className="button small outline"
                                onClick={() =>
                                  setDialog({ type: "editProduct", product })
                                }
                              >
                                <Icon name="edit" size={14} /> Edit
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    {!adminProducts.length && (
                      <Empty
                        title="Start your collection"
                        body="Add your first product to open the storefront."
                      />
                    )}
                  </div>
                ) : adminOrders.length ? (
                  <div className="order-list">
                    {adminOrders.map((order) => (
                      <OrderCard
                        key={order._id}
                        order={order}
                        admin
                        onStatus={updateStatus}
                      />
                    ))}
                  </div>
                ) : (
                  <Empty
                    title="All quiet at the counter"
                    body="Orders will appear here when a customer completes the demo checkout."
                  />
                )}
              </>
            )}
          </section>
        )}
      </main>
      <footer className="site-footer page-width">
        <div className="footer-top">
          <button className="brand" onClick={() => navigate("shop")}>
            <span className="brand-mark">
              sf<span>✳</span>
            </span>
            <span>shopflow.</span>
          </button>
          <p>
            Good things for
            <br />
            your everyday space.
          </p>
          <div className="footer-links">
            <button
              onClick={() => setDialog({ type: "info", key: "shipping" })}
            >
              Shipping
            </button>
            <button onClick={() => setDialog({ type: "info", key: "returns" })}>
              Returns & cancellations
            </button>
            <button onClick={() => setDialog({ type: "info", key: "guide" })}>
              About this demo
            </button>
          </div>
        </div>
        <div className="footer-bottom">
          <span>
            © {new Date().getFullYear()} ShopFlow. A personal portfolio project.
          </span>
          <span>
            Built with care. Powered by MERN.{" "}
            <span className="tiny-spark">✳</span>
          </span>
        </div>
      </footer>
      {toast && (
        <div className="toast" role="status">
          <Icon name="check" size={18} />
          {toast}
          <button
            onClick={() => setToast("")}
            aria-label="Dismiss notification"
          >
            <Icon name="close" size={15} />
          </button>
        </div>
      )}
      {cartOpen && (
        <Modal
          title={`Your bag (${count})`}
          onClose={() => setCartOpen(false)}
          drawer
        >
          {!cart.length ? (
            <Empty
              icon="bag"
              title="Room for something good"
              body="Your everyday favorites will look great in here."
            >
              <button
                className="button dark"
                onClick={() => {
                  setCartOpen(false);
                  browse();
                }}
              >
                Explore the collection
              </button>
            </Empty>
          ) : (
            <>
              <div className="cart-shipping">
                <Icon name="truck" size={19} />
                <span>
                  {subtotal >= 15000
                    ? "Your demo order qualifies for free shipping."
                    : `You're ${money(15000 - subtotal)} away from free demo shipping.`}
                </span>
                <div className="shipping-progress">
                  <i
                    style={{
                      width: `${Math.min((subtotal / 15000) * 100, 100)}%`,
                    }}
                  />
                </div>
              </div>
              <div className="cart-items">
                {cart.map((item) => (
                  <div className="cart-item" key={item.key}>
                    <div
                      className="cart-art"
                      style={{ background: item.color }}
                    >
                      <ProductArt art={item.art} />
                    </div>
                    <div className="cart-item-info">
                      <strong>{item.name}</strong>
                      <small>
                        {item.variantLabel} · {money(item.priceCents)}
                      </small>
                      <Quantity
                        quantity={item.quantity}
                        max={Math.min(10, item.stock || 10)}
                        onChange={(quantity) =>
                          setCart((previous) =>
                            previous.map((line) =>
                              line.key === item.key
                                ? { ...line, quantity }
                                : line,
                            ),
                          )
                        }
                      />
                    </div>
                    <div className="cart-item-end">
                      <span>{money(item.priceCents * item.quantity)}</span>
                      <button
                        onClick={() =>
                          setCart((previous) =>
                            previous.filter((line) => line.key !== item.key),
                          )
                        }
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                ))}
              </div>
              <div className="cart-summary">
                <div>
                  <span>Subtotal</span>
                  <strong>{money(subtotal)}</strong>
                </div>
                <small>
                  Shipping calculated at checkout. All payments are simulated.
                </small>
                <button className="button dark full" onClick={checkout}>
                  Demo checkout <Icon name="arrow" size={18} />
                </button>
                <button
                  className="text-button"
                  onClick={() => setCartOpen(false)}
                >
                  Continue exploring
                </button>
              </div>
            </>
          )}
        </Modal>
      )}
      {dialog?.type === "product" && dialog.product && (
        <ProductDetail
          product={dialog.product}
          onClose={closeDialog}
          onAdd={(product, variant, quantity) => {
            if (addToCart(product, variant, quantity)) {
              setDialog(null);
              setCartOpen(true);
            }
          }}
        />
      )}
      {dialog?.type === "auth" && (
        <AuthDialog
          onClose={closeDialog}
          onSuccess={signedIn}
          demoAccounts={demoAccounts}
        />
      )}
      {dialog?.type === "info" && (
        <Modal title={infoContent[dialog.key].title} onClose={closeDialog}>
          <div className="info-body">
            <p>{infoContent[dialog.key].body}</p>
            <div className="notice">{infoContent[dialog.key].sub}</div>
            <button className="button dark" onClick={closeDialog}>
              Got it <Icon name="check" size={17} />
            </button>
          </div>
        </Modal>
      )}
      {dialog?.type === "checkout" && (
        <Checkout
          cart={cart}
          user={user}
          token={token}
          onClose={closeDialog}
          onSuccess={async (order) => {
            setCart([]);
            setDialog({ type: "success", order });
            try {
              await refreshProducts();
            } catch {}
            if (view === "orders") loadOrders();
          }}
        />
      )}
      {dialog?.type === "success" && (
        <Modal title="A good choice, well made." onClose={closeDialog}>
          <div className="success-body">
            <span className="success-icon">
              <Icon name="check" size={36} />
            </span>
            <h3>Your demo order is in.</h3>
            <p>
              Order <strong>{dialog.order.number}</strong>
            </p>
            <div className="notice">
              This was a simulated purchase. You have not been charged, and no
              physical items will be shipped.
            </div>
            <button
              className="button dark full"
              onClick={() => {
                closeDialog();
                navigate("orders");
              }}
            >
              View my orders <Icon name="arrow" size={18} />
            </button>
          </div>
        </Modal>
      )}
      {dialog?.type === "editProduct" && (
        <ProductEditor
          product={dialog.product}
          token={token}
          onClose={closeDialog}
          onSuccess={async () => {
            closeDialog();
            await Promise.all([loadAdmin(), refreshProducts()]);
            notify("Product saved. Your storefront is up to date.");
          }}
        />
      )}
    </>
  );
}

function ProductDetail({ product, onClose, onAdd }) {
  const [variantId, setVariantId] = useState(
    product.variants.find((v) => v.stock > 0)?.id || product.variants[0].id,
  );
  const [quantity, setQuantity] = useState(1);
  const variant = product.variants.find((v) => v.id === variantId);
  return (
    <Modal title="A closer look" onClose={onClose} wide>
      <div className="detail-layout">
        <div className="detail-art" style={{ background: product.color }}>
          <ProductArt art={product.art} name={product.name} />
          {product.badge && (
            <span className="product-badge">{product.badge}</span>
          )}
        </div>
        <div className="detail-info">
          <p className="eyebrow">{product.category}</p>
          <h2>{product.name}</h2>
          <p className="detail-price">{money(product.priceCents)}</p>
          <p className="detail-description">{product.description}</p>
          <p className="variant-label">
            Finish: <strong>{variant.label}</strong>
          </p>
          <div className="variant-options">
            {product.variants.map((v) => (
              <button
                key={v.id}
                className={v.id === variantId ? "selected" : ""}
                disabled={!v.stock}
                onClick={() => {
                  setVariantId(v.id);
                  setQuantity(1);
                }}
              >
                {v.label}
                {!v.stock ? " · sold out" : ""}
              </button>
            ))}
          </div>
          <p className="stock-note">
            <span />
            {variant.stock > 0
              ? `${variant.stock} in stock · Ready for your demo order`
              : "Currently sold out"}
          </p>
          <div className="detail-add">
            <Quantity
              quantity={quantity}
              max={Math.min(variant.stock, 10)}
              onChange={setQuantity}
            />
            <button
              className="button dark"
              disabled={!variant.stock}
              onClick={() => onAdd(product, variant, quantity)}
            >
              Add to bag <Icon name="plus" size={18} />
            </button>
          </div>
          <div className="detail-notes">
            <span>
              <Icon name="truck" size={18} /> Free demo shipping over $150
            </span>
            <span>
              <Icon name="shield" size={18} /> Simulated checkout · no charge
            </span>
          </div>
        </div>
      </div>
    </Modal>
  );
}
function AuthDialog({ onClose, onSuccess, demoAccounts }) {
  const [mode, setMode] = useState("login");
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const update = (key) => (event) =>
    setForm({ ...form, [key]: event.target.value });
  async function submit(event) {
    event.preventDefault();
    setPending(true);
    setError("");
    try {
      onSuccess(await api(`/auth/${mode}`, { method: "POST", body: form }));
    } catch (error) {
      setError(error.message);
    } finally {
      setPending(false);
    }
  }
  return (
    <Modal
      title={mode === "login" ? "Welcome back." : "Make yourself at home."}
      onClose={onClose}
    >
      <form className="form-body" onSubmit={submit}>
        <p className="muted">
          {mode === "login"
            ? "Your everyday favorites are waiting."
            : "Create an account to try the complete shopping experience."}
        </p>
        {mode === "register" && (
          <Field label="Your name">
            <input
              required
              minLength="2"
              maxLength="70"
              value={form.name}
              onChange={update("name")}
              autoComplete="name"
              placeholder="Alex Morgan"
            />
          </Field>
        )}
        <Field label="Email address">
          <input
            type="email"
            required
            maxLength="254"
            value={form.email}
            onChange={update("email")}
            autoComplete="email"
            placeholder="you@example.com"
          />
        </Field>
        <Field label="Password">
          <input
            type="password"
            required
            minLength={mode === "register" ? 10 : 1}
            maxLength="128"
            value={form.password}
            onChange={update("password")}
            autoComplete={
              mode === "login" ? "current-password" : "new-password"
            }
            placeholder={
              mode === "register" ? "At least 10 characters" : "Your password"
            }
          />
        </Field>
        {error && (
          <p className="form-error" role="alert">
            {error}
          </p>
        )}
        <button className="button dark full" disabled={pending}>
          {pending
            ? "One moment…"
            : mode === "login"
              ? "Sign in"
              : "Create account"}
          <Icon name="arrow" size={18} />
        </button>
        <p className="auth-switch">
          {mode === "login" ? "New around here?" : "Already feel at home?"}{" "}
          <button
            type="button"
            onClick={() => {
              setMode(mode === "login" ? "register" : "login");
              setError("");
            }}
          >
            {mode === "login" ? "Create an account" : "Sign in"}
          </button>
        </p>
        {demoAccounts && (
          <div className="demo-accounts">
            <strong>Just looking around?</strong>
            <p>
              Use a demo account. Password: <code>Demo12345!</code>
            </p>
            <div>
              <button
                type="button"
                onClick={() => {
                  setMode("login");
                  setForm({
                    ...form,
                    email: "customer@shopflow.demo",
                    password: "Demo12345!",
                  });
                  setError("");
                }}
              >
                Fill customer login
              </button>
              <button
                type="button"
                onClick={() => {
                  setMode("login");
                  setForm({
                    ...form,
                    email: "admin@shopflow.demo",
                    password: "Demo12345!",
                  });
                  setError("");
                }}
              >
                Fill admin login
              </button>
            </div>
          </div>
        )}
      </form>
    </Modal>
  );
}
function Checkout({ cart, user, token, onClose, onSuccess }) {
  const [form, setForm] = useState({
    name: user?.name || "",
    email: user?.email || "",
    street: "",
    city: "",
    postalCode: "",
    country: "",
  });
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const checkoutKey = useRef(makeCheckoutKey());
  const subtotal = cart.reduce(
    (sum, item) => sum + item.priceCents * item.quantity,
    0,
  );
  const shipping = subtotal >= 15000 ? 0 : 750;
  const field = (key, label, extra = {}) => (
    <Field label={label}>
      <input
        required
        value={form[key]}
        onChange={(e) => setForm({ ...form, [key]: e.target.value })}
        {...extra}
      />
    </Field>
  );
  async function submit(event) {
    event.preventDefault();
    setPending(true);
    setError("");
    try {
      const { order } = await api("/orders", {
        method: "POST",
        token,
        body: {
          checkoutKey: checkoutKey.current,
          items: cart.map(({ productId, variantId, quantity }) => ({
            productId,
            variantId,
            quantity,
          })),
          address: form,
        },
      });
      onSuccess(order);
    } catch (error) {
      setError(error.message);
    } finally {
      setPending(false);
    }
  }
  return (
    <Modal title="Your next everyday favorites." onClose={onClose} wide>
      <form className="checkout-layout" onSubmit={submit}>
        <div className="checkout-fields">
          <div className="notice">
            <Icon name="shield" size={21} />
            <span>
              Demo checkout. No card details, no charges, no physical shipping.
              Use fictional address details.
            </span>
          </div>
          <h3>Demo delivery details</h3>
          {field("name", "Full name", {
            autoComplete: "name",
            minLength: 2,
            maxLength: 70,
          })}
          {field("email", "Email address", {
            type: "email",
            autoComplete: "email",
            maxLength: 254,
          })}
          {field("street", "Street address", {
            autoComplete: "street-address",
            minLength: 5,
            maxLength: 200,
            placeholder: "123 Sample Street",
          })}
          <div className="field-row">
            {field("city", "City", {
              autoComplete: "address-level2",
              minLength: 2,
              maxLength: 80,
            })}
            {field("postalCode", "Postal code", {
              autoComplete: "postal-code",
              minLength: 2,
              maxLength: 20,
            })}
          </div>
          {field("country", "Country", {
            autoComplete: "country-name",
            minLength: 2,
            maxLength: 80,
          })}
          {error && (
            <p className="form-error" role="alert">
              {error}
            </p>
          )}
        </div>
        <div className="checkout-summary">
          <h3>In your bag</h3>
          {cart.map((item) => (
            <div className="checkout-item" key={item.key}>
              <div style={{ background: item.color }}>
                <ProductArt art={item.art} />
              </div>
              <span>
                <strong>{item.name}</strong>
                <small>
                  {item.variantLabel} · Qty {item.quantity}
                </small>
              </span>
              <b>{money(item.priceCents * item.quantity)}</b>
            </div>
          ))}
          <div className="summary-lines">
            <p>
              <span>Subtotal</span>
              <span>{money(subtotal)}</span>
            </p>
            <p>
              <span>Demo shipping</span>
              <span>{shipping ? money(shipping) : "On us"}</span>
            </p>
            <p className="summary-total">
              <strong>Total</strong>
              <strong>{money(subtotal + shipping)}</strong>
            </p>
          </div>
          <button
            className="button dark full"
            disabled={pending || !cart.length}
          >
            {pending ? "Placing your order…" : "Place simulated order"}
            <Icon name="arrow" size={18} />
          </button>
          <p className="checkout-fine">
            Final prices and availability are verified by the server. No money
            is collected.
          </p>
        </div>
      </form>
    </Modal>
  );
}
function OrderCard({ order, onCancel, admin = false, onStatus }) {
  const [pending, setPending] = useState(false);
  const next = {
    placed: "processing",
    processing: "shipped",
    shipped: "delivered",
  }[order.status];
  const run = async (callback) => {
    setPending(true);
    try {
      await callback();
    } finally {
      setPending(false);
    }
  };
  return (
    <article className="order-card">
      <div className="order-top">
        <div>
          <strong>{order.number}</strong>
          <span>
            {new Date(order.createdAt).toLocaleDateString("en-US", {
              month: "long",
              day: "numeric",
              year: "numeric",
            })}
          </span>
        </div>
        <span className={`status ${order.status}`}>{order.status}</span>
      </div>
      <div className="order-main">
        <div className="order-items">
          {order.items.map((item, i) => (
            <div className="order-item" key={i}>
              <div className="order-art" style={{ background: item.color }}>
                <ProductArt art={item.art} />
              </div>
              <span>
                <strong>{item.name}</strong>
                <small>
                  {item.variantLabel} · Qty {item.quantity}
                </small>
              </span>
              <b>{money(item.priceCents * item.quantity)}</b>
            </div>
          ))}
        </div>
        <div className="order-delivery">
          <span className="eyebrow">DEMO DELIVERY TO</span>
          <strong>{order.address.name}</strong>
          <span>
            {order.address.street}
            <br />
            {order.address.city}, {order.address.postalCode}
            <br />
            {order.address.country}
          </span>
          {admin && <span>{order.address.email}</span>}
        </div>
      </div>
      <div className="order-bottom">
        <span>
          Simulated total <strong>{money(order.totalCents)}</strong>
          <small>Includes {money(order.shippingCents)} demo shipping</small>
        </span>
        <div>
          {!admin && order.status === "placed" && (
            <button
              className="button small outline"
              disabled={pending}
              onClick={() => run(() => onCancel(order._id))}
            >
              Cancel order
            </button>
          )}
          {admin && next && (
            <button
              className="button small dark"
              disabled={pending}
              onClick={() => run(() => onStatus(order._id, next))}
            >
              Mark {next}
            </button>
          )}
          {admin && ["placed", "processing"].includes(order.status) && (
            <button
              className="button small outline"
              disabled={pending}
              onClick={() => run(() => onStatus(order._id, "cancelled"))}
            >
              Cancel & restore stock
            </button>
          )}
        </div>
      </div>
    </article>
  );
}
function ProductEditor({ product, token, onClose, onSuccess }) {
  const [form, setForm] = useState(
    product
      ? {
          ...product,
          price: (product.priceCents / 100).toFixed(2),
          variants: product.variants.map((v) => ({ ...v })),
        }
      : {
          name: "",
          description: "",
          category: "Desk essentials",
          price: "",
          badge: "",
          art: "hub",
          color: "#dce4dd",
          active: true,
          variants: [{ id: "default", label: "Default", stock: 10 }],
        },
  );
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const update = (key) => (e) => setForm({ ...form, [key]: e.target.value });
  async function submit(event) {
    event.preventDefault();
    setPending(true);
    setError("");
    try {
      await api(`/admin/products${product ? `/${product._id}` : ""}`, {
        method: product ? "PUT" : "POST",
        token,
        body: {
          ...form,
          priceCents: Math.round(Number(form.price) * 100),
          variants: form.variants.map((v) => ({
            ...v,
            stock: Number(v.stock),
          })),
        },
      });
      onSuccess();
    } catch (error) {
      setError(error.message);
    } finally {
      setPending(false);
    }
  }
  return (
    <Modal
      title={
        product
          ? "Give it a little update."
          : "Something new for the collection."
      }
      onClose={onClose}
      wide
    >
      <form className="editor-layout" onSubmit={submit}>
        <div className="editor-preview" style={{ background: form.color }}>
          <ProductArt art={form.art} />
          <span>ILLUSTRATION PREVIEW</span>
        </div>
        <div className="form-body editor-fields">
          <Field label="Product name">
            <input
              required
              minLength="3"
              maxLength="80"
              value={form.name}
              onChange={update("name")}
            />
          </Field>
          <div className="field-row">
            <Field label="Price (USD)">
              <input
                type="number"
                required
                min="1"
                max="100000"
                step=".01"
                value={form.price}
                onChange={update("price")}
              />
            </Field>
            <Field label="Category">
              <select value={form.category} onChange={update("category")}>
                {categoryNames.slice(1).map((c) => (
                  <option key={c}>{c}</option>
                ))}
              </select>
            </Field>
          </div>
          <Field label="Description">
            <textarea
              required
              minLength="20"
              maxLength="2000"
              rows="3"
              value={form.description}
              onChange={update("description")}
            />
          </Field>
          <div className="field-row">
            <Field label="Illustration">
              <select value={form.art} onChange={update("art")}>
                {[
                  "keyboard",
                  "lamp",
                  "headphones",
                  "stand",
                  "mouse",
                  "speaker",
                  "mat",
                  "hub",
                ].map((a) => (
                  <option key={a}>{a}</option>
                ))}
              </select>
            </Field>
            <Field label="Background">
              <input
                type="color"
                value={form.color}
                onChange={update("color")}
              />
            </Field>
          </div>
          <Field label="Badge (optional)">
            <input
              maxLength="20"
              value={form.badge}
              onChange={update("badge")}
              placeholder="New arrival"
            />
          </Field>
          <div className="variant-editor">
            <div>
              <strong>Variants & stock</strong>
              <button
                type="button"
                disabled={form.variants.length >= 12}
                onClick={() =>
                  setForm({
                    ...form,
                    variants: [
                      ...form.variants,
                      { id: `variant-${Date.now()}`, label: "", stock: 0 },
                    ],
                  })
                }
              >
                + Add variant
              </button>
            </div>
            {form.variants.map((variant, i) => (
              <div className="variant-row" key={variant.id}>
                <Field label="Finish name">
                  <input
                    required
                    maxLength="30"
                    value={variant.label}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        variants: form.variants.map((v, j) =>
                          j === i ? { ...v, label: e.target.value } : v,
                        ),
                      })
                    }
                  />
                </Field>
                <Field label="Stock">
                  <input
                    type="number"
                    required
                    min="0"
                    max="100000"
                    step="1"
                    value={variant.stock}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        variants: form.variants.map((v, j) =>
                          j === i ? { ...v, stock: e.target.value } : v,
                        ),
                      })
                    }
                  />
                </Field>
                <button
                  type="button"
                  className="icon-button"
                  aria-label={`Remove variant ${i + 1}`}
                  disabled={form.variants.length === 1}
                  onClick={() =>
                    setForm({
                      ...form,
                      variants: form.variants.filter((_, j) => j !== i),
                    })
                  }
                >
                  <Icon name="close" size={16} />
                </button>
              </div>
            ))}
          </div>
          <label className="checkbox-field">
            <input
              type="checkbox"
              checked={form.active}
              onChange={(e) => setForm({ ...form, active: e.target.checked })}
            />{" "}
            Show in storefront
          </label>
          {error && (
            <p className="form-error" role="alert">
              {error}
            </p>
          )}
          <button className="button dark full" disabled={pending}>
            {pending ? "Saving…" : "Save product"}
            <Icon name="check" size={18} />
          </button>
        </div>
      </form>
    </Modal>
  );
}

class AppBoundary extends React.Component {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  render() {
    if (this.state.failed)
      return (
        <main className="page-width account-page">
          <Empty
            title="Something got in the way."
            body="Please refresh the store to try again. Your bag is saved in this browser."
          >
            <button className="button dark" onClick={() => location.reload()}>
              Refresh store
            </button>
          </Empty>
        </main>
      );
    return this.props.children;
  }
}
createRoot(document.getElementById("root")).render(
  <AppBoundary>
    <App />
  </AppBoundary>,
);
