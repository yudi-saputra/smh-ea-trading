# Handoff Maintenance — SMH / EA Trading

Dokumen ini untuk orang yang baru merawat app. Dibaca top-down: pahami dulu **apa yang ada**, lalu **bagaimana data bergerak**, lalu **siapa boleh masuk**, lalu **apa yang berbahaya**, baru **cara mengubah dengan aman**.

**Stack singkat:** Next.js (App Router) + React + Prisma + PostgreSQL.  
**Fungsi produk:** dashboard web mengontrol EA MetaTrader lewat **SMH_Controller** yang memanggil API `/api/v1/terminals/*`.

Dokumen terkait:

| File | Isi |
|------|-----|
| [ROUTING.md](./ROUTING.md) | Peta URL & checklist ubah route |
| [DEPLOY.md](./DEPLOY.md) | Deploy VPS + Docker |
| [Schema.md](./Schema.md) | Skema database |
| [Relation.md](./Relation.md) | Relasi antar tabel |
| `SMH_Controller_v1.1.mq5` | Source Controller MQ5 |
| `SMH_v1.1.mq5` | Source EA trading |

Terakhir diubah: 2026-07-25

---

## 1. File map

Peta folder supaya kamu tahu **harus buka file mana** saat ada bug.

### 1.1 Folder root

| File / folder | Fungsi singkat | Risiko yang perlu dicek | Cara aman mengubahnya |
|---------------|----------------|-------------------------|------------------------|
| `src/` | Semua kode web (halaman, API, komponen, lib) | Salah edit bisa bikin login / command EA mati | Ubah kecil, uji path yang terkait; jangan refactor besar tanpa alasan |
| `prisma/` | Skema DB + migrasi + seed | Migrasi salah = data rusak / app crash | Edit `schema.prisma` → migrate → generate; update `docs/Schema.md` + `Relation.md` |
| `docs/` | Dokumentasi resmi proyek (+ source MQ5) | Docs usang = maintenance salah arah | Update docs di commit yang sama dengan perubahan kode |
| `public/` | File statis (termasuk upload banner) | Hapus file = gambar hilang di UI | Jangan hapus folder `public/banners/` sembarangan |
| `data/` | Data file (bukan DB), contoh `home-banners.json` | File hilang / JSON invalid = banner error | Backup dulu; edit JSON dengan hati-hati |
| `.env` / `.env.example` | `DATABASE_URL`, seed admin, secret | Secret bocor / DB URL salah = app mati | Jangan commit `.env`; ikut contoh di `.env.example` |
| `Dockerfile` / `docker-compose.yml` / `docker/` | Deploy VPS (app + Postgres + Caddy) | Misconfig env / volume = data hilang atau SSL gagal | Ikuti `docs/DEPLOY.md`; backup volume sebelum eksperimen |
| `package.json` | Script: `dev`, `db:migrate`, `db:seed`, dll. | Ubah script tanpa paham = workflow rusak | Tambah script baru; jangan ganti nama script yang sudah dipakai tim |
| `.cursor/rules/` | Aturan agent (mis. wajib update ROUTING) | Diabaikan = docs & route tidak sinkron | Ikuti rule; update `docs/ROUTING.md` saat ubah URL |

### 1.2 Area di dalam `src/`

| File / folder | Fungsi singkat | Risiko yang perlu dicek | Cara aman mengubahnya |
|---------------|----------------|-------------------------|------------------------|
| `src/app/` | Routing Next.js: halaman + API | Path salah = 404 / redirect loop | Ikuti area: public `/`, member `/member`, admin `/admin`; update `docs/ROUTING.md` |
| `src/app/member/` | Portal trader | Guard session putus = member terkunci | Login/register **di luar** `(portal)/`; halaman auth di dalam `(portal)/` |
| `src/app/(admin)/admin/` | Portal admin/staff | Role check longgar = staff lihat data terlarang | Jaga `layout.tsx` + helper role di `lib/auth.ts` |
| `src/app/api/` | API browser (cookie session) | Ownership skip = orang lihat terminal orang lain | Selalu cek session + owner di handler |
| `src/app/api/v1/` | API untuk EA Controller (ApiKey) | **Paling kritis** — EA offline jika path/payload berubah | Jangan rename path tanpa update file `.mq5` |
| `src/components/admin/` | UI admin (sidebar, tabel, form) | Tabel besar mudah break filter/aksi | Ubah UI dulu; logic hak akses tetap di API/lib |
| `src/components/member/` | UI member (kartu akun, kontrol EA) | Command salah / tombol tanpa guard | Command lewat API whitelist; jangan hardcode path lama |
| `src/components/auth/` | Form login/register bersama | Variant admin/member tertukar | Perhatikan `variant` form & endpoint API-nya |
| `src/components/ui/` | Komponen UI dasar (button, dialog, …) | Ubah global = seluruh UI berubah | Prefer ubah di komponen fitur, bukan di primitive |
| `src/lib/` | Otak bisnis: auth, DB, command, crypto | Salah satu file di sini bisa impact luas | Baca caller dulu; fix di helper bersama, bukan copy-paste per halaman |
| `src/middleware.ts` | Pintu depan: cek cookie ada/tidak | PUBLIC list salah = halaman terbuka / semua redirect login | Tambah path public hanya jika benar-benar publik; uji login admin + member |

