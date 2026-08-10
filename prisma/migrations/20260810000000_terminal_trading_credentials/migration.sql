-- Per-terminal trading credentials + package (multi-akun EA)
ALTER TABLE "terminals" ADD COLUMN IF NOT EXISTS "package_id" TEXT;
ALTER TABLE "terminals" ADD COLUMN IF NOT EXISTS "password_trading" TEXT;
ALTER TABLE "terminals" ADD COLUMN IF NOT EXISTS "server_broker" TEXT;

-- Backfill from member so existing detail rows stay correct
UPDATE "terminals" t
SET
  "password_trading" = COALESCE(t."password_trading", m."password_trading"),
  "server_broker" = COALESCE(t."server_broker", m."server_broker"),
  "package_id" = COALESCE(t."package_id", m."package_id")
FROM "members" m
WHERE t."owner_member_id" = m."id";

CREATE INDEX IF NOT EXISTS "terminals_package_id_idx" ON "terminals"("package_id");

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'terminals_package_id_fkey'
  ) THEN
    ALTER TABLE "terminals"
      ADD CONSTRAINT "terminals_package_id_fkey"
      FOREIGN KEY ("package_id") REFERENCES "Package"("id")
      ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;
