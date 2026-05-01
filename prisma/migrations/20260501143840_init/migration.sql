-- CreateTable
CREATE TABLE "TodoList" (
    "id" SERIAL NOT NULL,
    "userId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "position" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TodoList_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TodoItem" (
    "id" SERIAL NOT NULL,
    "listId" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "position" INTEGER NOT NULL,
    "ccreatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "isDone" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "TodoItem_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "TodoList_userId_idx" ON "TodoList"("userId");

-- CreateIndex
CREATE INDEX "TodoList_userId_position_idx" ON "TodoList"("userId", "position");

-- CreateIndex
CREATE INDEX "TodoItem_listId_idx" ON "TodoItem"("listId");

-- CreateIndex
CREATE INDEX "TodoItem_listId_position_idx" ON "TodoItem"("listId", "position");

-- CreateIndex
CREATE INDEX "TodoItem_listId_isDone_position_idx" ON "TodoItem"("listId", "isDone", "position");

-- AddForeignKey
ALTER TABLE "TodoItem" ADD CONSTRAINT "TodoItem_listId_fkey" FOREIGN KEY ("listId") REFERENCES "TodoList"("id") ON DELETE CASCADE ON UPDATE CASCADE;
