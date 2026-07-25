# Schema

Sumber kebenaran: `prisma/schema.prisma` (PostgreSQL).

## Enums

| Enum | Values |
|------|--------|
| `Role` | `SUPER_ADMIN`, `STAFF`, `TRADER` |
| `UserStatus` | `ACTIVE`, `DISABLED` |
| `CommandStatus` | `PENDING`, `ACKED`, `FAILED` |
| `PackageStatus` | `ACTIVE`, `INACTIVE` |
| `MemberStatus` | `ACTIVE`, `INACTIVE` |

---

## `Package`

Tabel paket langganan/produk.

| Column (DB) | Prisma | Type | Notes |
|-------------|--------|------|-------|
| `id` | `id` | `TEXT` PK | `cuid()` |
| `name` | `name` | `TEXT` | |
| `description` | `description` | `TEXT` | default `""` |
| `status` | `status` | `PackageStatus` | default `ACTIVE` |
| `createdAt` | `createdAt` | `TIMESTAMP` | |
| `updatedAt` | `updatedAt` | `TIMESTAMP` | |

---

## `members`

Tabel member (akun trading + kredensial). Mapped via `@@map("members")`.

| Column (DB) | Prisma | Type | Notes |
|-------------|--------|------|-------|
| `id` | `id` | `TEXT` PK | `cuid()` |
| `package_id` | `packageId` | `TEXT` FK | → `Package.id` |
| `name` | `name` | `TEXT` | Nama member |
| `email` | `email` | `TEXT` | |
| `password` | `password` | `TEXT` | Password akun member |
| `id_trading` | `idTrading` | `TEXT` | Login ID broker |
| `password_trading` | `passwordTrading` | `TEXT` | Password akun trading |
| `server_broker` | `serverBroker` | `TEXT` | Server broker |
| `status` | `status` | `MemberStatus` | default `ACTIVE` |

Index: `members_package_id_idx` on `package_id`.

---

## `users`

Tabel pengguna dashboard (admin / staff / trader).

| Column (DB) | Prisma | Type | Notes |
|-------------|--------|------|-------|
| `id` | `id` | `TEXT` PK | `cuid()` |
| `email` | `email` | `TEXT` | unique |
| `password_hash` | `passwordHash` | `TEXT` | |
| `role` | `role` | `Role` | |
| `status` | `status` | `UserStatus` | default `ACTIVE` |
| `display_name` | `displayName` | `TEXT?` | |
| `created_by_id` | `createdById` | `TEXT?` FK | → `users.id` |
| `created_at` | `createdAt` | `TIMESTAMP` | |
| `updated_at` | `updatedAt` | `TIMESTAMP` | |

---

## `sessions`

Sesi login pengguna.

| Column (DB) | Prisma | Type | Notes |
|-------------|--------|------|-------|
| `id` | `id` | `TEXT` PK | `cuid()` |
| `user_id` | `userId` | `TEXT` FK | → `users.id`, cascade delete |
| `token_hash` | `tokenHash` | `TEXT` | unique |
| `expires_at` | `expiresAt` | `TIMESTAMP` | |
| `user_agent` | `userAgent` | `TEXT?` | |
| `ip` | `ip` | `VARCHAR(64)?` | |
| `last_seen_at` | `lastSeenAt` | `TIMESTAMP?` | |
| `created_at` | `createdAt` | `TIMESTAMP` | |

Index: `user_id`.

---

## `terminals`

Terminal EA (MQ5).

