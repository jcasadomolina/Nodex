-- AlterTable
ALTER TABLE "nodexs" ADD COLUMN     "read_later_at" TIMESTAMPTZ(6);

-- AlterTable
ALTER TABLE "link_previews" ADD COLUMN     "reading_minutes" SMALLINT;