### 1.3 Halaman penting

| File terikat | Fungsi singkat | Risiko | Cara aman |
|--------------|----------------|--------|-----------|
| `src/app/page.tsx` | Landing publik `/` | Jangan jadikan portal member | Portal trader tetap di `/member` |
| `src/app/member/login/page.tsx` | Login member | Redirect `next` bisa disalahgunakan | Tetap batasi redirect ke path internal |
| `src/app/member/(portal)/layout.tsx` | Guard session member | Hilangkan `getSessionMember` = portal terbuka | Jangan bypass guard |
| `src/app/member/(portal)/account/[id]/page.tsx` | Detail terminal + kontrol EA | ID terminal orang lain | Server harus cek ownership via `getTerminalForMember` |
| `src/app/admin/login/page.tsx` | Login admin (di luar layout admin) | Jangan masukkan ke `(admin)` group | Biarkan di luar supaya bisa diakses tanpa session |
| `src/app/(admin)/admin/layout.tsx` | Shell + guard admin | Role TRADER masuk admin | Redirect non-admin ke home role masing-masing |
| Redirect legacy: `src/app/login`, `register`, `account`, `profile` | URL lama → `/member/...` | Dihapus = bookmark user rusak | Jangan hapus sampai traffic lama nol; lihat `docs/ROUTING.md` |

### 1.4 Lib penting (otak app)

| File terikat | Fungsi singkat | Risiko | Cara aman |
|--------------|----------------|--------|-----------|
| `src/lib/db.ts` | Koneksi Prisma | Client stale setelah migrate | Setelah schema change: migrate + generate; bump `PRISMA_CLIENT_REV` jika HMR aneh |
| `src/lib/auth.ts` | Session admin (`smh_session`), role, akses terminal | Privilege escalation | Ubah permission di helper ini, bukan di tiap halaman |
| `src/lib/auth-member.ts` | Session member (`smh_member_session`) | Member akses terminal orang lain | Selalu pakai `getTerminalForMember` / `requireMember` |
| `src/lib/crypto.ts` | Hash password/token/ApiKey, nama cookie, enkripsi key | Ganti algoritma = semua login/EA gagal | Jangan ganti hash/cookie name tanpa migrasi data |
| `src/lib/terminal-auth.ts` | Auth Bearer ApiKey untuk MQ5 | Auth longgar = siapa saja kirim heartbeat | Tetap wajib `Authorization: Bearer …` + cocokkan hash |
| `src/lib/commands.ts` | Whitelist perintah Phase-1 | Command baru di UI tapi tidak di list = ditolak | Tambah ke set **dan** update handler di Controller MQ5 |
| `src/lib/terminal-live.ts` | Status online (jendela ~30s), weekend forex | Threshold salah = “offline” palsu | Ubah angka dengan hati-hati; uji heartbeat |
| `src/lib/api.ts` | Format response JSON sukses/error | Format berubah = frontend bingung | Pertahankan shape `{ ok, … }` yang sudah dipakai |
| `src/lib/home-banners.ts` | Banner dari file JSON + `public/banners` | Bukan tabel Prisma | Jangan cari model Banner di DB |

### 1.5 MQ5 (bukan di `src/`)

| File terikat | Fungsi singkat | Risiko | Cara aman |
|--------------|----------------|--------|-----------|
| `docs/SMH_Controller_v1.1.mq5` | Heartbeat, ambil command, ack | Path API hardcoded | Ubah server **bersamaan** dengan file ini |
| `docs/SMH_v1.1.mq5` | EA trading | Logic trading | Pisahkan dari perubahan dashboard kecuali sengaja sync command |

