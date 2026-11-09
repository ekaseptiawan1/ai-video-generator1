const $ = (id) => document.getElementById(id);
const promptEl = $("prompt");
const generateBtn = $("generate");
const HISTORY_KEY = "frameforge-history-v1";
let latestVideoUrl = "";

promptEl.addEventListener("input", () => $("counter").textContent = `${promptEl.value.length} / 2000`);

function readHistory() {
  try { return JSON.parse(localStorage.getItem(HISTORY_KEY) || "[]"); } catch { return []; }
}
function saveHistory(item) {
  const items = [item, ...readHistory()].slice(0, 12);
  localStorage.setItem(HISTORY_KEY, JSON.stringify(items));
  renderHistory();
}
function renderHistory() {
  const items = readHistory();
  const host = $("historyList");
  if (!items.length) { host.innerHTML = '<div class="empty-history">Your generated videos will be saved in this browser.</div>'; return; }
  host.innerHTML = items.map((item, i) => `<article class="history-item"><video src="${escapeAttr(item.url)}" controls preload="metadata"></video><div class="history-meta"><p title="${escapeAttr(item.prompt)}">${escapeHtml(item.prompt)}</p><a href="${escapeAttr(item.url)}" target="_blank" rel="noreferrer">Open video ↗</a></div></article>`).join("");
}
function escapeHtml(s) { return String(s).replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c])); }
function escapeAttr(s) { return escapeHtml(s); }

generateBtn.addEventListener("click", async () => {
  const prompt = promptEl.value.trim();
  if (!prompt) { $("message").textContent = "Masukkan deskripsi video terlebih dahulu."; promptEl.focus(); return; }
  generateBtn.disabled = true;
  generateBtn.innerHTML = '<span>✦</span> Generating… <span class="arrow">◌</span>';
  $("message").textContent = "Mengirim prompt ke Cloudflare AI. Proses dapat memerlukan waktu.";
  $("previewState").textContent = "GENERATING";
  $("preview").innerHTML = '<div class="preview-center"><div class="play-icon">◌</div><b>Creating your video…</b><span>AI is bringing your idea to life</span></div>';
  $("resultActions").classList.add("hidden");

  try {
    const response = await fetch("/api/generate", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prompt, duration: Number($("duration").value), aspect_ratio: $("ratio").value, resolution: $("resolution").value })
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || `Request failed (${response.status})`);
    if (!data.videoUrl) throw new Error("URL video tidak ditemukan pada respons API.");
    latestVideoUrl = data.videoUrl;
    $("preview").innerHTML = `<video src="${escapeAttr(data.videoUrl)}" controls autoplay playsinline></video><div class="preview-corner">FRAMEFORGE / GENERATED</div>`;
    $("previewState").textContent = "COMPLETED";
    $("download").href = data.videoUrl;
    $("resultActions").classList.remove("hidden");
    $("message").textContent = "Video berhasil dibuat. Kamu bisa memutar atau mengunduhnya.";
    saveHistory({ url: data.videoUrl, prompt, createdAt: new Date().toISOString() });
  } catch (err) {
    $("previewState").textContent = "ERROR";
    $("preview").innerHTML = '<div class="preview-center"><div class="play-icon">!</div><b>Generation failed</b><span>Periksa konfigurasi dan coba lagi</span></div>';
    $("message").textContent = err.message || "Terjadi kesalahan.";
  } finally {
    generateBtn.disabled = false;
    generateBtn.innerHTML = '<span>✦</span> Generate video <span class="arrow">→</span>';
  }
});

$("copyLink").addEventListener("click", async () => {
  if (!latestVideoUrl) return;
  try { await navigator.clipboard.writeText(latestVideoUrl); $("copyLink").textContent = "Copied!"; }
  catch { $("copyLink").textContent = "Copy unavailable"; }
  setTimeout(() => $("copyLink").textContent = "Copy link", 1600);
});
$("clearHistory").addEventListener("click", () => {
  if (confirm("Hapus riwayat video dari browser ini?")) { localStorage.removeItem(HISTORY_KEY); renderHistory(); }
});
renderHistory();
