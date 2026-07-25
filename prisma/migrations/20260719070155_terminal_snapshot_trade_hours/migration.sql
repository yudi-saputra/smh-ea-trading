-- AlterTable
ALTER TABLE "terminal_snapshots" ADD COLUMN     "trade_end_min" INTEGER,
ADD COLUMN     "trade_start_min" INTEGER,
ADD COLUMN     "trade_time" BOOLEAN;
