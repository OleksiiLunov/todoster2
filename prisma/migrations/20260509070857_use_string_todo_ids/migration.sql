-- Browser-first ids are generated before persistence, so persisted ids must be text.
ALTER TABLE "TodoItem" DROP CONSTRAINT "TodoItem_listId_fkey";

ALTER TABLE "TodoList"
  ALTER COLUMN "id" DROP DEFAULT,
  ALTER COLUMN "id" TYPE TEXT USING "id"::TEXT;

DROP SEQUENCE IF EXISTS "TodoList_id_seq";

ALTER TABLE "TodoItem"
  ALTER COLUMN "id" DROP DEFAULT,
  ALTER COLUMN "id" TYPE TEXT USING "id"::TEXT,
  ALTER COLUMN "listId" TYPE TEXT USING "listId"::TEXT;

DROP SEQUENCE IF EXISTS "TodoItem_id_seq";

ALTER TABLE "TodoItem" RENAME COLUMN "ccreatedAt" TO "createdAt";

ALTER TABLE "TodoItem"
  ADD CONSTRAINT "TodoItem_listId_fkey"
  FOREIGN KEY ("listId") REFERENCES "TodoList"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;
