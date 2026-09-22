/* ========= GENOS DEV — MAIN (v2) ========= */

const state = {
  pastes: [],
  filtered: [],
  current: null,
  lastTap: 0,
  sortBy: "newest",
};

const ADMIN_PASS = "121012";

const els = {
  list: document.getElementById("list"),
  loading: document.getElementById("loading"),
  empty: document.getElementById("empty"),
  search: document.getElementById("searchInput"),
  refresh: document.getElementById("refreshBtn"),
  countBadge: document.getElementById("countBadge"),
  statTotal: document.getElementById("statTotal"),
  statViews: document.getElementById("statViews"),
  tapzone: document.getElementById("tapzone"),
  sortSelect: document.getElementById("sortSelect"),

  viewModal: document.getElementById("viewModal"),
  viewTitle: document.getElementById("viewTitle"),
  viewDesc: document.getElementById("viewDesc"),
  viewLang: document.getElementById("viewLang"),
  viewMeta: document.getElementById("viewMeta"),
  viewCode: document.getElementById("viewCode"),
  viewFilename: document.getElementById("viewFilename"),
  viewSize: document.getElementById("viewSize"),
  btnCopy: document.getElementById("btnCopy"),
  btnDownload: document.getElementById("btnDownload"),
  btnShare: document.getElementById("btnShare"),
  btnCopyLink: document.getElementById("btnCopyLink"),

  pwModal: document.getElementById("pwModal"),
  pwInput: document.getElementById("pwInput"),
  pwAlert: document.getElementById("pwAlert"),
  pwSubmit: document.getElementById("pwSubmit"),
};

/* ---------- HELPERS ---------- */
function esc(s) {
  return String(s ?? "")
    .replace(/&/g, "&amp;").replace(/</g, "&lt;")
    .replace(/>/g, "&gt;").replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function timeAgo(date) {
  const d = (Date.now() - new Date(date)) / 1000;
  if (d < 60) return "baru aja";
  if (d < 3600) return Math.floor(d / 60) + " mnt lalu";
  if (d < 86400) return Math.floor(d / 3600) + " jam lalu";
  if (d < 2592000) return Math.floor(d / 86400) + " hari lalu";
  return new Date(date).toLocaleDateString("id-ID");
}

function formatSize(bytes) {
  if (bytes < 1024) return bytes + " B";
  if (bytes < 1048576) return (bytes / 1024).toFixed(1) + " KB";
  return (bytes / 1048576).toFixed(2) + " MB";
}

const ICON = {
  eye: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>',
  clock: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>',
  file: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"/><polyline points="13 2 13 9 20 9"/></svg>',
  link: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>',
  share: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg>',
};

/* ---------- TOAST NOTIFICATION ---------- */
function toast(msg, type = "info", duration = 2600) {
  let container = document.getElementById("toastContainer");
  if (!container) {
    container = document.createElement("div");
    container.id = "toastContainer";
    container.className = "toast-container";
    document.body.appendChild(container);
  }
  const icons = {
    success: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>',
    error: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>',
    info: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>',
  };
  const t = document.createElement("div");
  t.className = "toast toast-" + type;
  t.innerHTML = (icons[type] || icons.info) + "<span>" + esc(msg) + "</span>";
  container.appendChild(t);
  requestAnimationFrame(() => t.classList.add("show"));
  setTimeout(() => {
    t.classList.remove("show");
    setTimeout(() => t.remove(), 300);
  }, duration);
}

/* ---------- CLIPBOARD (multi-fallback) ---------- */
async function copyToClipboard(text) {
  if (navigator.clipboard && window.isSecureContext) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch (_) {}
  }
  try {
    const ta = document.createElement("textarea");
    ta.value = text;
    ta.setAttribute("readonly", "");
    ta.style.position = "fixed";
    ta.style.top = "-9999px";
    document.body.appendChild(ta);
    ta.select();
    ta.setSelectionRange(0, 99999);
    const ok = document.execCommand("copy");
    document.body.removeChild(ta);
    return ok;
  } catch (_) {
    return false;
  }
}

/* ---------- FETCH ---------- */
async function loadPastes() {
  els.loading.classList.remove("hidden");
  els.empty.classList.add("hidden");
  els.list.innerHTML = "";

  try {
    const res = await fetch("/api/pastes");
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Gagal memuat");
    state.pastes = data.pastes || [];
    applyFilter();
  } catch (e) {
    els.list.innerHTML = `
      <div class="empty" style="grid-column:1/-1">
        <h3>Gagal memuat</h3>
        <p>${esc(e.message)}</p>
      </div>`;
    toast("Gagal memuat data", "error");
  } finally {
    els.loading.classList.add("hidden");
  }
}

