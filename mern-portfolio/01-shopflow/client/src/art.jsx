import React from "react";
export function Icon({ name, size = 20, ...props }) {
  const paths = {
    search: (
      <>
        <circle cx="10.8" cy="10.8" r="6.7" />
        <path d="m16 16 4.5 4.5" />
      </>
    ),
    bag: (
      <>
        <path d="M5 7h14l1 14H4L5 7Z" />
        <path d="M8 8V6a4 4 0 0 1 8 0v2" />
      </>
    ),
    arrow: (
      <>
        <path d="M4 12h16m-6-6 6 6-6 6" />
      </>
    ),
    user: (
      <>
        <circle cx="12" cy="8" r="4" />
        <path d="M4 22v-2a8 8 0 0 1 16 0v2" />
      </>
    ),
    close: <path d="m6 6 12 12M6 18 18 6" />,
    plus: <path d="M12 5v14M5 12h14" />,
    minus: <path d="M5 12h14" />,
    check: <path d="m5 12 4 4L19 6" />,
    box: (
      <>
        <path d="m3 7 9-5 9 5v11l-9 5-9-5V7Z" />
        <path d="m3 7 9 5 9-5M12 12v11M7 4.8l10 5.6" />
      </>
    ),
    truck: (
      <>
        <path d="M2 5h12v12H2zM14 10h4l4 5v2h-8" />
        <circle cx="6" cy="19" r="2" />
        <circle cx="18" cy="19" r="2" />
      </>
    ),
    leaf: (
      <>
        <path d="M20 3c-1 12-3 16-10 16A7 7 0 0 1 3 12C3 5 9 4 20 3Z" />
        <path d="m4 20 10-10" />
      </>
    ),
    shield: (
      <>
        <path d="m12 2 8 4v6c0 5-8 10-8 10S4 17 4 12V6l8-4Z" />
        <path d="m8 12 3 3 5-6" />
      </>
    ),
    chevron: <path d="m8 5 7 7-7 7" />,
    edit: (
      <>
        <path d="m15 4 5 5M4 20l5-1L21 7a3 3 0 0 0-5-5L4 14v6Z" />
      </>
    ),
    logout: (
      <>
        <path d="M9 4H4v16h5m5-12 4 4-4 4M8 12h12" />
      </>
    ),
    menu: <path d="M4 6h16M4 12h16M4 18h16" />,
    lock: (
      <>
        <rect x="5" y="10" width="14" height="12" rx="2" />
        <path d="M8 10V6a4 4 0 0 1 8 0v4" />
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
      {...props}
    >
      {paths[name] || paths.box}
    </svg>
  );
}
const photographs = {
  keyboard: "keyboard", lamp: "lamp", headphones: "headphones", stand: "stand",
  mouse: "mouse", speaker: "speaker", mat: "mat", hub: "hub"
};
export function ProductArt({ art, className = "", name = "" }) {
  const photo = photographs[art];
  if (!photo) return <span className="product-photo-placeholder">{name || "Product"}</span>;
  return <img className={`product-photo ${className}`} src={`/images/${photo}.webp`}
    alt={name ? `${name} — illustrative demo photography` : `${art} — illustrative demo photography`}
    width="900" height="900" loading="lazy" decoding="async" />;
}
export function HeroArt() {
  return <img className="hero-art editorial-photo" src="/images/workspace.webp"
    alt="A warm wooden workspace with a laptop, keyboard and headphones" width="1600" height="1200" fetchPriority="high" />;
}
