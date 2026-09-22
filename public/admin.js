/* ========= GENOS DEV — ADMIN ========= */

const ADMIN_PASS = "121012";

if (sessionStorage.getItem("genos_auth") !== "1") {
  window.location.replace("/");
}

const state = {
  pastes: [],
  editing: null,
  uploading: false,
};

const els = {
  formTitle: document.getElementById("formTitle"),
  submitLabel: document.getElementById("submitLabel"),
  submitBtn: document.getElementById("submitBtn"),
  cancelEditBtn: document.getElementById("cancelEditBtn"),
  formAlert: document.getElementById("formAlert"),

  titleInput: document.getElementById("titleInput"),
  filenameInput: document.getElementById("filenameInput"),
  langSelect: document.getElementById("langSelect"),
  descInput: document.getElementById("descInput"),
  contentInput: document.getElementById("contentInput"),
  fileInput: document.getElementById("fileInput"),
  fileLabel: document.getElementById("fileLabel"),

  pasteList: document.getElementById("pasteList"),
  countBadge: document.getElementById("countBadge"),
  logoutBtn: document.getElementById("logoutBtn"),
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
  return new Date(date).toLocaleDateString("id-ID");
}

function showAlert(msg, type = "info", autoHide = true) {
  els.formAlert.textContent = msg;
  els.formAlert.className = "alert " + type;
  if (autoHide) {
    clearTimeout(showAlert._t);
    showAlert._t = setTimeout(() => {
      els.formAlert.className = "alert hidden";
    }, 3000);
  }
}

function detectLang(filename) {
  const ext = (filename.split(".").pop() || "").toLowerCase();
  const map = {
    js: "javascript", mjs: "javascript", cjs: "javascript",
    ts: "typescript", tsx: "typescript", jsx: "javascript",
    py: "python", php: "php", sh: "bash", bash: "bash",
    json: "json", html: "html", htm: "html", css: "css",
    sql: "sql", go: "go", java: "java", cpp: "cpp", c: "cpp",
    txt: "text", md: "text",
  };
  return map[ext] || "text";
}

/* ---------- FILE UPLOAD ---------- */
els.fileInput.addEventListener("change", async (e) => {
  const f = e.target.files?.[0];
  if (!f) return;
  if (f.size > 900 * 1024) {
    showAlert("File terlalu besar (max 900KB)", "error");
    els.fileInput.value = "";
    return;
  }
  try {
    const text = await f.text();
    els.contentInput.value = text;
    els.fileLabel.textContent = f.name + " (" + Math.round(f.size / 1024) + " KB)";
    if (!els.filenameInput.value.trim()) els.filenameInput.value = f.name;
    if (!els.titleInput.value.trim()) els.titleInput.value = f.name.replace(/\.[^.]+$/, "");
    const lang = detectLang(f.name);
    if ([...els.langSelect.options].some((o) => o.value === lang)) {
      els.langSelect.value = lang;
    }
    showAlert("File berhasil dimuat: " + f.name, "success");
  } catch (err) {
    showAlert("Gagal baca file: " + err.message, "error");
  }
});

/* ---------- CRUD ---------- */
async function loadPastes() {
  els.pasteList.innerHTML = '<div class="loading"><div class="spinner"></div><p>Memuat...</p></div>';
  try {
    const res = await fetch("/api/pastes");
    const data = await res.json();
    state.pastes = data.pastes || [];
    renderList();
  } catch (e) {
    els.pasteList.innerHTML = `<div class="empty"><h3>Gagal memuat</h3><p>${esc(e.message)}</p></div>`;
  }
}

function renderList() {
  els.countBadge.textContent = state.pastes.length;
  if (state.pastes.length === 0) {
    els.pasteList.innerHTML = `<div class="empty"><h3>Belum ada script</h3><p>Buat script pertama dari form.</p></div>`;
    return;
  }
  els.pasteList.innerHTML = state.pastes
    .map(
      (p) => `
    <div class="paste-item" data-id="${esc(p.id)}">
      <div class="paste-item-info">
        <div class="paste-item-title">${esc(p.title)}</div>
        <div class="paste-item-sub">${esc(p.id)} · ${esc(p.language)} · ${timeAgo(p.createdAt)} · ${p.views || 0} views</div>
      </div>
      <div class="paste-item-actions">
        <a href="/?id=${esc(p.id)}" target="_blank" class="btn btn-sm btn-blue">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
          <span>Lihat</span>
        </a>
        <button class="btn btn-sm btn-yellow" data-action="edit">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
          <span>Edit</span>
        </button>
        <button class="btn btn-sm btn-red" data-action="delete">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6M14 11v6"/></svg>
          <span>Hapus</span>
        </button>
      </div>
    </div>`
    )
    .join("");

  els.pasteList.querySelectorAll(".paste-item").forEach((item) => {
    const id = item.dataset.id;
    item.querySelector('[data-action="edit"]').addEventListener("click", () => startEdit(id));
    item.querySelector('[data-action="delete"]').addEventListener("click", () => deletePaste(id));
  });
}