function applyFilter() {
  const q = (els.search.value || "").trim().toLowerCase();
  let arr = !q
    ? [...state.pastes]
    : state.pastes.filter((p) =>
        (p.title + " " + p.description + " " + p.language + " " + p.filename)
          .toLowerCase()
          .includes(q)
      );

  if (state.sortBy === "newest") arr.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  else if (state.sortBy === "oldest") arr.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
  else if (state.sortBy === "popular") arr.sort((a, b) => (b.views || 0) - (a.views || 0));
  else if (state.sortBy === "az") arr.sort((a, b) => (a.title || "").localeCompare(b.title || ""));

  state.filtered = arr;
  render();
}

/* ---------- RENDER ---------- */
function render() {
  els.countBadge.textContent = state.filtered.length;
  els.statTotal.textContent = state.pastes.length;
  els.statViews.textContent = state.pastes.reduce((s, p) => s + (p.views || 0), 0);

  if (state.filtered.length === 0) {
    els.list.innerHTML = "";
    els.empty.classList.remove("hidden");
    return;
  }
  els.empty.classList.add("hidden");

  els.list.innerHTML = state.filtered
    .map(
      (p) => `
    <article class="card" data-id="${esc(p.id)}">
      <div class="card-head">
        <div class="card-title">${esc(p.title)}</div>
        <span class="lang-badge">${esc(p.language)}</span>
      </div>
      ${p.description ? `<div class="card-desc">${esc(p.description)}</div>` : ""}
      <div class="card-preview">${esc(p.preview || "")}${p.size > 200 ? "..." : ""}</div>
      <div class="card-meta">
        <span>${ICON.clock} ${timeAgo(p.createdAt)}</span>
        <span>${ICON.eye} ${p.views || 0}</span>
      </div>
      <div class="card-actions">
        <button class="card-action" data-act="open" title="Buka">
          ${ICON.file}<span>Buka</span>
        </button>
        <button class="card-action" data-act="copylink" title="Copy Link">
          ${ICON.link}<span>Link</span>
        </button>
        <button class="card-action" data-act="share" title="Share">
          ${ICON.share}<span>Share</span>
        </button>
      </div>
    </article>`
    )
    .join("");

  els.list.querySelectorAll(".card").forEach((c) => {
    const id = c.dataset.id;
    c.querySelectorAll("[data-act]").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        e.stopPropagation();
        const act = btn.dataset.act;
        if (act === "open") openView(id);
        else if (act === "copylink") quickCopyLink(id);
        else if (act === "share") quickShare(id);
      });
    });
    c.addEventListener("click", () => openView(id));
  });
}

/* ---------- QUICK ACTIONS ---------- */
async function quickCopyLink(id) {
  const url = location.origin + "/?id=" + id;
  const ok = await copyToClipboard(url);
  if (ok) toast("Link tersalin ke clipboard!", "success");
  else toast("Gagal copy. Link: " + url, "info", 5000);
}

async function quickShare(id) {
  const p = state.pastes.find((x) => x.id === id);
  if (!p) return;
  const url = location.origin + "/?id=" + id;
  if (navigator.share) {
    try {
      await navigator.share({
        title: p.title + " — GENOS DEV",
        text: (p.description || "Cek script ini di GENOS DEV") + "\n\n" + url,
        url: url,
      });
      return;
    } catch (err) {
      if (err && err.name === "AbortError") return;
    }
  }
  const ok = await copyToClipboard(url);
  if (ok) toast("Link tersalin — tinggal paste ke mana aja!", "success");
  else toast("Copy manual: " + url, "info", 5000);
}

/* ---------- VIEW ---------- */
async function openView(id) {
  els.viewTitle.textContent = "Memuat...";
  els.viewDesc.textContent = "";
  els.viewMeta.innerHTML = "";
  els.viewCode.textContent = "// loading...";
  els.viewFilename.textContent = "script.txt";
  els.viewSize.textContent = "0 B";
  els.viewLang.textContent = "...";
  openModal(els.viewModal);

  try {
    const res = await fetch("/api/pastes/" + id);
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Gagal memuat");
    const p = data.paste;
    state.current = p;

    els.viewTitle.textContent = p.title;
    els.viewLang.textContent = p.language;
    els.viewDesc.textContent = p.description || "";
    els.viewDesc.style.display = p.description ? "block" : "none";
    els.viewFilename.textContent = p.filename || "script.txt";
    els.viewSize.textContent = formatSize((p.content || "").length);
    els.viewCode.textContent = p.content || "";
    els.viewCode.className = "language-" + (p.language || "text");

    els.viewMeta.innerHTML = `
      <span>${ICON.clock} ${timeAgo(p.createdAt)}</span>
      <span>${ICON.eye} ${p.views || 0} views</span>
      <span>${ICON.file} ${esc(p.filename || "script.txt")}</span>
    `;

    if (window.hljs) {
      try { hljs.highlightElement(els.viewCode); } catch (_) {}
    }

    try {
      history.replaceState(null, "", "/?id=" + p.id);
    } catch (_) {}
  } catch (e) {
    closeModal(els.viewModal);
    toast("Gagal: " + e.message, "error");
  }
}

