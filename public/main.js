/* ========= GENOS DEV — MAIN ========= */

const state = {
  pastes: [],
  filtered: [],
  current: null,
  lastTap: 0,
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

  // view modal
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

  // pw modal
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
  code: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg>',
};

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
  } finally {
    els.loading.classList.add("hidden");
  }
}

function applyFilter() {
  const q = (els.search.value || "").trim().toLowerCase();
  state.filtered = !q
    ? state.pastes
    : state.pastes.filter((p) =>
        (p.title + " " + p.description + " " + p.language + " " + p.filename)
          .toLowerCase()
          .includes(q)
      );
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
      ${
        p.description
          ? `<div class="card-desc">${esc(p.description)}</div>`
          : ""
      }
      <div class="card-preview">${esc(p.preview || "")}${
        p.size > 200 ? "..." : ""
      }</div>
      <div class="card-meta">
        <span>${ICON.clock} ${timeAgo(p.createdAt)}</span>
        <span>${ICON.eye} ${p.views || 0}</span>
      </div>
    </article>`
    )
    .join("");

  els.list.querySelectorAll(".card").forEach((c) => {
    c.addEventListener("click", () => openView(c.dataset.id));
  });
}

/* ---------- VIEW ---------- */
async function openView(id) {
  try {
    const res = await fetch("/api/pastes/" + id);
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Gagal memuat");
    const p = data.paste;
    state.current = p;

    els.viewTitle.textContent = p.title;
    els.viewLang.textContent = p.language;
    els.viewDesc.textContent = p.description || "Tanpa deskripsi.";
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

    openModal(els.viewModal);

    if (window.hljs) {
      try { hljs.highlightElement(els.viewCode); } catch (_) {}
    }
  } catch (e) {
    alert("Gagal: " + e.message);
  }
}

function openModal(m) { m.classList.add("active"); m.setAttribute("aria-hidden", "false"); }
function closeModal(m) { m.classList.remove("active"); m.setAttribute("aria-hidden", "true"); }

/* ---------- ACTIONS ---------- */
async function copyCode() {
  if (!state.current) return;
  try {
    await navigator.clipboard.writeText(state.current.content);
    flashBtn(els.btnCopy, "Tersalin!");
  } catch {
    alert("Gagal copy");
  }
}

function downloadCode() {
  if (!state.current) return;
  const p = state.current;
  const blob = new Blob([p.content], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = p.filename || p.id + ".txt";
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

async function shareCode() {
  if (!state.current) return;
  const url = location.origin + "/?id=" + state.current.id;
  if (navigator.share) {
    try {
      await navigator.share({
        title: state.current.title,
        text: state.current.description || "Cek script ini di GENOS DEV",
        url,
      });
      return;
    } catch {}
  }
  try {
    await navigator.clipboard.writeText(url);
    flashBtn(els.btnShare, "Link tersalin!");
  } catch {
    prompt("Copy link ini:", url);
  }
}

function flashBtn(btn, txt) {
  const label = btn.querySelector("span");
  const orig = label.textContent;
  label.textContent = txt;
  setTimeout(() => { label.textContent = orig; }, 1400);
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

/* ---------- INIT ---------- */
els.refresh.addEventListener("click", loadPastes);
els.search.addEventListener("input", applyFilter);
document.getElementById("year").textContent = new Date().getFullYear();

// deep link ?id=xxx
const params = new URLSearchParams(location.search);
const deepId = params.get("id");

loadPastes().then(() => {
  if (deepId) openView(deepId);
});