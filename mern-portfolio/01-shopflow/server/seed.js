import bcrypt from "bcryptjs";

export const catalog = [
  {
    _id: "keyboard",
    name: "Studio Mechanical Keyboard",
    category: "Keyboards",
    priceCents: 12900,
    badge: "Bestseller",
    art: "keyboard",
    color: "#dce4dd",
    description:
      "A quieter kind of click. A compact 75% mechanical keyboard with tactile switches, warm-white backlighting, and a beautifully weighted aluminum body. USB-C cable included.",
    variants: [
      { id: "sage", label: "Sage", stock: 12 },
      { id: "chalk", label: "Chalk", stock: 8 },
      { id: "graphite", label: "Graphite", stock: 5 },
    ],
  },
  {
    _id: "lamp",
    name: "Arc Desk Light",
    category: "Lighting",
    priceCents: 8900,
    badge: "New arrival",
    art: "lamp",
    color: "#edddc9",
    description:
      "Light that follows your flow. Three color temperatures, a touch dimmer, and a rotating head make this compact lamp the perfect companion for focused evenings.",
    variants: [
      { id: "sand", label: "Sand", stock: 15 },
      { id: "black", label: "Black", stock: 9 },
    ],
  },
  {
    _id: "headphones",
    name: "Focus Wireless Headphones",
    category: "Audio",
    priceCents: 15900,
    badge: "",
    art: "headphones",
    color: "#d8e1e5",
    description:
      "Find your quiet. Over-ear wireless headphones with soft memory-foam cushions, active noise cancellation, and 35 hours of battery life. Fold-flat travel case included.",
    variants: [
      { id: "cloud", label: "Cloud", stock: 7 },
      { id: "charcoal", label: "Charcoal", stock: 10 },
    ],
  },
  {
    _id: "stand",
    name: "Rise Laptop Stand",
    category: "Desk essentials",
    priceCents: 5900,
    badge: "Staff pick",
    art: "stand",
    color: "#e5dded",
    description:
      "A little lift makes a big difference. A sculpted aluminum laptop stand that brings your screen to eye level while keeping your workspace open and airy. Fits 13–16 inch laptops.",
    variants: [
      { id: "silver", label: "Silver", stock: 21 },
      { id: "space", label: "Space gray", stock: 8 },
    ],
  },
  {
    _id: "mouse",
    name: "Pebble Wireless Mouse",
    category: "Desk essentials",
    priceCents: 3900,
    badge: "",
    art: "mouse",
    color: "#e7dfd4",
    description:
      "Smooth, quiet, and comfortably familiar. An ergonomic wireless mouse with silent clicks, adjustable DPI, and dual-device pairing for effortless multitasking.",
    variants: [
      { id: "cream", label: "Cream", stock: 24 },
      { id: "sage", label: "Sage", stock: 11 },
    ],
  },
  {
    _id: "speaker",
    name: "Mono Bluetooth Speaker",
    category: "Audio",
    priceCents: 7900,
    badge: "",
    art: "speaker",
    color: "#e7d3ca",
    description:
      "Small footprint. Full-room sound. A fabric-wrapped Bluetooth speaker with warm, balanced audio, a tactile volume dial, and all-day battery life.",
    variants: [
      { id: "terracotta", label: "Terracotta", stock: 13 },
      { id: "stone", label: "Stone", stock: 6 },
    ],
  },
  {
    _id: "deskmat",
    name: "Everyday Desk Mat",
    category: "Desk essentials",
    priceCents: 2900,
    badge: "Under $50",
    art: "mat",
    color: "#d6e3dc",
    description:
      "Give your everyday tools a soft landing. A generously sized, vegan-leather desk mat with a grippy natural-rubber base and a spill-resistant surface.",
    variants: [
      { id: "moss", label: "Moss", stock: 30 },
      { id: "tan", label: "Tan", stock: 18 },
    ],
  },
  {
    _id: "hub",
    name: "Connect USB-C Hub",
    category: "Desk essentials",
    priceCents: 4900,
    badge: "",
    art: "hub",
    color: "#dce0e8",
    description:
      "One port. More possibilities. Connect your display, SD card, and everyday accessories with a slim six-port USB-C hub. Includes 4K HDMI and 100W pass-through charging.",
    variants: [{ id: "slate", label: "Slate", stock: 16 }],
  },
];
export async function seedDemo(store) {
  const passwordHash = await bcrypt.hash("Demo12345!", 10);
  await store.mutate((state) => {
    if (!state.products.length)
      state.products.push(
        ...catalog.map((item) => ({
          ...item,
          active: true,
          createdAt: new Date().toISOString(),
        })),
      );
    for (const [id, name, email, role] of [
      ["demo-customer", "Alex Morgan", "customer@shopflow.demo", "customer"],
      ["demo-admin", "Jamie Admin", "admin@shopflow.demo", "admin"],
    ])
      if (!state.users.some((user) => user.email === email))
        state.users.push({
          _id: id,
          name,
          email,
          role,
          passwordHash,
          createdAt: new Date().toISOString(),
        });
    return true;
  });
}
