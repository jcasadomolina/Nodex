-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateTable
CREATE TABLE "users" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password_hash" TEXT,
    "avatar_url" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "oauth_accounts" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL,
    "provider" TEXT NOT NULL,
    "provider_account_id" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "oauth_accounts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sessions" (
    "sid" TEXT NOT NULL,
    "sess" JSONB NOT NULL,
    "expire" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "sessions_pkey" PRIMARY KEY ("sid")
);

-- CreateTable
CREATE TABLE "groups" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,
    "deleted_at" TIMESTAMPTZ(6),

    CONSTRAINT "groups_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "nodexs" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL,
    "type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT,
    "url" TEXT,
    "source" TEXT NOT NULL DEFAULT 'manual',
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,
    "deleted_at" TIMESTAMPTZ(6),

    CONSTRAINT "nodexs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "group_nodexs" (
    "group_id" UUID NOT NULL,
    "nodex_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "added_by" TEXT NOT NULL DEFAULT 'user',
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "group_nodexs_pkey" PRIMARY KEY ("group_id","nodex_id")
);

-- CreateTable
CREATE TABLE "nodex_enrichments" (
    "nodex_id" UUID NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "summary" TEXT,
    "sections" JSONB,
    "sources" JSONB,
    "error" TEXT,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "nodex_enrichments_pkey" PRIMARY KEY ("nodex_id")
);

-- CreateTable
CREATE TABLE "ai_suggestions" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL,
    "nodex_id" UUID NOT NULL,
    "kind" TEXT NOT NULL,
    "group_id" UUID,
    "suggested_name" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resolved_at" TIMESTAMPTZ(6),

    CONSTRAINT "ai_suggestions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "oauth_accounts_user_id_idx" ON "oauth_accounts"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "oauth_accounts_provider_provider_account_id_key" ON "oauth_accounts"("provider", "provider_account_id");

-- CreateIndex
CREATE INDEX "sessions_expire_idx" ON "sessions"("expire");

-- CreateIndex
CREATE INDEX "groups_user_id_idx" ON "groups"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "groups_id_user_id_key" ON "groups"("id", "user_id");

-- CreateIndex
CREATE UNIQUE INDEX "groups_user_id_name_key" ON "groups"("user_id", "name") WHERE (deleted_at IS NULL);

-- CreateIndex
CREATE INDEX "nodexs_user_id_created_at_idx" ON "nodexs"("user_id", "created_at" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "nodexs_id_user_id_key" ON "nodexs"("id", "user_id");

-- CreateIndex
CREATE INDEX "group_nodexs_nodex_id_idx" ON "group_nodexs"("nodex_id");

-- CreateIndex
CREATE INDEX "ai_suggestions_user_id_status_idx" ON "ai_suggestions"("user_id", "status");

-- CreateIndex
CREATE INDEX "ai_suggestions_nodex_id_idx" ON "ai_suggestions"("nodex_id");

-- AddForeignKey
ALTER TABLE "oauth_accounts" ADD CONSTRAINT "oauth_accounts_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "groups" ADD CONSTRAINT "groups_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "nodexs" ADD CONSTRAINT "nodexs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "group_nodexs" ADD CONSTRAINT "group_nodexs_group_id_user_id_fkey" FOREIGN KEY ("group_id", "user_id") REFERENCES "groups"("id", "user_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "group_nodexs" ADD CONSTRAINT "group_nodexs_nodex_id_user_id_fkey" FOREIGN KEY ("nodex_id", "user_id") REFERENCES "nodexs"("id", "user_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "nodex_enrichments" ADD CONSTRAINT "nodex_enrichments_nodex_id_fkey" FOREIGN KEY ("nodex_id") REFERENCES "nodexs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ai_suggestions" ADD CONSTRAINT "ai_suggestions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ai_suggestions" ADD CONSTRAINT "ai_suggestions_nodex_id_fkey" FOREIGN KEY ("nodex_id") REFERENCES "nodexs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ai_suggestions" ADD CONSTRAINT "ai_suggestions_group_id_fkey" FOREIGN KEY ("group_id") REFERENCES "groups"("id") ON DELETE SET NULL ON UPDATE CASCADE;
