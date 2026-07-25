# Relation

Relasi antar tabel di SMH Dashboard. Sumber: `prisma/schema.prisma`.

## Overview

```
User ──< Session
 │
 ├── createdBy ──> User (self)
 │
 ├── owns ──< Terminal ──1─ TerminalSnapshot
 │              │
 │              └──< Command
 │                     │
 └── actor ────────────┘
 │
 └── actor ──< AuditLog

Package ──< Member
```

---

## Package → Member

| | |
|--|--|
| Kardinalitas | `Package` **1** — **N** `Member` |
| FK | `members.package_id` → `Package.id` |
| On delete | `RESTRICT` |
| On update | `CASCADE` |

Satu paket punya banyak member. Member wajib punya satu paket. Hapus paket ditolak jika masih ada member.

---

## User → User (createdBy)

| | |
|--|--|
| Kardinalitas | `User` **1** — **N** `User` |
| Relasi Prisma | `UserCreatedBy` |
| FK | `users.created_by_id` → `users.id` |
| Nullable | ya (`created_by_id` boleh null) |

Pengguna bisa dibuat oleh pengguna lain (audit siapa yang create).

---

## User → Session

| | |
|--|--|
| Kardinalitas | `User` **1** — **N** `Session` |
| FK | `sessions.user_id` → `users.id` |
| On delete | `CASCADE` |

Hapus user → semua sesinya ikut terhapus.

---

## User → Terminal

Dua relasi terpisah:

### Owner

| | |
|--|--|
| Kardinalitas | `User` **1** — **N** `Terminal` |
| Relasi Prisma | `TerminalOwner` |
| FK | `terminals.owner_user_id` → `users.id` |

### Creator

| | |
|--|--|
| Kardinalitas | `User` **1** — **N** `Terminal` |
| Relasi Prisma | `TerminalCreator` |
| FK | `terminals.created_by_id` → `users.id` |

Satu terminal punya satu owner dan satu creator (bisa orang yang sama).

---

## Terminal → TerminalSnapshot

| | |
|--|--|
| Kardinalitas | `Terminal` **1** — **0..1** `TerminalSnapshot` |
| FK | `terminal_snapshots.terminal_id` → `terminals.id` |
| Unique | `terminal_id` (satu snapshot per terminal) |
| On delete | `CASCADE` |

---

## Terminal → Command

| | |
|--|--|
| Kardinalitas | `Terminal` **1** — **N** `Command` |
| FK | `commands.terminal_id` → `terminals.id` |
| On delete | `CASCADE` |

---

## User → Command (actor)

| | |
|--|--|
| Kardinalitas | `User` **1** — **N** `Command` |
| Relasi Prisma | `CommandActor` |
| FK | `commands.actor_user_id` → `users.id` |
| Nullable | ya |

Siapa yang mengirim perintah (boleh null).

---

## User → AuditLog (actor)

| | |
|--|--|
| Kardinalitas | `User` **1** — **N** `AuditLog` |
| FK | `audit_logs.actor_user_id` → `users.id` |
| Nullable | ya |

---

## Catatan

- `Member` **tidak** terhubung ke `User` / `Terminal` saat ini — hanya ke `Package`.
- `Terminal.terminal_id` (string MQ5) berbeda dari PK internal `terminals.id`.
- Snapshot & command merujuk ke PK internal (`terminals.id`), bukan string `terminal_id` MQ5.
