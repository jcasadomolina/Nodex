-- CreateTable
CREATE TABLE "tasks" (
    "nodex_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'todo',
    "due_at" TIMESTAMPTZ(6),
    "position" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "completed_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "tasks_pkey" PRIMARY KEY ("nodex_id")
);

-- CreateIndex
CREATE INDEX "tasks_user_id_status_position_idx" ON "tasks"("user_id", "status", "position");

-- CreateIndex
CREATE INDEX "tasks_user_id_due_at_idx" ON "tasks"("user_id", "due_at");

-- CreateIndex
CREATE UNIQUE INDEX "tasks_nodex_id_user_id_key" ON "tasks"("nodex_id", "user_id");

-- AddForeignKey
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_nodex_id_user_id_fkey" FOREIGN KEY ("nodex_id", "user_id") REFERENCES "nodexs"("id", "user_id") ON DELETE CASCADE ON UPDATE CASCADE;

