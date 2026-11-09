const MODEL = "xai/grok-imagine-video";

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (url.pathname === "/api/health" && request.method === "GET") {
      return json({ ok: true, configured: Boolean(env.CLOUDFLARE_ACCOUNT_ID && env.CLOUDFLARE_API_TOKEN) });
    }

    if (url.pathname === "/api/generate" && request.method === "POST") {
      if (!env.CLOUDFLARE_ACCOUNT_ID || !env.CLOUDFLARE_API_TOKEN) {
        return json({ error: "Server belum dikonfigurasi. Tambahkan CLOUDFLARE_ACCOUNT_ID dan CLOUDFLARE_API_TOKEN sebagai secret." }, 503);
      }

      let body;
      try { body = await request.json(); }
      catch { return json({ error: "Body JSON tidak valid." }, 400); }

      const prompt = typeof body.prompt === "string" ? body.prompt.trim() : "";
      const duration = Number(body.duration ?? 5);
      const aspect_ratio = body.aspect_ratio ?? "16:9";
      const resolution = body.resolution ?? "720p";

      if (!prompt || prompt.length > 2000) return json({ error: "Prompt wajib diisi (maksimal 2.000 karakter)." }, 400);
      if (!Number.isInteger(duration) || duration < 1 || duration > 15) return json({ error: "Durasi harus 1–15 detik." }, 400);
      if (!["1:1", "16:9", "9:16", "4:3", "3:4", "3:2", "2:3"].includes(aspect_ratio)) return json({ error: "Rasio video tidak valid." }, 400);
      if (!["480p", "720p"].includes(resolution)) return json({ error: "Resolusi tidak valid." }, 400);

      try {
        const endpoint = `https://api.cloudflare.com/client/v4/accounts/${env.CLOUDFLARE_ACCOUNT_ID}/ai/run`;
        const upstream = await fetch(endpoint, {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${env.CLOUDFLARE_API_TOKEN}`,
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            model: MODEL,
            input: { prompt, duration, aspect_ratio, resolution }
          })
        });

        const data = await upstream.json().catch(() => ({}));
        if (!upstream.ok) {
          const message = data?.errors?.map(e => e.message).filter(Boolean).join("; ") || data?.error || `Cloudflare API error (${upstream.status})`;
          return json({ error: message }, upstream.status);
        }

        const result = data?.result ?? data;
        const videoUrl = result?.video ?? result?.url ?? result?.output?.video;
        if (!videoUrl || typeof videoUrl !== "string") {
          return json({ error: "Permintaan diterima, tetapi URL video tidak ditemukan pada respons. Periksa format respons/model di dashboard Cloudflare.", raw: result }, 502);
        }
        return json({ videoUrl, model: MODEL, state: data?.state ?? "Completed" });
      } catch (err) {
        return json({ error: err?.message || "Tidak dapat menghubungi Cloudflare." }, 502);
      }
    }

    return env.ASSETS.fetch(request);
  }
};

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store" }
  });
}
