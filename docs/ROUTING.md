# SMH Routing & App Areas

> **Maintenance:** Setiap penambahan route, rename URL, atau pemindahan area (member/admin/public/API), **wajib update file ini** di PR/commit yang sama. Semua docs proyek ada di `docs/` (bukan `Doc/`).

Terakhir diubah: 2026-07-25

## Halaman error (Next.js)

| File | Kapan muncul |
|------|----------------|
| `src/app/not-found.tsx` | URL tidak ada / `notFound()` |
| `src/app/error.tsx` | Error di segment (bisa di-reset) |
| `src/app/global-error.tsx` | Error di root layout |
| UI bersama | `src/components/shared/error-view.tsx` |

## Ringkasan area

| Area | Base URL | Folder | Siapa |
|------|----------|--------|-------|
| **Public web** | `/` | `src/app/page.tsx` | Pengunjung (Coming Soon + link member) |
| **Member portal** | `/member/*` | `src/app/member/` | Role `TRADER` |
| **Admin** | `/admin/*` | `src/app/(admin)/admin/` | Role `SUPER_ADMIN`, `STAFF` |
| **Web API (session)** | `/api/account`, `/api/auth`, … | `src/app/api/` | Browser (cookie session) |
| **EA bridge API** | `/api/v1/terminals/*` | `src/app/api/v1/` | SMH_Controller MQ5 (ApiKey) |

## Member URLs

| Path | Keterangan |
|------|------------|
| `/member/login` | Login (juga dipakai admin untuk masuk, lalu redirect by role) |
| `/member/register` | Pendaftaran member |
| `/member` | Beranda member (auth) |
| `/member/account` | Daftar akun / terminal |
| `/member/account/[id]` | Detail + kontrol EA |
| `/member/profile` | Profil, keamanan, info |

Layout auth member: `src/app/member/(portal)/layout.tsx`  
Login/register **di luar** `(portal)` supaya tidak kena guard session.

## Admin URLs

| Path | Keterangan |
|------|------------|
| `/admin` | Dashboard |
| `/admin/account` | Manajemen akun |
| `/admin/users`, `/admin/members`, … | Sesuai sidebar |

## Public root

- `/` = Coming Soon situs publik (bukan portal member); CTA ke `/member/login` & `/member/register`.
- Setelah login, trader diarahkan ke `/member` (`homePathForRole`).

## Legacy redirects (jangan dihapus sampai tidak ada traffic lama)

| Lama | Baru |
|------|------|
| `/login` | `/member/login` |
| `/register` | `/member/register` |
| `/account`, `/account/[id]` | `/member/account…` |
| `/profile` | `/member/profile` |

## Auth helpers

- `isMemberRole` → `TRADER`
- `isAdminRole` → `SUPER_ADMIN` \| `STAFF`
- `homePathForRole(TRADER)` → `/member`
- `homePathForRole(STAFF)` → `/admin/users`
- `homePathForRole(SUPER_ADMIN)` → `/admin`

Middleware: unauthenticated non-public → redirect `/member/login`.

## API naming (web vs EA)

- UI/session: `/api/account/*` (selaras istilah “account” di member UI)
- Controller MQ5: tetap `/api/v1/terminals/*` (jangan diganti tanpa update EA)

## Checklist saat ubah routing

1. Update page/layout di `src/app/…`
2. Update link di komponen (bottom nav, cards, forms, logout)
3. Update `homePathForRole` / middleware `PUBLIC` list
4. Tambah redirect legacy jika path lama masih mungkin di-bookmark
5. **Update dokumen ini**