---

## 2. Data flow

Alur data dari layar manusia sampai EA di MetaTrader.

### Gambar besar

```
Browser (Admin / Member)
    │  cookie session
    ▼
Next.js page / fetch ke /api/*
    │  requireUser / requireMember
    ▼
PostgreSQL (Prisma)
    │
    │  Admin buat Terminal (terminalId + ApiKey) untuk Member
    ▼
SMH_Controller di MT5
    │  Authorization: Bearer <ApiKey>
    ▼
POST/GET /api/v1/terminals/:terminalId/...
    │
    ▼
Update TerminalSnapshot / ambil Command PENDING / ack Command
```

**Intinya:** UI **mengantri** perintah di tabel `commands`. Controller **menjemput** perintah lewat API v1. Bukan UI yang langsung “menekan” EA.

### 2.1 Alur per jenis data

| File terikat | Fungsi singkat | Risiko yang perlu dicek | Cara aman mengubahnya |
|--------------|----------------|-------------------------|------------------------|
| `prisma/schema.prisma` | Sumber kebenaran struktur data | Relasi putus / field hilang | Migrasi resmi; update Schema.md + Relation.md |
| `src/app/api/account/**` | CRUD terminal + enqueue command (cookie) | Dual auth admin+member mudah miss ownership | Ikuti pola cek session yang sudah ada di route |
| `src/app/api/account/[id]/commands/route.ts` | UI kirim perintah → status `PENDING` | Command di luar whitelist | Lewat `normalizeCommandText` + `isAllowedPhase1Command` |
| `src/app/api/v1/terminals/.../heartbeat` | EA laporkan hidup + telemetry | Nama field beda = angka di UI kosong/salah | Additive field OK; rename field = update MQ5 + UI |
| `src/app/api/v1/terminals/.../commands` | EA ambil antrian perintah | Auth ApiKey skip = terminal orang lain kebaca | Wajib `authenticateTerminal` |
| `src/app/api/v1/terminals/.../ack` | EA laporkan sukses/gagal | Status macet di `PENDING` | Pastikan ack update `CommandStatus` |
| `src/lib/terminal-live.ts` | “Online” dari `lastSeenAt` | Timeout terlalu ketat/longgar | Sesuaikan window (default ~30s) dengan interval heartbeat EA |
| `data/home-banners.json` + `public/banners/` | Banner beranda (file, bukan DB) | Deploy tanpa folder = banner hilang | Deploy sertakan `data/` + `public/banners/` |

### 2.2 Model DB yang paling sering disentuh

| Model | Tabel | Fungsi singkat | Risiko | Cara aman |
|-------|-------|----------------|--------|-----------|
| `Member` | `members` | Akun portal trader | Hapus member tanpa handle terminal | Cek `ownedTerminals` dulu |
| `MemberSession` | `member_sessions` | Login member | Token hash mismatch | Jangan ubah cara hash token tanpa logout massal |
| `User` | `users` | SUPER_ADMIN / STAFF (TRADER legacy) | Role TRADER di User vs Member portal | Login trader baru lewat `/member/login`, bukan `/api/auth/login` |
| `Session` | `sessions` | Login admin/staff | Cookie name berubah = semua logout | Sinkronkan `crypto.ts` + middleware |
| `Terminal` | `terminals` | Identitas EA (`terminalId`), ApiKey, owner, expiry | ApiKey hash berubah = semua EA offline | Jangan rehash massal tanpa re-issue key |
| `TerminalSnapshot` | `terminal_snapshots` | Data terakhir dari heartbeat | Field telemetry berubah | Update heartbeat route + UI pembaca |
| `Command` | `commands` | Antrian perintah + ack | Status stuck | Cek poll + ack Controller |
| `Package` | `Package` | Paket langganan member | Member tanpa package | Create member selalu pilih package valid |
| `AuditLog` | `audit_logs` | Jejak aksi admin | Hilang audit = susah investigasi | Jangan matikan write audit sembarangan |

> **Catatan pemula:** ada **dua jenis “user”**.  
> - **Admin/Staff** = tabel `User`  
> - **Trader** = tabel `Member`  
> Jangan campur cookie / helper-nya.

---

## 3. Auth flow

Siapa boleh masuk ke mana.

### Gambar besar

```
/admin/login  → POST /api/auth/login
                → cookie smh_session
                → SUPER_ADMIN → /admin
                → STAFF → /admin/users

/member/login → POST /api/member/auth/login
                → cookie smh_member_session
                → /member

/api/v1/...   → TIDAK pakai cookie
                → Bearer ApiKey (terminal)
```

