-- CreateExtension
CREATE EXTENSION IF NOT EXISTS vector;

-- AlterTable
ALTER TABLE "nodexs" ADD COLUMN     "embedding" vector(384);

