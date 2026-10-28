import express from "express";
import helmet from "helmet";
import { rateLimit } from "express-rate-limit";
import multer from "multer";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { id, iso } from "./store.js";
import { answerQuestion } from "./knowledge.js";

const fail = (status, message) => {
  throw Object.assign(new Error(message), { status });
};
const text = (value, field, min = 1, max = 500) => {
  if (
    typeof value !== "string" ||
    value.trim().length < min ||
    value.trim().length > max
  )
    fail(400, `${field} must contain ${min}–${max} characters.`);
  return value.trim();
};
const email = (value) => {
  const output = text(value, "Email", 5, 160).toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(output))
    fail(400, "Enter a valid email.");
  return output;
};
const safeUser = (user) => ({
  id: user.id,
  name: user.name,
  email: user.email,
  role: user.role,
  workspaceId: user.workspaceId,
});

export function createApp({
  store,
  secret,
  dev = false,
  apiKey = "",
  model = "gpt-4.1-mini",
  fetchImpl,
  disableLimits = false,
}) {
  if (!secret || secret.length < 24)
    throw new Error("JWT_SECRET must contain at least 24 characters.");
  const app = express();
  app.disable("x-powered-by");
  // A single proxy is used by Render. JWTs are sent as explicit Authorization headers.
  app.set("trust proxy", 1);
  app.use(
    helmet({
      contentSecurityPolicy: dev ? false : undefined,
      crossOriginEmbedderPolicy: false,
    }),
  );
  app.use(express.json({ limit: "300kb" }));
  const limiter = (max, windowMs = 15 * 60 * 1000) =>
    disableLimits
      ? (_req, _res, next) => next()
      : rateLimit({
          windowMs,
          limit: max,
          standardHeaders: "draft-8",
          legacyHeaders: false,
          message: { error: "Too many requests. Please try again shortly." },
        });
  app.use("/api", limiter(600));
  const auth = async (req, _res, next) => {
    const token = req.headers.authorization?.match(/^Bearer (.+)$/)?.[1];
    if (!token)
      return next(Object.assign(new Error("Please sign in."), { status: 401 }));
    try {
      const payload = jwt.verify(token, secret, {
        algorithms: ["HS256"],
        issuer: "supportpilot",
        audience: "supportpilot-web",
      });
      const state = await store.read();
      req.user = state.users.find((user) => user.id === payload.sub);
      if (!req.user) fail(401, "Please sign in again.");
      next();
    } catch {
      next(
        Object.assign(
          new Error("Your session expired. Please sign in again."),
          { status: 401 },
        ),
      );
    }
  };
  const admin = (req, _res, next) =>
    req.user.role === "admin"
      ? next()
      : next(
          Object.assign(new Error("Workspace admin access required."), {
            status: 403,
          }),
        );
  const visibleConversation = (state, req, conversationId) => {
    const conversation = state.conversations.find(
      (item) =>
        item.id === conversationId &&
        item.workspaceId === req.user.workspaceId &&
        (req.user.role === "admin" || item.userId === req.user.id),
    );
    if (!conversation) fail(404, "Conversation not found.");
    return conversation;
  };
  const visibleTicket = (state, req, ticketId) => {
    const ticket = state.tickets.find(
      (item) =>
        item.id === ticketId &&
        item.workspaceId === req.user.workspaceId &&
        (req.user.role === "admin" || item.userId === req.user.id),
    );
    if (!ticket) fail(404, "Ticket not found.");
    return ticket;
  };
  const session = async (user) => {
    const state = await store.read();
    return {
      token: jwt.sign({}, secret, {
        subject: user.id,
        expiresIn: "8h",
        algorithm: "HS256",
        issuer: "supportpilot",
        audience: "supportpilot-web",
      }),
      user: safeUser(user),
      workspace: state.workspaces.find((item) => item.id === user.workspaceId),
    };
  };
  app.get("/api/health", (_req, res) =>
    res.json({
      status: "ok",
      storage: store.mode,
      assistant: apiKey
        ? "OpenAI with local retrieval"
        : "Local knowledge search",
    }),
  );
  app.post("/api/auth/login", limiter(30), async (req, res) => {
    const address = email(req.body.email),
      password = text(req.body.password, "Password", 1, 128);
    const state = await store.read(),
      user = state.users.find((item) => item.email === address);
    if (!user || !(await bcrypt.compare(password, user.passwordHash)))
      fail(401, "Email or password is incorrect.");
    res.json(await session(user));
  });
  app.post("/api/auth/register", limiter(20), async (req, res) => {
    const name = text(req.body.name, "Name", 2, 80),
      address = email(req.body.email),
      password = text(req.body.password, "Password", 8, 128);
    const workspaceName = text(req.body.workspaceName, "Workspace name", 2, 80),
      workspaceId = id();
    const passwordHash = await bcrypt.hash(password, 12);
    const user = await store.mutate((state) => {
      if (state.users.some((item) => item.email === address))
        fail(409, "This email is already registered.");
      if (state.users.length >= 500)
        fail(409, "This demo has reached its account limit.");
      const workspace = {
        id: workspaceId,
        name: workspaceName,
        slug: `${workspaceName
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "-")
          .slice(0, 40)}-${id().slice(0, 6)}`,
        createdAt: iso(),
      };
      const item = {
        id: id(),
        workspaceId,
        name,
        email: address,
        passwordHash,
        role: "admin",
        createdAt: iso(),
      };
      state.workspaces.push(workspace);
      state.users.push(item);
      return item;
    });
    res.status(201).json(await session(user));
  });
  app.post("/api/auth/join", limiter(20), async (req, res) => {
    const name = text(req.body.name, "Name", 2, 80),
      address = email(req.body.email),
      password = text(req.body.password, "Password", 8, 128),
      slug = text(req.body.workspaceSlug, "Workspace code", 2, 100);
    const passwordHash = await bcrypt.hash(password, 12);
    const user = await store.mutate((state) => {
      const workspace = state.workspaces.find((item) => item.slug === slug);
      if (!workspace) fail(404, "Workspace code not found.");
      if (state.users.some((item) => item.email === address))
        fail(409, "This email is already registered.");
      if (state.users.length >= 500)
        fail(409, "This demo has reached its account limit.");
      const item = {
        id: id(),
        workspaceId: workspace.id,
        name,
        email: address,
        passwordHash,
        role: "customer",
        createdAt: iso(),
      };
      state.users.push(item);
      return item;
    });
    res.status(201).json(await session(user));
  });
  app.use("/api", auth);
  app.get("/api/me", async (req, res) => {
    const state = await store.read();
    res.json({
      user: safeUser(req.user),
      workspace: state.workspaces.find(
        (item) => item.id === req.user.workspaceId,
      ),
      assistant: apiKey
        ? "OpenAI + knowledge retrieval"
        : "Local knowledge search",
      storage: store.mode,
    });
  });
  app.get("/api/dashboard", admin, async (req, res) => {
    const state = await store.read(),
      workspaceId = req.user.workspaceId;
    const conversations = state.conversations.filter(
        (item) => item.workspaceId === workspaceId,
      ),
      tickets = state.tickets.filter(
        (item) => item.workspaceId === workspaceId,
      ),
      articles = state.articles.filter(
        (item) => item.workspaceId === workspaceId,
      );
    const answers = conversations
      .flatMap((item) => item.messages)
      .filter((item) => item.role === "assistant");
    res.json({
      stats: {
        conversations: conversations.length,
        articles: articles.length,
        openTickets: tickets.filter((item) => item.status !== "closed").length,
        groundedAnswers: answers.filter((item) => item.sources?.length).length,
        totalAnswers: answers.length,
      },
      recentTickets: tickets
        .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
        .slice(0, 5),
      recentArticles: articles
        .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
        .slice(0, 4),
    });
  });
  app.get("/api/articles", async (req, res) => {
    const state = await store.read();
    res.json(
      state.articles
        .filter((item) => item.workspaceId === req.user.workspaceId)
        .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)),
    );
  });
  const addArticle = async (req, data) =>
    store.mutate((state) => {
      if (
        state.articles.filter(
          (item) => item.workspaceId === req.user.workspaceId,
        ).length >= 100
      )
        fail(409, "This demo supports 100 articles per workspace.");
      const article = {
        id: id(),
        workspaceId: req.user.workspaceId,
        title: text(data.title, "Title", 3, 120),
        category: text(data.category || "General", "Category", 2, 40),
        content: text(data.content, "Content", 20, 16000),
        source: data.source || "Manual article",
        createdAt: iso(),
        updatedAt: iso(),
      };
      state.articles.push(article);
      return article;
    });
  app.post("/api/articles", admin, async (req, res) =>
    res.status(201).json(await addArticle(req, req.body)),
  );
  const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 64 * 1024, files: 1, fields: 2 },
    fileFilter: (_req, file, callback) =>
      callback(
        /\.(txt|md)$/i.test(file.originalname)
          ? null
          : Object.assign(new Error("Only .txt and .md files are supported."), {
              status: 400,
            }),
        /\.(txt|md)$/i.test(file.originalname),
      ),
  });
  app.post(
    "/api/articles/upload",
    admin,
    upload.single("file"),
    async (req, res) => {
      if (!req.file) fail(400, "Choose a .txt or .md file.");
      const content = new TextDecoder("utf-8", { fatal: true }).decode(
        req.file.buffer,
      );
      if (/[\x00-\x08\x0e-\x1f]/.test(content))
        fail(400, "The file must contain plain UTF-8 text.");
      const filename = req.file.originalname
        .replace(/[^a-zA-Z0-9._ -]/g, "")
        .slice(0, 100);
      res
        .status(201)
        .json(
          await addArticle(req, {
            title: req.body.title || filename.replace(/\.(txt|md)$/i, ""),
            category: req.body.category || "Imported",
            content,
            source: `Uploaded ${filename}`,
          }),
        );
    },
  );
  app.patch("/api/articles/:id", admin, async (req, res) =>
    res.json(
      await store.mutate((state) => {
        const item = state.articles.find(
          (article) =>
            article.id === req.params.id &&
            article.workspaceId === req.user.workspaceId,
        );
        if (!item) fail(404, "Article not found.");
        item.title = text(req.body.title, "Title", 3, 120);
        item.category = text(req.body.category || "General", "Category", 2, 40);
        item.content = text(req.body.content, "Content", 20, 16000);
        item.updatedAt = iso();
        return item;
      }),
    ),
  );
  app.delete("/api/articles/:id", admin, async (req, res) => {
    await store.mutate((state) => {
      const index = state.articles.findIndex(
        (item) =>
          item.id === req.params.id &&
          item.workspaceId === req.user.workspaceId,
      );
      if (index === -1) fail(404, "Article not found.");
      state.articles.splice(index, 1);
      return true;
    });
    res.json({ ok: true });
  });
  app.get("/api/conversations", async (req, res) => {
    const state = await store.read();
    res.json(
      state.conversations
        .filter(
          (item) =>
            item.workspaceId === req.user.workspaceId &&
            (req.user.role === "admin" || item.userId === req.user.id),
        )
        .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
        .map(({ messages, ...item }) => ({
          ...item,
          messageCount: messages.length,
        })),
    );
  });
  app.post("/api/conversations", async (req, res) =>
    res.status(201).json(
      await store.mutate((state) => {
        if (
          state.conversations.filter(
            (item) => item.workspaceId === req.user.workspaceId,
          ).length >= 300
        )
          fail(409, "This demo has reached its conversation limit.");
        const conversation = {
          id: id(),
          workspaceId: req.user.workspaceId,
          userId: req.user.id,
          title: "New conversation",
          createdAt: iso(),
          updatedAt: iso(),
          messages: [],
        };
        state.conversations.push(conversation);
        return conversation;
      }),
    ),
  );
  app.get("/api/conversations/:id", async (req, res) =>
    res.json(visibleConversation(await store.read(), req, req.params.id)),
  );
  app.post(
    "/api/conversations/:id/messages",
    limiter(30, 60 * 1000),
    async (req, res) => {
      const question = text(req.body.content, "Message", 3, 1200),
        state = await store.read();
      const conversation = visibleConversation(state, req, req.params.id);
      if (conversation.userId !== req.user.id)
        fail(
          403,
          "Only the conversation owner can send chat messages. Reply through its support ticket.",
        );
      if (conversation.messages.length >= 100)
        fail(409, "Start a new conversation to continue.");
      const answer = await answerQuestion(
        question,
        state.articles.filter(
          (item) => item.workspaceId === req.user.workspaceId,
        ),
        { apiKey, model, fetchImpl },
      );
      res.json(
        await store.mutate((draft) => {
          const item = visibleConversation(draft, req, req.params.id);
          if (item.messages.length >= 100)
            fail(409, "Start a new conversation to continue.");
          if (!item.messages.length) item.title = question.slice(0, 64);
          item.messages.push(
            { id: id(), role: "user", content: question, createdAt: iso() },
            { id: id(), role: "assistant", ...answer, createdAt: iso() },
          );
          item.updatedAt = iso();
          return item;
        }),
      );
    },
  );
  app.post("/api/conversations/:id/handoff", async (req, res) =>
    res.status(201).json(
      await store.mutate((state) => {
        const conversation = visibleConversation(state, req, req.params.id);
        if (conversation.userId !== req.user.id)
          fail(403, "Only the conversation owner can request a handoff.");
        const existing = state.tickets.find(
          (item) =>
            item.conversationId === conversation.id && item.status !== "closed",
        );
        if (existing) return existing;
        const content = text(
          req.body.content || "Please connect me with a support specialist.",
          "Request",
          3,
          2000,
        );
        const ticket = {
          id: id(),
          workspaceId: req.user.workspaceId,
          userId: req.user.id,
          conversationId: conversation.id,
          subject:
            conversation.title === "New conversation"
              ? "Support request"
              : conversation.title,
          status: "open",
          createdAt: iso(),
          updatedAt: iso(),
          replies: [
            {
              id: id(),
              userId: req.user.id,
              author: req.user.name,
              role: req.user.role,
              content,
              createdAt: iso(),
            },
          ],
        };
        state.tickets.push(ticket);
        return ticket;
      }),
    ),
  );
  app.get("/api/tickets", async (req, res) => {
    const state = await store.read();
    res.json(
      state.tickets
        .filter(
          (item) =>
            item.workspaceId === req.user.workspaceId &&
            (req.user.role === "admin" || item.userId === req.user.id),
        )
        .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)),
    );
  });
  app.patch("/api/tickets/:id", admin, async (req, res) => {
    if (!["open", "in-progress", "closed"].includes(req.body.status))
      fail(400, "Invalid ticket status.");
    res.json(
      await store.mutate((state) => {
        const ticket = visibleTicket(state, req, req.params.id);
        ticket.status = req.body.status;
        ticket.updatedAt = iso();
        return ticket;
      }),
    );
  });
  app.post("/api/tickets/:id/replies", async (req, res) => {
    const content = text(req.body.content, "Reply", 2, 3000);
    res.status(201).json(
      await store.mutate((state) => {
        const ticket = visibleTicket(state, req, req.params.id);
        if (ticket.status === "closed")
          fail(409, "This ticket is closed. Ask an admin to reopen it.");
        ticket.replies.push({
          id: id(),
          userId: req.user.id,
          author: req.user.name,
          role: req.user.role,
          content,
          createdAt: iso(),
        });
        ticket.updatedAt = iso();
        return ticket;
      }),
    );
  });
  app.use("/api", (_req, res) =>
    res.status(404).json({ error: "API route not found." }),
  );
  app.use((error, _req, res, _next) => {
    const uploadError = error instanceof multer.MulterError;
    const status =
      error.status ||
      (uploadError ||
      (error instanceof TypeError && /encoded data/.test(error.message))
        ? 400
        : 500);
    res
      .status(status)
      .json({
        error: uploadError
          ? "Upload one plain-text file up to 64 KB."
          : status >= 500
            ? "Something went wrong. Please retry."
            : error.message,
      });
  });
  return app;
}
