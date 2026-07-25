-- Complete member ↔ terminal / command / session wiring missing from add_member.

-- AlterTable: members
CREATE UNIQUE INDEX "members_email_key" ON "members"("email");

ALTER TABLE "members" ADD COLUMN "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- CreateTable: member_sessions
CREATE TABLE "member_sessions" (
    "id" TEXT NOT NULL,
    "member_id" TEXT NOT NULL,
    "token_hash" TEXT NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "user_agent" TEXT,
    "ip" VARCHAR(64),
    "last_seen_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "member_sessions_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "member_sessions_token_hash_key" ON "member_sessions"("token_hash");

CREATE INDEX "member_sessions_member_id_idx" ON "member_sessions"("member_id");

ALTER TABLE "member_sessions" ADD CONSTRAINT "member_sessions_member_id_fkey" FOREIGN KEY ("member_id") REFERENCES "members"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AlterTable: terminals — member owner + nullable legacy user owner
ALTER TABLE "terminals" ADD COLUMN "owner_member_id" TEXT;

CREATE INDEX "terminals_owner_member_id_idx" ON "terminals"("owner_member_id");

ALTER TABLE "terminals" ADD CONSTRAINT "terminals_owner_member_id_fkey" FOREIGN KEY ("owner_member_id") REFERENCES "members"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "terminals" ALTER COLUMN "owner_user_id" DROP NOT NULL;

-- AlterTable: commands — member actor
ALTER TABLE "commands" ADD COLUMN "actor_member_id" TEXT;

ALTER TABLE "commands" ADD CONSTRAINT "commands_actor_member_id_fkey" FOREIGN KEY ("actor_member_id") REFERENCES "members"("id") ON DELETE SET NULL ON UPDATE CASCADE;