function openModal(m) {
  m.classList.add("active");
  m.setAttribute("aria-hidden", "false");
  document.body.style.overflow = "hidden";
}

function closeModal(m) {
  m.classList.remove("active");
  m.setAttribute("aria-hidden", "true");
  document.body.style.overflow = "";
  try {
    if (location.search.includes("id=")) history.replaceState(null, "", "/");
  } catch (_) {}
}

/* ---------- ACTIONS ---------- */
async function copyCode() {
  if (!state.current) return;
  const ok = await copyToClipboard(state.current.content);
  toast(ok ? "Kode tersalin!" : "Gagal copy kode", ok ? "success" : "error");
}

function downloadCode() {
  if (!state.current) return;
  const p = state.current;
  try {
    const blob = new Blob([p.content], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = p.filename || p.id + ".txt";
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    toast("Download dimulai", "success");
  } catch (e) {
    toast("Gagal download: " + e.message, "error");
  }
}

async function shareCode() {
  if (!state.current) return;
  const p = state.current;
  const url = location.origin + "/?id=" + p.id;

  if (navigator.share) {
    try {
      await navigator.share({
        title: p.title + " — GENOS DEV",
        text: (p.description || "Cek script ini di GENOS DEV") + "\n\n" + url,
        url: url,
      });
      return;
    } catch (err) {
      if (err && err.name === "AbortError") return;
    }
  }

  const ok = await copyToClipboard(url);
  if (ok) {
    toast("Link tersalin — tinggal paste di mana aja!", "success");
    return;
  }

  toast("Copy manual: " + url, "info", 6000);
}

async function copyLink() {
  if (!state.current) return;
  const url = location.origin + "/?id=" + state.current.id;
  const ok = await copyToClipboard(url);
  toast(ok ? "Link tersalin!" : "Gagal copy link", ok ? "success" : "error");
}

/* ---------- TAP ZONE (admin secret) ---------- */
els.tapzone.addEventListener("pointerdown", () => {
  const now = Date.now();
  if (now - state.lastTap < 450) {
    state.lastTap = 0;
    els.pwInput.value = "";
    els.pwAlert.classList.add("hidden");
    openModal(els.pwModal);
    setTimeout(() => els.pwInput.focus(), 100);
  } else {
    state.lastTap = now;
  }
});

/* ---------- PASSWORD ---------- */
els.pwSubmit.addEventListener("click", () => {
  const val = els.pwInput.value;
  if (val === ADMIN_PASS) {
    sessionStorage.setItem("genos_auth", "1");
    window.location.href = "/admin.html";
  } else {
    els.pwAlert.classList.remove("hidden");
    els.pwInput.value = "";
    els.pwInput.focus();
    toast("Password salah", "error");
  }
});

els.pwInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter") els.pwSubmit.click();
});

/* ---------- MODAL EVENTS ---------- */
document.querySelectorAll("[data-close]").forEach((el) =>
  el.addEventListener("click", () => closeModal(els.viewModal))
);
document.querySelectorAll("[data-close-pw]").forEach((el) =>
  el.addEventListener("click", () => closeModal(els.pwModal))
);
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") {
    closeModal(els.viewModal);
    closeModal(els.pwModal);
  }
});

els.btnCopy.addEventListener("click", copyCode);
els.btnDownload.addEventListener("click", downloadCode);
els.btnShare.addEventListener("click", shareCode);
if (els.btnCopyLink) els.btnCopyLink.addEventListener("click", copyLink);

/* ---------- INIT ---------- */
els.refresh.addEventListener("click", () => {
  loadPastes();
  toast("Diperbarui", "info", 1200);
});
els.search.addEventListener("input", applyFilter);
if (els.sortSelect) {
  els.sortSelect.addEventListener("change", (e) => {
    state.sortBy = e.target.value;
    applyFilter();
  });
}
document.getElementById("year").textContent = new Date().getFullYear();

const params = new URLSearchParams(location.search);
const deepId = params.get("id");

loadPastes().then(() => {
  if (deepId) openView(deepId);
});
