# FrameForge — AI Video Generator

Website text-to-video sederhana dengan Cloudflare AI Gateway/Workers AI endpoint, model `xai/grok-imagine-video`, dan Cloudflare Workers. UI berbahasa Indonesia dan responsif untuk desktop/mobile.

## Fitur
- Text-to-video dari prompt
- Rasio 16:9, 9:16, 1:1, 4:3, 3:4, 3:2, 2:3
- Durasi 1–15 detik (opsi UI: 5, 8, 10, 15)
- Resolusi 480p/720p
- Preview, tautan unduh, dan riwayat lokal browser
- Token Cloudflare hanya berada di environment Worker

## Prasyarat
- Akun Cloudflare dengan akses AI dan billing/credits yang sesuai
- Cloudflare Account ID
- Cloudflare API Token dengan permission Account > Workers AI > Read (ikuti dokumentasi Cloudflare terbaru)
- Node.js 20+ dan akun GitHub

## Jalankan lokal
1. Salin `.dev.vars.example` menjadi `.dev.vars`.
2. Isi `CLOUDFLARE_ACCOUNT_ID` dan `CLOUDFLARE_API_TOKEN` di `.dev.vars`.
3. Jalankan:

   ```bash
   npm install
   npm run dev
   ```

## Deploy ke Cloudflare
Tambahkan secret (jangan pernah commit token ke Git):

```bash
npx wrangler secret put CLOUDFLARE_ACCOUNT_ID
npx wrangler secret put CLOUDFLARE_API_TOKEN
npm run deploy
```

`CLOUDFLARE_ACCOUNT_ID` dan `CLOUDFLARE_API_TOKEN` dibaca di server Worker. Jangan menaruhnya di file `public`, JavaScript browser, atau variabel `VITE_*`/`NEXT_PUBLIC_*`.

## Upload ke GitHub
Buat repository baru, lalu dari folder proyek:

```bash
git init
git add .
git commit -m "Initial FrameForge AI video generator"
git branch -M main
git remote add origin https://github.com/USERNAME/REPOSITORY.git
git push -u origin main
```

Jika GitHub connector sudah terhubung, repo bisa dibuat/push melalui integrasi tersebut.

## Catatan API
Backend memanggil `POST https://api.cloudflare.com/client/v4/accounts/{ACCOUNT_ID}/ai/run` dengan model `xai/grok-imagine-video`. Model ini merupakan model pihak ketiga yang tersedia melalui Cloudflare AI, sehingga biaya dan ketersediaannya mengikuti akun Cloudflare. Periksa harga dan akses model di dashboard sebelum produksi.

Dokumentasi model: https://developers.cloudflare.com/ai/models/xai/grok-imagine-video/