| Column (DB) | Prisma | Type | Notes |
|-------------|--------|------|-------|
| `id` | `id` | `TEXT` PK | `cuid()` |
| `terminal_id` | `terminalId` | `TEXT` | unique; `[A-Za-z0-9_-]` |
| `name` | `name` | `TEXT` | |
| `api_key_hash` | `apiKeyHash` | `TEXT` | |
| `api_key_enc` | `apiKeyEnc` | `TEXT?` | AES-GCM; reveal Super Admin |
| `owner_user_id` | `ownerUserId` | `TEXT` FK | → `users.id` |
| `created_by_id` | `createdById` | `TEXT` FK | → `users.id` |
| `enabled` | `enabled` | `BOOLEAN` | default `true` |
| `expires_at` | `expiresAt` | `TIMESTAMP?` | null = tanpa expiry |
| `last_seen_at` | `lastSeenAt` | `TIMESTAMP?` | |
| `created_at` | `createdAt` | `TIMESTAMP` | |
| `updated_at` | `updatedAt` | `TIMESTAMP` | |

Index: `owner_user_id`.

---

## `terminal_snapshots`

Snapshot status terakhir dari heartbeat terminal.

| Column (DB) | Prisma | Type | Notes |
|-------------|--------|------|-------|
| `id` | `id` | `TEXT` PK | `cuid()` |
| `terminal_id` | `terminalId` | `TEXT` FK | unique → `terminals.id`, cascade |
| `status` | `status` | `TEXT` | `on` \| `off` \| `paused` |
| `account` | `account` | `BIGINT?` | |
| `symbol` | `symbol` | `TEXT?` | |
| `balance` | `balance` | `DECIMAL(18,2)?` | |
| `equity` | `equity` | `DECIMAL(18,2)?` | |
| `positions` | `positions` | `INT` | default `0` |
| `buy` | `buy` | `INT` | default `0` |
| `sell` | `sell` | `INT` | default `0` |
| `float_pnl` | `floatPnl` | `DECIMAL(18,2)?` | |
| `daily_pnl` | `dailyPnl` | `DECIMAL(18,2)?` | |
| `layer` | `layer` | `DECIMAL(18,2)?` | |
| `multiplier` | `multiplier` | `DECIMAL(18,4)?` | |
| `target` | `target` | `DECIMAL(18,2)?` | |
| `cutloss` | `cutloss` | `DECIMAL(18,2)?` | |
| `mode` | `mode` | `INT?` | `0` conservative, `1` aggressive |
| `entry_mode` | `entryMode` | `INT?` | `0` two-way, `1` one-way |
| `max_lot` | `maxLot` | `DECIMAL(18,4)?` | |
| `max_layer` | `maxLayer` | `INT?` | |
| `trade_time` | `tradeTime` | `BOOLEAN?` | schedule enabled |
| `trade_start_min` | `tradeStartMin` | `INT?` | menit dari midnight WIB |
| `trade_end_min` | `tradeEndMin` | `INT?` | |
| `raw_json` | `rawJson` | `JSON?` | |
| `updated_at` | `updatedAt` | `TIMESTAMP` | |

---

## `commands`

Perintah remote ke terminal.

| Column (DB) | Prisma | Type | Notes |
|-------------|--------|------|-------|
| `id` | `id` | `TEXT` PK | `cuid()` |
| `terminal_id` | `terminalId` | `TEXT` FK | → `terminals.id`, cascade |
| `text` | `text` | `TEXT` | e.g. `/on`, `/setlayer 500` |
| `status` | `status` | `CommandStatus` | default `PENDING` |
| `result_message` | `resultMessage` | `TEXT?` | |
| `actor_user_id` | `actorUserId` | `TEXT?` FK | → `users.id` |
| `created_at` | `createdAt` | `TIMESTAMP` | |
| `acked_at` | `ackedAt` | `TIMESTAMP?` | |

Index: `(terminal_id, status, created_at)`.

---

## `audit_logs`

Log aksi admin.

| Column (DB) | Prisma | Type | Notes |
|-------------|--------|------|-------|
| `id` | `id` | `TEXT` PK | `cuid()` |
| `actor_user_id` | `actorUserId` | `TEXT?` FK | → `users.id` |
| `action` | `action` | `TEXT` | |
| `meta` | `meta` | `JSON?` | |
| `created_at` | `createdAt` | `TIMESTAMP` | |

Index: `created_at`.
