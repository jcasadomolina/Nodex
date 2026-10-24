-- CreateTable
CREATE TABLE "link_previews" (
    "nodex_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "url" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "http_status" INTEGER,
    "title" TEXT,
    "description" TEXT,
    "image_url" TEXT,
    "site_name" TEXT,
    "archive_url" TEXT,
    "last_checked_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "link_previews_pkey" PRIMARY KEY ("nodex_id")
);

-- CreateIndex
CREATE INDEX "link_previews_last_checked_at_idx" ON "link_previews"("last_checked_at");

-- CreateIndex
CREATE INDEX "link_previews_user_id_status_idx" ON "link_previews"("user_id", "status");

-- CreateIndex
CREATE UNIQUE INDEX "link_previews_nodex_id_user_id_key" ON "link_previews"("nodex_id", "user_id");

-- AddForeignKey
ALTER TABLE "link_previews" ADD CONSTRAINT "link_previews_nodex_id_user_id_fkey" FOREIGN KEY ("nodex_id", "user_id") REFERENCES "nodexs"("id", "user_id") ON DELETE CASCADE ON UPDATE CASCADE;