### 3.1 File auth

| File terikat | Fungsi singkat | Risiko yang perlu dicek | Cara aman mengubahnya |
|--------------|----------------|-------------------------|------------------------|
| `src/middleware.ts` | Cek **ada cookie atau tidak** (bukan cek role di DB) | PUBLIC terlalu luas = API terbuka; terlalu sempit = lockout | Uji: tanpa login, dengan member, dengan admin, hit `/api/v1` |
| `src/lib/crypto.ts` | Nama cookie: `smh_session`, `smh_member_session` | Rename cookie tanpa migrasi | Kalau harus ganti nama: support dua nama sementara |
| `src/lib/auth.ts` | `getSessionUser`, `requireUser`, role helpers | STAFF dapat akses terminal (harusnya tidak) | Pakai `canAccessTerminals` / filter owner yang sudah ada |
| `src/lib/auth-member.ts` | `getSessionMember`, `requireMember` | Session expired tetap lolos | Percaya layout + `require*` di API, bukan middleware saja |
| `src/app/api/auth/login/route.ts` | Login admin/staff | Masih menerima TRADER User | Biarkan block TRADER → suruh ke `/member/login` |
| `src/app/api/member/auth/login/route.ts` | Login member | Password plain legacy | Biarkan rehash on login jika sudah ada |
| `src/app/api/member/auth/logout/route.ts` | Logout member | Cookie tidak terhapus | Clear cookie + hapus row session |
| `src/app/api/auth/logout/route.ts` | Logout admin | Sama | Sama |
| `src/lib/terminal-auth.ts` | Auth EA | ApiKey di log / response | Jangan log raw ApiKey; simpan hash (+ optional encrypt untuk reveal admin) |
| `src/app/member/(portal)/layout.tsx` | Guard halaman member | Hanya cek cookie di middleware | Layout wajib `getSessionMember()` |
| `src/app/(admin)/admin/layout.tsx` | Guard halaman admin + role | TRADER User nyasar ke admin | Redirect ke `/member` jika role member-like |

### 3.2 Area & cookie

| Area URL | Cookie wajib | Dicek lebih dalam di | Risiko | Cara aman |
|----------|--------------|----------------------|--------|-----------|
| `/member/*` (kecuali login/register) | `smh_member_session` | `(portal)/layout.tsx` + `/api/member/*` | Admin cookie **tidak** cukup untuk member area | Jangan “pinjam” session admin ke portal member |
| `/admin/*` | `smh_session` | `(admin)/layout.tsx` + role | STAFF vs SUPER_ADMIN beda hak | Cek helper role sebelum fitur baru |
| `/api/account/*` | salah satu cookie | Handler (dual path) | Lupa cek ownership | Copy pola route account yang sudah ada |
| `/api/v1/*` | **tidak** (public di middleware) | `authenticateTerminal` | Menganggap “public” = tanpa auth | Auth = ApiKey, bukan cookie |

### 3.3 Role praktis

| Role | Masuk ke | Terminal | Command EA | Risiko | Cara aman |
|------|----------|----------|------------|--------|-----------|
| `SUPER_ADMIN` | `/admin` | Semua | Ya | Terlalu banyak orang jadi SUPER_ADMIN | Minimalkan akun SUPER_ADMIN |
| `STAFF` | `/admin/users` | Tidak (filter kosong) | Tidak | Accidental grant terminal access | Ubah permission hanya di `auth.ts` |
| Member (portal) | `/member` | Milik sendiri | Ya (milik sendiri) | IDOR lewat URL `/member/account/[id]` | Server-side ownership check |

---

## 4. Risk map

Daftar “kalau salah di sini, sistem rusak besar”. Prioritas dari atas.

### 4.1 Zona merah (sangat hati-hati)

