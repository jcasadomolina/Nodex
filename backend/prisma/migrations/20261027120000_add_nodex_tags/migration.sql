-- CreateTable
CREATE TABLE "nodex_tags" (
    "nodex_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "nodex_tags_pkey" PRIMARY KEY ("nodex_id","name")
);

-- CreateIndex
CREATE INDEX "nodex_tags_user_id_name_idx" ON "nodex_tags"("user_id", "name");

-- AddForeignKey
ALTER TABLE "nodex_tags" ADD CONSTRAINT "nodex_tags_nodex_id_user_id_fkey" FOREIGN KEY ("nodex_id", "user_id") REFERENCES "nodexs"("id", "user_id") ON DELETE CASCADE ON UPDATE CASCADE;

