# SMH Docs

Satu folder dokumentasi proyek: **`docs/`**.

| File | Isi |
|------|-----|
| [HANDOFF.md](./HANDOFF.md) | Panduan maintenance: file map, data flow, auth, risk map, change guide |
| [DEPLOY.md](./DEPLOY.md) | Deploy VPS + Docker (Caddy, Postgres, domain) |
| [ROUTING.md](./ROUTING.md) | Peta URL (public / member / admin / API), legacy redirect, checklist ubah route |
| [Schema.md](./Schema.md) | Skema database (dari Prisma) |
| [Relation.md](./Relation.md) | Relasi antar tabel |
| `SMH_v1.1.mq5` | Source EA trading |
| `SMH_Controller_v1.1.mq5` | Source Controller (heartbeat / commands) |
| `Smart_MH.mq5` | Referensi EA lama (jika masih dipakai) |

## Aturan update

Setiap perubahan yang menyentuh topik di atas **wajib** update file terkait di folder ini (commit yang sama).

Jangan buat folder `Doc/` terpisah lagi.
