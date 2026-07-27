-- Remove legacy TRADER role: members use Member portal, not User.role.

-- Detach terminals owned by TRADER users before delete.
UPDATE "terminals"
SET "owner_user_id" = NULL
WHERE "owner_user_id" IN (
  SELECT "id" FROM "users" WHERE "role" = 'TRADER'
);

UPDATE "commands"
SET "actor_user_id" = NULL
WHERE "actor_user_id" IN (
  SELECT "id" FROM "users" WHERE "role" = 'TRADER'
);

UPDATE "audit_logs"
SET "actor_user_id" = NULL
WHERE "actor_user_id" IN (
  SELECT "id" FROM "users" WHERE "role" = 'TRADER'
);

UPDATE "users"
SET "created_by_id" = NULL
WHERE "created_by_id" IN (
  SELECT "id" FROM "users" WHERE "role" = 'TRADER'
);

-- Terminals created by TRADER cannot keep FK; reassign is not automatic — block delete if any remain.
-- Prefer deleting only traders who did not create terminals; otherwise null is invalid (createdById required).
-- Delete sessions for traders first, then users with no created terminals.
DELETE FROM "sessions"
WHERE "user_id" IN (
  SELECT "id" FROM "users" WHERE "role" = 'TRADER'
);

DELETE FROM "users"
WHERE "role" = 'TRADER'
  AND NOT EXISTS (
    SELECT 1 FROM "terminals" t WHERE t."created_by_id" = "users"."id"
  );

-- Any remaining TRADER rows (created terminals) demote to STAFF so enum can drop.
UPDATE "users" SET "role" = 'STAFF' WHERE "role" = 'TRADER';

CREATE TYPE "Role_new" AS ENUM ('SUPER_ADMIN', 'STAFF');
ALTER TABLE "users" ALTER COLUMN "role" TYPE "Role_new" USING ("role"::text::"Role_new");
DROP TYPE "Role";
ALTER TYPE "Role_new" RENAME TO "Role";