async function submitForm() {
  const title = els.titleInput.value.trim();
  const filename = els.filenameInput.value.trim() || "script.txt";
  const language = els.langSelect.value;
  const description = els.descInput.value.trim();
  const content = els.contentInput.value;

  if (!title) return showAlert("Judul wajib diisi", "error");
  if (!content.trim()) return showAlert("Kode masih kosong", "error");

  els.submitBtn.disabled = true;
  const isEdit = !!state.editing;
  const orig = els.submitLabel.textContent;
  els.submitLabel.textContent = isEdit ? "Menyimpan..." : "Mempublish...";

  try {
    const url = isEdit ? "/api/pastes/" + state.editing : "/api/pastes";
    const method = isEdit ? "PUT" : "POST";
    const res = await fetch(url, {
      method,
      headers: {
        "Content-Type": "application/json",
        "X-Admin-Pass": ADMIN_PASS,
      },
      body: JSON.stringify({ title, filename, language, description, content }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Gagal");

    showAlert(isEdit ? "Script berhasil diupdate" : "Script berhasil dipublish", "success");
    resetForm();
    loadPastes();
  } catch (e) {
    showAlert("Gagal: " + e.message, "error", false);
  } finally {
    els.submitBtn.disabled = false;
    els.submitLabel.textContent = isEdit ? "Update Script" : "Publish Script";
  }
}

function startEdit(id) {
  const p = state.pastes.find((x) => x.id === id);
  if (!p) return;
  // ambil data lengkap
  fetch("/api/pastes/" + id)
    .then((r) => r.json())
    .then((data) => {
      const full = data.paste;
      state.editing = id;
      els.formTitle.textContent = "EDIT SCRIPT";
      els.submitLabel.textContent = "Update Script";
      els.cancelEditBtn.classList.remove("hidden");
      els.titleInput.value = full.title || "";
      els.filenameInput.value = full.filename || "";
      els.langSelect.value = full.language || "javascript";
      els.descInput.value = full.description || "";
      els.contentInput.value = full.content || "";
      els.fileLabel.textContent = "Pilih file...";
      window.scrollTo({ top: 0, behavior: "smooth" });
      showAlert("Mode edit: " + full.title, "info");
    })
    .catch((e) => showAlert("Gagal load: " + e.message, "error"));
}

async function deletePaste(id) {
  const p = state.pastes.find((x) => x.id === id);
  if (!confirm(`Hapus "${p?.title || id}"?`)) return;
  try {
    const res = await fetch("/api/pastes/" + id, {
      method: "DELETE",
      headers: { "X-Admin-Pass": ADMIN_PASS },
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Gagal");
    showAlert("Script dihapus", "success");
    if (state.editing === id) resetForm();
    loadPastes();
  } catch (e) {
    showAlert("Gagal hapus: " + e.message, "error", false);
  }
}

function resetForm() {
  state.editing = null;
  els.formTitle.textContent = "BUAT SCRIPT BARU";
  els.submitLabel.textContent = "Publish Script";
  els.cancelEditBtn.classList.add("hidden");
  els.titleInput.value = "";
  els.filenameInput.value = "";
  els.langSelect.value = "javascript";
  els.descInput.value = "";
  els.contentInput.value = "";
  els.fileInput.value = "";
  els.fileLabel.textContent = "Pilih file...";
}

/* ---------- EVENTS ---------- */
els.submitBtn.addEventListener("click", submitForm);
els.cancelEditBtn.addEventListener("click", () => {
  resetForm();
  showAlert("Edit dibatalkan", "info");
});

els.logoutBtn.addEventListener("click", () => {
  sessionStorage.removeItem("genos_auth");
  window.location.href = "/";
});

/* ---------- INIT ---------- */
document.getElementById("year").textContent = new Date().getFullYear();
loadPastes();