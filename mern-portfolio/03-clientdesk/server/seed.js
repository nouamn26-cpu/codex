import bcrypt from "bcryptjs";

export async function seedDemo(store) {
  if (await store.get("users", { email: "owner@clientdesk.demo" })) return;
  const passwordHash = await bcrypt.hash("DemoPass123!", 12);
  await store.create("workspaces", {
    id: "workspace-demo",
    name: "Studio North",
    currency: "USD",
  });
  await store.create("workspaces", {
    id: "workspace-other",
    name: "Other Studio",
    currency: "USD",
  });
  await store.create("users", {
    id: "user-owner",
    workspaceId: "workspace-demo",
    name: "Alex Morgan",
    email: "owner@clientdesk.demo",
    role: "admin",
    passwordHash,
  });
  await store.create("users", {
    id: "user-member",
    workspaceId: "workspace-demo",
    name: "Jamie Chen",
    email: "member@clientdesk.demo",
    role: "member",
    passwordHash,
  });
  await store.create("users", {
    id: "user-other",
    workspaceId: "workspace-other",
    name: "Taylor Reed",
    email: "other@clientdesk.demo",
    role: "admin",
    passwordHash,
  });
  const leads = [
    [
      "Olivia Smith",
      "Acme Studio",
      "olivia@example.com",
      4800,
      "New",
      "Website",
    ],
    [
      "Daniel Kim",
      "Orbit Financial",
      "daniel@example.com",
      12500,
      "New",
      "Referral",
    ],
    [
      "Sofia Garcia",
      "Bloom Wellness",
      "sofia@example.com",
      6400,
      "Contacted",
      "Website",
    ],
    [
      "Noah Wilson",
      "Pine & Co.",
      "noah@example.com",
      8200,
      "Contacted",
      "LinkedIn",
    ],
    [
      "Maya Patel",
      "Linear Labs",
      "maya@example.com",
      16000,
      "Proposal",
      "Referral",
    ],
    [
      "Ethan Davis",
      "Forma Design",
      "ethan@example.com",
      9200,
      "Proposal",
      "Website",
    ],
    [
      "Amelia Brown",
      "Brightside",
      "amelia@example.com",
      11500,
      "Won",
      "Referral",
    ],
    ["Leo Martin", "Coast Coffee", "leo@example.com", 5800, "Won", "Website"],
    ["Ava Johnson", "Flow Studio", "ava@example.com", 7500, "Won", "LinkedIn"],
    ["James Lee", "Northstar", "james@example.com", 3200, "Lost", "Website"],
  ];
  for (const [name, company, email, value, stage, source] of leads)
    await store.create("leads", {
      workspaceId: "workspace-demo",
      name,
      company,
      email,
      value,
      stage,
      source,
    });
  for (const [name, contact, email, industry] of [
    ["Brightside", "Amelia Brown", "amelia@example.com", "Technology"],
    ["Coast Coffee", "Leo Martin", "leo@example.com", "Food & Beverage"],
    ["Flow Studio", "Ava Johnson", "ava@example.com", "Design"],
    ["Meridian Health", "Isla White", "isla@example.com", "Healthcare"],
    ["Onda Travel", "Liam Scott", "liam@example.com", "Travel"],
  ])
    await store.create("clients", {
      workspaceId: "workspace-demo",
      name,
      contact,
      email,
      industry,
      status: "Active",
    });
  const date = (offset) => {
    const day = new Date();
    day.setUTCDate(day.getUTCDate() + offset);
    return day.toISOString().slice(0, 10);
  };
  for (const [title, offset, priority, assignedTo, status] of [
    ["Send Linear Labs proposal", 0, "High", "user-owner", "todo"],
    ["Follow up with Bloom Wellness", 1, "Medium", "user-member", "todo"],
    ["Prepare Q4 pipeline report", 3, "Medium", "user-owner", "todo"],
    ["Schedule Orbit discovery call", 0, "High", "user-member", "todo"],
    ["Update Brightside contact details", -1, "Low", "user-owner", "done"],
  ])
    await store.create("tasks", {
      workspaceId: "workspace-demo",
      title,
      due: date(offset),
      priority,
      assignedTo,
      status,
    });
  for (const body of [
    "Linear Labs is interested in a website redesign and a monthly support retainer. Proposal is ready for review.",
    "Coast Coffee launch went smoothly. Ask Leo for a testimonial next week.",
  ])
    await store.create("notes", {
      workspaceId: "workspace-demo",
      body,
      authorId: "user-owner",
      author: "Alex Morgan",
    });
  await store.create("leads", {
    workspaceId: "workspace-other",
    name: "Private lead",
    company: "Other Studio client",
    email: "private@example.com",
    value: 900,
    stage: "New",
    source: "Referral",
  });
}
