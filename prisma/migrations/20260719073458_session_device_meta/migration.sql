-- AlterTable
ALTER TABLE "sessions" ADD COLUMN     "ip" VARCHAR(64),
ADD COLUMN     "last_seen_at" TIMESTAMP(3),
ADD COLUMN     "user_agent" TEXT;
