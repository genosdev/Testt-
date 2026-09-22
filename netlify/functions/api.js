import { getStore } from "@netlify/blobs";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, X-Admin-Pass",
};

const ADMIN_PASS = "121012";

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...CORS, "Content-Type": "application/json" },
  });
}

function genId() {
  return Math.random().toString(36).slice(2, 10);
}

export default async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: CORS });

  const url = new URL(req.url);
  const parts = url.pathname.split("/").filter(Boolean);
  const last = parts[parts.length - 1];
  const id = last !== "api" && last !== "pastes" ? last : null;

  const store = getStore("genos-dev");

  try {
    if (req.method === "GET" && !id) {
      const { blobs } = await store.list();
      const items = await Promise.all(blobs.map((b) => store.get(b.key, { type: "json" })));
      const pastes = items
        .filter(Boolean)
        .map((p) => ({
          id: p.id,
          title: p.title,
          description: p.description || "",
          language: p.language,
          filename: p.filename,
          createdAt: p.createdAt,
          updatedAt: p.updatedAt || p.createdAt,
          views: p.views || 0,
          size: (p.content || "").length,
          preview: (p.content || "").slice(0, 200),
        }))
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      return json({ pastes });
    }

    if (req.method === "GET" && id) {
      const paste = await store.get(id, { type: "json" });
      if (!paste) return json({ error: "Paste tidak ditemukan" }, 404);
      paste.views = (paste.views || 0) + 1;
      await store.setJSON(id, paste);
      return json({ paste });
    }

    const pass = req.headers.get("x-admin-pass");
    if (pass !== ADMIN_PASS) return json({ error: "Unauthorized" }, 401);

    if (req.method === "POST") {
      const body = await req.json();
      if (!body.content || !body.content.trim()) return json({ error: "Kode kosong" }, 400);
      const newId = genId();
      const paste = {
        id: newId,
        title: (body.title || "Untitled").trim(),
        description: (body.description || "").trim(),
        filename: (body.filename || "script.txt").trim(),
        language: body.language || "javascript",
        content: body.content,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        views: 0,
      };
      await store.setJSON(newId, paste);
      return json({ paste }, 201);
    }

    if (req.method === "PUT" && id) {
      const existing = await store.get(id, { type: "json" });
      if (!existing) return json({ error: "Paste tidak ditemukan" }, 404);
      const body = await req.json();
      const updated = {
        ...existing,
        title: (body.title ?? existing.title).trim(),
        description: (body.description ?? existing.description).trim(),
        filename: (body.filename ?? existing.filename).trim(),
        language: body.language ?? existing.language,
        content: body.content ?? existing.content,
        updatedAt: new Date().toISOString(),
      };
      await store.setJSON(id, updated);
      return json({ paste: updated });
    }

    if (req.method === "DELETE" && id) {
      await store.delete(id);
      return json({ ok: true });
    }

    return json({ error: "Method not allowed" }, 405);
  } catch (err) {
    return json({ error: err.message || "Server error" }, 500);
  }
};