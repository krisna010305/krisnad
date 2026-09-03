# Terakoya Quiz — Vercel + .env + Upstash Redis

Tidak memakai SQL dan tidak perlu VPS/laptop menyala. Frontend tetap `index.html`; akun murid dibaca dari `MURID_DATA` di Vercel Environment Variables; poin/completion persisten disimpan di Upstash Redis.

## 1. Buat database Redis
Di Vercel Marketplace tambahkan **Upstash for Redis** ke project. Vercel akan menyediakan environment variables Redis ke function. Upstash mendukung serverless/Vercel lewat koneksi HTTP. 

## 2. Tambahkan environment variables
Gunakan `.env.example` sebagai acuan. Contoh:

`MURID_DATA={"andi":{"password":"123"},"budi":{"password":"456"}}`

Lalu set:

- `ADMIN_USERNAME`
- `ADMIN_PASSWORD`
- `SESSION_SECRET`
- `UPSTASH_REDIS_REST_URL`
- `UPSTASH_REDIS_REST_TOKEN`

Jangan commit `.env` ke Git.

## 3. Deploy
Upload folder project ini ke repository GitHub lalu import ke Vercel, atau deploy dengan Vercel CLI.

## Aturan leaderboard
- Sesi 1/2/3 selesai: belum ada poin leaderboard.
- Sesi 1+2+3+4 selesai: +1 poin.
- `runId` yang sama tidak bisa menambah poin dua kali.
- Ranking dihitung dari poin terbesar.
- `index.html` melakukan polling leaderboard tiap 5 detik sehingga perubahan poin terlihat live tanpa SSE/long-lived server.

## Mengubah akun murid
Karena akun berada di Environment Variables, tambah/ubah username/password dilakukan di Vercel Project → Settings → Environment Variables, lalu redeploy agar perubahan environment dipakai oleh deployment baru.