| File terikat | Fungsi singkat | Risiko yang perlu dicek | Cara aman mengubahnya |
|--------------|----------------|-------------------------|------------------------|
| `src/app/api/v1/terminals/**` | Kontrak dengan MQ5 Controller | Rename path / ubah auth / ubah JSON = **semua terminal offline** | Perubahan **additive**; update `docs/SMH_Controller_v1.1.mq5` di commit yang sama |
| `src/lib/terminal-auth.ts` | Validasi ApiKey | Skip auth / bandingkan plain text | Tetap hash compare; tolak jika header hilang |
| `src/lib/commands.ts` | Whitelist perintah | UI kirim command yang Controller tidak kenal (atau sebaliknya) | Sync list dengan `ProcessCommand` di MQ5 |
| `src/lib/crypto.ts` | Hash & cookie & encrypt key | Rotasi `API_KEY_SECRET` sembarangan = key tidak bisa di-reveal; ganti hash = EA putus | Rotasi = rencana re-issue ApiKey |
| `src/middleware.ts` | Gate cookie | `/api/v1` ikut kena session cookie = EA 401 | Biarkan `/api/v1` di PUBLIC; auth di terminal-auth |
| `prisma/schema.prisma` + migrations | Struktur data | Drop kolom yang dipakai heartbeat/command | Migrasi bertahap; jangan force-reset production |

### 4.2 Zona kuning (hati-hati)

| File terikat | Fungsi singkat | Risiko | Cara aman |
|--------------|----------------|--------|-----------|
| `src/lib/auth.ts` / `auth-member.ts` | Hak akses | Privilege bug | Satu sumber kebenaran untuk permission |
| `src/app/api/account/**` | API bersama admin+member | Ownership bolong | Test sebagai member A tidak bisa akses terminal member B |
| Heartbeat → snapshot | Telemetry live | Field mismatch | Bandingkan payload MQ5 dengan upsert Prisma |
| `docs/ROUTING.md` | Peta URL | Route pindah tapi docs/nav lama | Checklist di ROUTING.md wajib diikuti |
| Legacy redirect pages | Bookmark lama | Dihapus terlalu cepat | Hapus hanya setelah yakin tidak ada traffic |

### 4.3 Checklist cepat sebelum deploy

1. Login admin + login member masih jalan?
2. Heartbeat dari Controller masih 200?
3. Kirim `/status` atau `/on` dari UI → command jadi `ACKED`?
4. Member A tidak bisa buka terminal Member B?
5. Kalau ubah URL: `docs/ROUTING.md` + nav + legacy redirect sudah diupdate?

---

## 5. Change guide

Resep aman untuk perubahan umum.

### 5.1 Mau menambah halaman

| File terikat | Fungsi singkat | Risiko | Cara aman |
|--------------|----------------|--------|-----------|
| `src/app/member/(portal)/...` atau `src/app/(admin)/admin/...` | Page baru | Salah area = auth salah | Letakkan di folder area yang benar |
| `src/components/member/bottom-nav.tsx` atau `src/components/admin/layout/app-sidebar.tsx` / `nav-main.tsx` | Link navigasi | Link mati / path lama | Update nav di commit yang sama |
| `src/middleware.ts` | PUBLIC list | Halaman sensitif jadi publik | Hanya tambah ke PUBLIC jika memang boleh tanpa login |
| `docs/ROUTING.md` | Dokumentasi URL | Tim lain bingung | **Wajib** update (aturan proyek) |
| Legacy `src/app/<path-lama>/page.tsx` | Redirect | Bookmark putus | Jika mengganti URL publik lama, buat redirect |

**Langkah aman:**

1. Buat page di folder area yang benar.  
2. Jaga login/register tetap di luar layout ter-guard.  
3. Update nav.  
4. Update `docs/ROUTING.md`.  
5. Kalau mengganti URL lama → tambah redirect.

### 5.2 Mau menambah / mengubah API session (browser)

| File terikat | Fungsi singkat | Risiko | Cara aman |
|--------------|----------------|--------|-----------|
| `src/app/api/.../route.ts` | Endpoint baru | Lupa `requireUser` / `requireMember` | Selalu auth di handler |
| `src/lib/api.ts` | Response helper | Shape beda-beda | Pakai `jsonOk` / `jsonError` / `handleRouteError` |
| Ownership helpers di `auth.ts` / `auth-member.ts` | Batasi data | IDOR | Ambil resource lewat helper “for user/member” |

**Langkah aman:**

1. Tentukan: API ini untuk admin, member, atau keduanya?  
2. Panggil `require*` yang tepat.  
3. Cek ownership sebelum mutate.  
4. Kembalikan JSON dengan helper yang sudah ada.

### 5.3 Mau mengubah API EA (`/api/v1/terminals/*`)

