const $ = (sel) => document.querySelector(sel);

function normalize(s) {
  return (s || "").toLowerCase().trim();
}

function uniqueTags(ideas) {
  const set = new Set();
  ideas.forEach(i => (i.tags || []).forEach(t => set.add(t)));
  return Array.from(set).sort((a,b) => a.localeCompare(b));
}

function renderIdeaCard(idea) {
  const tags = (idea.tags || []).map(t => `<span class="tag">${t}</span>`).join("");
  const meta = `
    <div class="meta">
      <span>Disclosed: ${idea.dateDisclosed}</span>
      <span>Updated: ${idea.lastUpdated}</span>
      <span>Status: ${idea.status || "—"}</span>
    </div>
  `;

  return `
    <article class="card idea-card">
      <h2>${idea.title}</h2>
      ${meta}
      <div class="tagline">${tags}</div>
      <p class="muted" style="margin-top:10px;">${idea.abstract || ""}</p>
      <a class="text-link" href="mailto:anr388@pitt.edu?subject=${encodeURIComponent(idea.title)}"> Contact about this project →</a>
    </article>
  `;
}

// Simple “detail” view via modal-like alert-free approach: open a new tab with URL hash
// (If you want separate idea pages later, we can add idea.html easily.)
function openIdea(ideas, id) {
  const idea = ideas.find(x => x.id === id);
  if (!idea) return;

  const links = (idea.links || [])
    .map(l => `- ${l.label}: ${l.url}`)
    .join("\n");

  const text =
`${idea.title}

Author: Your Name
Initial public disclosure: ${idea.dateDisclosed}
Last updated: ${idea.lastUpdated}
Status: ${idea.status || "—"}
Tags: ${(idea.tags || []).join(", ")}

Abstract:
${idea.abstract || ""}

Links:
${links || "(none)"}
`;

  // Open a new window with preformatted text (quick and simple).
  const w = window.open("", "_blank");
  w.document.write(`<pre style="white-space:pre-wrap;font-family:ui-monospace,Menlo,Consolas,monospace;padding:16px;max-width:900px;margin:0 auto;">${escapeHtml(text)}</pre>`);
  w.document.title = idea.title;
}

function escapeHtml(str) {
  return str.replace(/[&<>"']/g, m => ({
    "&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#039;"
  }[m]));
}

async function main() {
  const yearEl = document.getElementById("year");
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  const res = await fetch("assets/ideas.json", { cache: "no-store" });
  const data = await res.json();
  const ideas = data.ideas || [];

  $("#updated").textContent = data.lastUpdated ? `Last updated: ${data.lastUpdated}` : "";
  const tagSel = $("#tag");
  uniqueTags(ideas).forEach(t => {
    const opt = document.createElement("option");
    opt.value = t;
    opt.textContent = t;
    tagSel.appendChild(opt);
  });

  function apply() {
    const q = normalize($("#q").value);
    const tag = $("#tag").value;

    let filtered = ideas.slice();

    if (tag) filtered = filtered.filter(i => (i.tags || []).includes(tag));
    if (q) {
      filtered = filtered.filter(i => {
        const hay = normalize(
          `${i.title} ${i.abstract} ${(i.tags || []).join(" ")} ${i.status || ""}`
        );
        return hay.includes(q);
      });
    }

    // Sort newest disclosure first
    filtered.sort((a,b) => (b.dateDisclosed || "").localeCompare(a.dateDisclosed || ""));

    $("#count").textContent = `${filtered.length} idea${filtered.length === 1 ? "" : "s"}`;

    const html = filtered.map(renderIdeaCard).join("");
    $("#ideasGrid").innerHTML = html || `<div class="card"><p class="muted">No matches.</p></div>`;

    // attach handlers
    document.querySelectorAll("[data-open]").forEach(a => {
      a.addEventListener("click", (e) => {
        e.preventDefault();
        openIdea(ideas, a.getAttribute("data-open"));
      });
    });
  }

  $("#q").addEventListener("input", apply);
  $("#tag").addEventListener("change", apply);

  apply();
}

main().catch(err => {
  console.error(err);
  const grid = document.getElementById("ideasGrid");
  if (grid) grid.innerHTML = `<div class="card"><p class="muted">Failed to load ideas.json</p></div>`;
});