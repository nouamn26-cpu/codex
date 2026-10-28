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
export function ProductArt({
  art,
  color = "#dce4dd",
  className = "",
  name = "",
}) {
  const drawing = {
    keyboard: (
      <g transform="translate(18 61) rotate(-10 105 46)">
        <rect
          x="2"
          y="13"
          width="206"
          height="90"
          rx="12"
          fill="#59675d"
          opacity=".15"
        />
        <rect width="206" height="90" rx="10" fill="#b7c1b5" />
        <rect x="4" y="3" width="198" height="81" rx="8" fill="#eff1e9" />
        {Array.from({ length: 4 }, (_, r) =>
          Array.from({ length: 13 }, (_, c) => (
            <rect
              key={`${r}-${c}`}
              x={10 + c * 14.5}
              y={9 + r * 14.7}
              width="12"
              height="12"
              rx="2"
              fill={
                r === 0 && c === 0 ? "#d68a5f" : c > 10 ? "#a6b2a0" : "#d9ddd2"
              }
              stroke="#b7beaf"
              strokeWidth=".6"
            />
          )),
        )}
        <rect x="54" y="69" width="82" height="11" rx="2" fill="#c9cfbd" />
        <rect x="10" y="69" width="38" height="11" rx="2" fill="#e0e3d8" />
        <rect x="142" y="69" width="54" height="11" rx="2" fill="#b2beab" />
      </g>
    ),
    lamp: (
      <g transform="translate(59 17)">
        <ellipse
          cx="66"
          cy="159"
          rx="54"
          ry="11"
          fill="#7d6048"
          opacity=".12"
        />
        <ellipse cx="60" cy="148" rx="43" ry="9" fill="#ad9678" />
        <path d="M23 143c0-7 75-7 75 0v4c0 10-75 10-75 0Z" fill="#c4ac8b" />
        <path d="M60 141V66" stroke="#af9b7e" strokeWidth="9" />
        <path
          d="M56 70V27h42"
          fill="none"
          stroke="#d1b895"
          strokeWidth="10"
          strokeLinecap="round"
        />
        <path d="M84 21c0-13 30-13 30 0l17 35H69Z" fill="#d9c09b" />
        <ellipse cx="100" cy="55" rx="31" ry="7" fill="#b8a17f" />
        <ellipse cx="100" cy="55" rx="23" ry="4" fill="#fff4c7" />
        <circle cx="60" cy="72" r="8" fill="#cbb08c" />
      </g>
    ),
    headphones: (
      <g transform="translate(55 17) rotate(12 62 90)">
        <ellipse
          cx="65"
          cy="163"
          rx="57"
          ry="10"
          fill="#64747e"
          opacity=".12"
        />
        <path
          d="M14 112V68C14 0 117 0 117 68v44"
          fill="none"
          stroke="#a7b6bd"
          strokeWidth="23"
        />
        <path
          d="M14 85V68c0-60 103-60 103 0v17"
          fill="none"
          stroke="#dce5e7"
          strokeWidth="15"
        />
        <rect x="1" y="83" width="34" height="70" rx="17" fill="#8d9da5" />
        <rect x="7" y="82" width="32" height="67" rx="16" fill="#d4dee0" />
        <rect x="98" y="83" width="34" height="70" rx="17" fill="#8d9da5" />
        <rect x="93" y="82" width="32" height="67" rx="16" fill="#d4dee0" />
        <path
          d="M107 100v30"
          stroke="#b8c5c9"
          strokeWidth="3"
          strokeLinecap="round"
        />
      </g>
    ),
    stand: (
      <g transform="translate(30 30)">
        <ellipse
          cx="92"
          cy="140"
          rx="80"
          ry="12"
          fill="#776582"
          opacity=".12"
        />
        <path d="m46 127 74-1 21 16H23Z" fill="#a7a4af" />
        <path d="m76 76-15 53h49L99 75Z" fill="#bdbbc5" />
        <path d="M64 123h37l-9-38H78Z" fill="#d9d8e0" />
        <path d="m4 70 157-36 17 51-155 38Z" fill="#b0aeba" />
        <path d="m6 65 156-36 12 50-153 36Z" fill="#e5e3e9" />
        <path d="m2 13 139-23 22 41L6 66Z" fill="#51555e" />
        <path d="m8 16 129-21 17 31L11 59Z" fill="#29323a" />
        <path
          d="m23 43 38-7m5-1 23-4m-52-5 45-8"
          stroke="#6f928b"
          strokeWidth="3"
        />
        <path d="m8 67 151-35 13 45-151 36Z" fill="#d3d2da" />
        <path d="m30 69 115-25 5 21-113 26Z" fill="#a4a6ae" />
        <path d="m65 87 52-11 3 10-51 12Z" fill="#babcc4" />
      </g>
    ),
    mouse: (
      <g transform="translate(71 28) rotate(-18 45 75)">
        <ellipse
          cx="44"
          cy="147"
          rx="43"
          ry="12"
          fill="#796f60"
          opacity=".12"
        />
        <path d="M0 62C0-8 89-8 89 62v39c0 66-89 66-89 0Z" fill="#b5aca0" />
        <path d="M3 58C3-5 86-5 86 58v43c0 58-83 58-83 0Z" fill="#e9e4da" />
        <path d="M45 5v50M5 57h79" stroke="#cec6ba" strokeWidth="1.5" />
        <rect x="40" y="26" width="9" height="25" rx="4" fill="#b9b1a5" />
      </g>
    ),
    speaker: (
      <g transform="translate(49 38) rotate(-8 70 67)">
        <ellipse
          cx="72"
          cy="124"
          rx="72"
          ry="11"
          fill="#8e5e4e"
          opacity=".12"
        />
        <rect x="0" y="9" width="144" height="112" rx="23" fill="#9e6a58" />
        <rect x="2" width="138" height="111" rx="22" fill="#c08c73" />
        {Array.from({ length: 13 }, (_, r) => (
          <path
            key={r}
            d={`M12 ${12 + r * 7}h116`}
            stroke="#d5a88c"
            strokeWidth="1.5"
            strokeDasharray="1 3"
          />
        ))}
        <rect x="51" y="-5" width="38" height="12" rx="5" fill="#d8b397" />
        <circle cx="70" cy="53" r="24" fill="#b17f67" />
        <circle cx="70" cy="53" r="19" fill="#ce9d80" />
        <circle cx="70" cy="53" r="4" fill="#a2705a" />
      </g>
    ),
    mat: (
      <g transform="translate(25 55) rotate(-12 95 50)">
        <rect
          x="0"
          y="7"
          width="190"
          height="101"
          rx="17"
          fill="#657d68"
          opacity=".22"
        />
        <rect width="190" height="101" rx="17" fill="#8fa38c" />
        <rect
          x="5"
          y="5"
          width="180"
          height="91"
          rx="13"
          fill="none"
          stroke="#b5c3ac"
          strokeWidth="1"
          strokeDasharray="2 3"
        />
        <path
          d="M140 0h30c12 0 20 7 20 19v66c-8-14-19-20-33-18-16 3-25-13-17-25 10-14 10-28 0-42Z"
          fill="#a7b69f"
        />
        <path
          d="M143 1c17 21 6 33-4 44"
          fill="none"
          stroke="#d1d9c8"
          strokeWidth="2"
        />
      </g>
    ),
    hub: (
      <g transform="translate(36 67) rotate(-12 90 40)">
        <path
          d="M26 35C-26 35-24-33-57-33"
          fill="none"
          stroke="#657482"
          strokeWidth="7"
        />
        <rect
          x="0"
          y="8"
          width="174"
          height="72"
          rx="14"
          fill="#7a8591"
          opacity=".22"
        />
        <rect width="174" height="67" rx="13" fill="#9aa7b4" />
        <rect x="2" y="2" width="168" height="57" rx="11" fill="#bac5ce" />
        <path
          d="M17 50h26m9 0h26m10 0h18m12 0h36"
          stroke="#566474"
          strokeWidth="7"
        />
        <path d="M19 49h22m13 0h22" stroke="#80a8bb" strokeWidth="3" />
        <circle cx="147" cy="18" r="3" fill="#f4fafb" />
        <text
          x="27"
          y="28"
          fill="#7b8c9c"
          fontSize="9"
          fontFamily="sans-serif"
          letterSpacing="3"
        >
          CONNECT
        </text>
      </g>
    ),
  };
  return (
    <svg
      className={`product-art ${className}`}
      viewBox="0 0 240 200"
      role="img"
      aria-label={name || art}
    >
      {drawing[art] || drawing.hub}
    </svg>
  );
}
export function HeroArt() {
  return (
    <svg
      viewBox="0 0 680 480"
      role="img"
      aria-label="An organized workspace with a monitor, desk light, keyboard and a potted plant"
      className="hero-art"
    >
      <defs>
        <linearGradient id="wall" x2="1" y2="1">
          <stop stopColor="#dce2d7" />
          <stop offset="1" stopColor="#c7d2c4" />
        </linearGradient>
        <linearGradient id="screen" x2="1" y2="1">
          <stop stopColor="#e3ebe2" />
          <stop offset="1" stopColor="#9aae9e" />
        </linearGradient>
        <linearGradient id="wood" x2="0" y2="1">
          <stop stopColor="#c5aa87" />
          <stop offset="1" stopColor="#9f8260" />
        </linearGradient>
      </defs>
      <rect width="680" height="480" fill="url(#wall)" />
      <path d="M0 0h135v300L0 345Z" fill="#eef1e7" opacity=".42" />
      <path
        d="M94 0v320M0 170l134-37"
        stroke="#f3f4e9"
        strokeWidth="13"
        opacity=".55"
      />
      <path d="m0 354 484-77 196 78v125H0Z" fill="url(#wood)" />
      <path d="M0 395 680 365v115H0Z" fill="#d4bb99" />
      <path d="M0 404 680 375" stroke="#ecd8bb" strokeWidth="3" />
      <ellipse
        cx="326"
        cy="350"
        rx="180"
        ry="20"
        fill="#6b6951"
        opacity=".15"
      />
      <path d="M282 294h51l12 53h-75Z" fill="#8b9289" />
      <ellipse cx="309" cy="349" rx="60" ry="7" fill="#a7afa3" />
      <path d="m145 93 306-22v226l-306 19Z" fill="#6b746a" />
      <path d="m150 86 306-22v226l-306 19Z" fill="#c0c8ba" />
      <path d="m160 96 286-21v194l-286 18Z" fill="url(#screen)" />
      <path d="m227 119 144-10v142l-144 8Z" fill="#f4f1e8" />
      <path
        d="m246 140 100-6m-100 13 79-4m-79 53 92-5m-92 12 65-3"
        stroke="#a6b6a4"
        strokeWidth="4"
      />
      <circle cx="293" cy="176" r="19" fill="#d5976e" />
      <path d="m277 183 15-26 20 24" fill="#80917e" />
      <path d="m173 128 36-2v43l-36 3Z" fill="#7f9a81" />
      <path
        d="m387 122 42-3m-42 10 30-2m-30 13 36-2"
        stroke="#e5ece0"
        strokeWidth="4"
      />
      <circle cx="305" cy="290" r="3" fill="#a6b29e" />
      <path d="m143 368 222-13 54 36-238 13Z" fill="#748574" />
      <path d="m142 363 222-13 50 35-236 13Z" fill="#e3e5d8" />
      {Array.from({ length: 4 }, (_, r) =>
        Array.from({ length: 15 }, (_, c) => (
          <path
            key={`${r}-${c}`}
            d={`m${157 + c * 13.5 + r * 5} ${365 + r * 7} 10-.6 5 4.5-10 .7Z`}
            fill={c === 0 && r === 0 ? "#c8835a" : "#b6c3ae"}
          />
        )),
      )}
      <path d="m220 386 78-4 6 5-77 4Z" fill="#c4ceba" />
      <ellipse cx="467" cy="368" rx="29" ry="12" fill="#b5bca9" />
      <path d="M442 363c2-27 46-27 47 0 1 17-49 17-47 0Z" fill="#e0e2d6" />
      <path d="M467 344v12" stroke="#b4bdad" strokeWidth="2" />
      <ellipse cx="549" cy="325" rx="38" ry="7" fill="#a58b69" />
      <path
        d="M549 320V180h-42"
        fill="none"
        stroke="#5f6c5b"
        strokeWidth="8"
        strokeLinecap="round"
      />
      <path d="M481 177c0-19 40-22 46-5l17 33-79 6Z" fill="#70846b" />
      <ellipse cx="504" cy="207" rx="39" ry="6" fill="#a7b591" />
      <path d="m61 312 18 38 43-5 11-40Z" fill="#d6c3a3" />
      <path d="M101 319v-92" stroke="#6c805f" strokeWidth="5" />
      <path
        d="M101 283c-30 5-43-20-43-43 30 0 46 19 43 43m1-26c-8-29 15-43 37-49 9 28-9 46-37 49m0 48c1-22 22-35 46-29-1 24-19 35-46 29"
        fill="#7a9168"
      />
      <path d="M96 252c-15-23-7-48 8-61 20 21 17 42-8 61Z" fill="#91a77b" />
      <rect
        x="518"
        y="370"
        width="53"
        height="6"
        rx="2"
        transform="rotate(-7 518 370)"
        fill="#b26446"
      />
      <rect
        x="514"
        y="361"
        width="59"
        height="8"
        rx="2"
        transform="rotate(-7 514 361)"
        fill="#e8e1c7"
      />
      <path d="m606 426 74-8v62h-74Z" fill="#82694f" opacity=".3" />
    </svg>
  );
}
