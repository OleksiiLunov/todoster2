ALTER TABLE "TodoList" ADD COLUMN "deletedAt" TIMESTAMP(3);

ALTER TABLE "TodoItem" ADD COLUMN "deletedAt" TIMESTAMP(3);

CREATE INDEX "TodoList_userId_deletedAt_position_idx"
  ON "TodoList"("userId", "deletedAt", "position");

CREATE INDEX "TodoItem_listId_deletedAt_position_idx"
  ON "TodoItem"("listId", "deletedAt", "position");