| File terikat | Fungsi singkat | Risiko | Cara aman |
|--------------|----------------|--------|-----------|
| `src/app/api/v1/terminals/...` | Kontrak server | Breaking change | Additive only jika bisa |
| `src/lib/terminal-auth.ts` | Auth | Melemahkan auth | Jangan longgarkan |
| `docs/SMH_Controller_v1.1.mq5` | Client EA | Versi tidak match | Deploy server + compile Controller bareng |
| `src/lib/commands.ts` | Whitelist | Command ghost | Sync dengan `ProcessCommand` |

**Langkah aman:**

1. Jangan ganti path base `/api/v1/terminals/:terminalId/...` tanpa rencana update semua EA.  
2. Field baru: tambahkan di server dulu (abaikan jika belum ada), lalu update MQ5.  
3. Uji: health → heartbeat → commands → ack.

### 5.4 Mau mengubah database

| File terikat | Fungsi singkat | Risiko | Cara aman |
|--------------|----------------|--------|-----------|
| `prisma/schema.prisma` | Definisi model | Breaking migration | Hindari drop kolom yang masih dibaca kode/EA |
| `prisma/migrations/` | Riwayat SQL | Manual edit migration lama | Buat migrasi baru, jangan rewrite history production |
| `src/lib/db.ts` | Client | Stale client di dev | `db:generate`; bump `PRISMA_CLIENT_REV` bila perlu |
| `docs/Schema.md`, `docs/Relation.md` | Docs DB | Docs dusta | Update di commit yang sama |

**Langkah aman:**

1. Edit schema.  
2. `npm run db:migrate`  
3. `npm run db:generate`  
4. Update kode yang membaca/menulis field itu.  
5. Update `docs/Schema.md` + `docs/Relation.md`.

### 5.5 Mau menambah perintah EA baru (mis. `/foobar`)

| File terikat | Fungsi singkat | Risiko | Cara aman |
|--------------|----------------|--------|-----------|
| `docs/SMH_Controller_v1.1.mq5` | Handler command di MT5 | Server terima tapi EA abaikan | Implement di Controller dulu/bersamaan |
| `src/lib/commands.ts` | Whitelist server | UI bisa kirim tapi ditolak | Tambah token ke `PHASE1_COMMANDS` |
| UI kontrol (`src/components/member/...`) | Tombol/input | User kirim teks bebas berbahaya | Tetap lewat normalisasi + whitelist |

**Langkah aman:**

1. Tambah handler di Controller.  
2. Tambah ke `PHASE1_COMMANDS`.  
3. (Opsional) tambah tombol UI.  
4. Uji end-to-end sampai status `ACKED`.

### 5.6 Mau mengubah banner beranda

| File terikat | Fungsi singkat | Risiko | Cara aman |
|--------------|----------------|--------|-----------|
| `src/lib/home-banners.ts` | Baca/tulis file banner | Path salah | Jangan pindah ke Prisma kecuali sengaja migrasi besar |
| `data/home-banners.json` | Metadata banner | JSON corrupt | Validasi sebelum write |
| `public/banners/` | File gambar | File orphan | Hapus file ikut saat hapus banner di admin |
| `src/app/api/admin/banners/**` | API admin | Auth skip | Tetap di balik admin session |

---

## Cheat sheet pemula

| Mau … | Buka dulu … |
|-------|-------------|
| Ubah URL / menu | `docs/ROUTING.md` + page di `src/app/...` + nav |
| Bug login admin | `src/lib/auth.ts`, `/api/auth/login`, cookie `smh_session` |
| Bug login member | `src/lib/auth-member.ts`, `/api/member/auth/login`, cookie `smh_member_session` |
| EA offline / tidak heartbeat | `/api/v1/terminals/.../heartbeat`, `terminal-auth.ts`, ApiKey di Terminal |
| Perintah tidak jalan | `commands` table status, `commands.ts` whitelist, Controller ack |
| Salah data di DB | `prisma/schema.prisma`, `docs/Schema.md`, `docs/Relation.md` |
| Banner rusak | `data/home-banners.json`, `public/banners/`, `home-banners.ts` |

---

## Aturan emas

1. **Dua pintu login** — admin (`User` + `smh_session`) vs member (`Member` + `smh_member_session`).  
2. **Jangan sentuh** `/api/v1/terminals/*` tanpa update MQ5 Controller.  
3. **Middleware hanya cek cookie ada**; hak akses sungguhan di layout + `require*` + ownership.  
4. **Docs wajib ikut** — routing → `ROUTING.md`; schema → `Schema.md` + `Relation.md`.  
5. **Perubahan terkecil yang benar** lebih baik daripada refactor besar saat maintenance darurat.
