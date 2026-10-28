import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { createStore } from "../server/store.js";
import { createApp } from "../server/app.js";
import { answerQuestion } from "../server/knowledge.js";

test("SupportPilot: ingestion, grounded support, tickets, permissions and workspace isolation", async (t) => {
  const directory = await mkdtemp(path.join(os.tmpdir(), "supportpilot-test-"));
  const store = await createStore({ dataDir: directory, seed: true });
  const app = createApp({
    store,
    secret: "test-only-secret-at-least-thirty-two-characters",
    disableLimits: true,
  });
  const server = app.listen(0, "127.0.0.1");
  await new Promise((resolve) => server.once("listening", resolve));
  const base = `http://127.0.0.1:${server.address().port}/api`;
  t.after(async () => {
    await new Promise((resolve) => server.close(resolve));
    await store.close();
    await rm(directory, { recursive: true, force: true });
  });
  async function request(route, { token, method = "GET", body } = {}) {
    const form = body instanceof FormData;
    const response = await fetch(base + route, {
      method,
      headers: {
        ...(form ? {} : { "Content-Type": "application/json" }),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: body ? (form ? body : JSON.stringify(body)) : undefined,
    });
    return { status: response.status, data: await response.json() };
  }
  const login = async (email) => {
    const result = await request("/auth/login", {
      method: "POST",
      body: { email, password: "Demo123!" },
    });
    assert.equal(result.status, 200);
    assert.ok(!result.data.user.passwordHash);
    return result.data;
  };
  const owner = await login("owner@supportpilot.demo"),
    customer = await login("customer@supportpilot.demo"),
    foreign = await login("orbit@supportpilot.demo");
  let article, chat, ticket, joined;
  await t.test(
    "rejects unauthenticated and incorrect credentials",
    async () => {
      assert.equal((await request("/articles")).status, 401);
      assert.equal(
        (
          await request("/auth/login", {
            method: "POST",
            body: { email: customer.user.email, password: "wrong" },
          })
        ).status,
        401,
      );
      assert.equal(
        (await request("/dashboard", { token: customer.token })).status,
        403,
      );
      const state = await store.read();
      assert.notEqual(state.users[0].passwordHash, "Demo123!");
    },
  );
  await t.test(
    "admin creates knowledge; users cannot escalate roles or see other workspace articles",
    async () => {
      const result = await request("/articles", {
        token: owner.token,
        method: "POST",
        body: {
          title: "Loyalty rewards",
          category: "Orders",
          content:
            "Earn loyalty rewards points with every purchase. Every ten dollars spent earns one loyalty point.",
          workspaceId: foreign.workspace.id,
        },
      });
      assert.equal(result.status, 201);
      article = result.data;
      assert.equal(article.workspaceId, owner.workspace.id);
      assert.equal(
        (
          await request("/articles", {
            token: customer.token,
            method: "POST",
            body: {
              title: "Hacked",
              category: "Orders",
              content: "This article must not be accepted for a nonadmin user.",
              role: "admin",
            },
          })
        ).status,
        403,
      );
      assert.equal(
        (
          await request(`/articles/${article.id}`, {
            token: foreign.token,
            method: "PATCH",
            body: {
              title: "Changed",
              category: "Orders",
              content: "This article does not belong to this workspace.",
            },
          })
        ).status,
        404,
      );
      assert.equal(
        (await request("/articles", { token: foreign.token })).data.length,
        0,
      );
    },
  );
  await t.test(
    "imports plain text and rejects executable, oversized, binary and invalid UTF-8 uploads",
    async () => {
      const file = new FormData();
      file.append(
        "file",
        new Blob([
          "Our warranty lasts two years from the date of purchase. Contact support to request a warranty replacement.",
        ]),
        "Warranty.md",
      );
      assert.equal(
        (
          await request("/articles/upload", {
            token: owner.token,
            method: "POST",
            body: file,
          })
        ).status,
        201,
      );
      for (const [name, content] of [
        ["hack.exe", "This is not allowed."],
        ["too-large.txt", "x".repeat(65537)],
        ["binary.txt", new Uint8Array([0, 0, 0, 0])],
        ["invalid.txt", new Uint8Array([0xff, 0xfe, 0xff])],
      ]) {
        const upload = new FormData();
        upload.append("file", new Blob([content]), name);
        assert.equal(
          (
            await request("/articles/upload", {
              token: owner.token,
              method: "POST",
              body: upload,
            })
          ).status,
          400,
          name,
        );
      }
    },
  );
  await t.test(
    "new business receives its own workspace; customer join cannot choose an admin role",
    async () => {
      const signup = await request("/auth/register", {
        method: "POST",
        body: {
          name: "New Owner",
          email: "new@example.com",
          password: "Password123!",
          workspaceName: "Private Workspace",
          workspaceId: owner.workspace.id,
          role: "admin",
        },
      });
      assert.equal(signup.status, 201);
      assert.notEqual(signup.data.workspace.id, owner.workspace.id);
      assert.equal(
        (await request("/articles", { token: signup.data.token })).data.length,
        0,
      );
      const join = await request("/auth/join", {
        method: "POST",
        body: {
          name: "Second Visitor",
          email: "visitor@example.com",
          password: "Password123!",
          workspaceSlug: owner.workspace.slug,
          role: "admin",
        },
      });
      assert.equal(join.status, 201);
      joined = join.data;
      assert.equal(joined.user.role, "customer");
      assert.equal(
        (
          await request("/articles", {
            token: joined.token,
            method: "POST",
            body: {},
          })
        ).status,
        403,
      );
    },
  );
  await t.test(
    "grounded chat returns source references; unknown topics recommend a human",
    async () => {
      const created = await request("/conversations", {
        token: customer.token,
        method: "POST",
        body: { workspaceId: foreign.workspace.id, userId: foreign.user.id },
      });
      assert.equal(created.status, 201);
      chat = created.data;
      assert.equal(chat.workspaceId, owner.workspace.id);
      assert.equal(chat.userId, customer.user.id);
      const answer = await request(`/conversations/${chat.id}/messages`, {
        token: customer.token,
        method: "POST",
        body: { content: "How long does shipping take?" },
      });
      assert.equal(answer.status, 200);
      const message = answer.data.messages.at(-1);
      assert.equal(message.mode, "local");
      assert.ok(message.sources.length);
      assert.match(message.content, /3–5 business days/);
      const unknown = await request(`/conversations/${chat.id}/messages`, {
        token: customer.token,
        method: "POST",
        body: {
          content: "Explain quantum entanglement and meteorology forecasts.",
        },
      });
      assert.equal(unknown.status, 200);
      assert.equal(unknown.data.messages.at(-1).needsHuman, true);
      assert.deepEqual(unknown.data.messages.at(-1).sources, []);
      assert.equal(
        (await request(`/conversations/${chat.id}`, { token: foreign.token }))
          .status,
        404,
      );
      assert.equal(
        (await request(`/conversations/${chat.id}`, { token: joined.token }))
          .status,
        404,
      );
      assert.equal(
        (
          await request(`/conversations/${chat.id}/messages`, {
            token: owner.token,
            method: "POST",
            body: { content: "Cannot impersonate this customer." },
          })
        ).status,
        403,
      );
    },
  );
  await t.test(
    "handoff is idempotent; authorized replies and status changes persist",
    async () => {
      const first = await request(`/conversations/${chat.id}/handoff`, {
        token: customer.token,
        method: "POST",
        body: { content: "I need help with a damaged product." },
      });
      assert.equal(first.status, 201);
      ticket = first.data;
      const again = await request(`/conversations/${chat.id}/handoff`, {
        token: customer.token,
        method: "POST",
        body: {},
      });
      assert.equal(again.data.id, ticket.id);
      assert.equal(
        (
          await request(`/tickets/${ticket.id}/replies`, {
            token: foreign.token,
            method: "POST",
            body: { content: "Cross workspace write must fail." },
          })
        ).status,
        404,
      );
      assert.equal(
        (
          await request(`/tickets/${ticket.id}/replies`, {
            token: joined.token,
            method: "POST",
            body: { content: "Same workspace different customer must fail." },
          })
        ).status,
        404,
      );
      assert.equal(
        (
          await request(`/tickets/${ticket.id}`, {
            token: customer.token,
            method: "PATCH",
            body: { status: "closed" },
          })
        ).status,
        403,
      );
      assert.equal(
        (
          await request(`/tickets/${ticket.id}/replies`, {
            token: owner.token,
            method: "POST",
            body: { content: "We can help. Please share the order number." },
          })
        ).status,
        201,
      );
      const customerTickets = (
        await request("/tickets", { token: customer.token })
      ).data;
      assert.equal(
        customerTickets.find((item) => item.id === ticket.id).replies.at(-1)
          .role,
        "admin",
      );
      assert.equal(
        (
          await request(`/tickets/${ticket.id}`, {
            token: owner.token,
            method: "PATCH",
            body: { status: "invalid" },
          })
        ).status,
        400,
      );
      assert.equal(
        (
          await request(`/tickets/${ticket.id}`, {
            token: owner.token,
            method: "PATCH",
            body: { status: "closed" },
          })
        ).status,
        200,
      );
      assert.equal(
        (
          await request(`/tickets/${ticket.id}/replies`, {
            token: customer.token,
            method: "POST",
            body: { content: "Cannot reply to closed ticket." },
          })
        ).status,
        409,
      );
    },
  );
  await t.test(
    "knowledge can be edited/deleted and file persistence survives reopening",
    async () => {
      assert.equal(
        (
          await request(`/articles/${article.id}`, {
            token: owner.token,
            method: "PATCH",
            body: {
              title: "Updated loyalty rewards",
              category: "Rewards",
              content:
                "Every loyalty purchase now earns double reward points. This updated policy is effective immediately.",
            },
          })
        ).status,
        200,
      );
      const reopened = await createStore({ dataDir: directory, seed: false });
      assert.ok(
        (await reopened.read()).articles.some(
          (item) => item.title === "Updated loyalty rewards",
        ),
      );
      await reopened.close();
      assert.equal(
        (
          await request(`/articles/${article.id}`, {
            token: owner.token,
            method: "DELETE",
          })
        ).status,
        200,
      );
      assert.equal(
        (
          await request(`/articles/${article.id}`, {
            token: owner.token,
            method: "DELETE",
          })
        ).status,
        404,
      );
    },
  );
});

test("optional AI contract uses only retrieved knowledge and falls back safely", async () => {
  const articles = [
    {
      id: "a",
      title: "Warranty policy",
      content: "The warranty lasts two years from the purchase date.",
    },
  ];
  let sent;
  const result = await answerQuestion(
    "What is the warranty policy?",
    articles,
    {
      apiKey: "test-key-not-real",
      fetchImpl: async (url, options) => {
        assert.equal(url, "https://api.openai.com/v1/responses");
        sent = JSON.parse(options.body);
        return {
          ok: true,
          json: async () => ({
            status: "completed",
            output: [
              {
                type: "message",
                content: [
                  {
                    type: "output_text",
                    text: "The warranty lasts two years.",
                  },
                ],
              },
            ],
          }),
        };
      },
    },
  );
  assert.equal(result.mode, "openai");
  assert.deepEqual(result.sources, [{ id: "a", title: "Warranty policy" }]);
  assert.equal(sent.store, false);
  assert.equal(sent.max_output_tokens, 450);
  assert.match(sent.input, /two years/);
  const fallback = await answerQuestion(
    "What is the warranty policy?",
    articles,
    {
      apiKey: "test-key-not-real",
      fetchImpl: async () => {
        throw new Error("provider unavailable");
      },
    },
  );
  assert.equal(fallback.mode, "local");
  assert.equal(fallback.providerFallback, true);
  assert.match(fallback.content, /two years/);
  let called = false;
  const unknown = await answerQuestion(
    "Explain quantum entanglement.",
    articles,
    {
      apiKey: "test-key-not-real",
      fetchImpl: async () => {
        called = true;
      },
    },
  );
  assert.equal(called, false);
  assert.equal(unknown.needsHuman, true);
});
